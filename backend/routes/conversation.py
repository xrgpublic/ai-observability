from flask import Blueprint, request, jsonify, Response, stream_with_context
from qdrant_client import QdrantClient, models
from ollama import embed, chat
import numpy as np
import json
from typing import Generator
import time
from modular_intelligence.agents import BaseAgent
from flask_cors import cross_origin
from . import conversation_bp

# Initialize Qdrant client
qdrant_client = QdrantClient(host='host.docker.internal', port=6333)
#qdrant_client = QdrantClient(host='localhost', port=6333)

# Create the webpage_content collection if it doesn't exist
# try:
#     qdrant_client.get_collection('webpage_content')
# except Exception:
#     qdrant_client.create_collection(
#         collection_name='webpage_content',
#         vectors_config=models.VectorParams(
#             size=768,  # nomic-embed-text dimension
#             distance=models.Distance.COSINE
#         )
#     )

if not qdrant_client.collection_exists("webpage_content"):
   qdrant_client.create_collection(
      collection_name="webpage_content",
      vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
   )

def get_embedding(text: str) -> list[float]:
    """Get embeddings for the given text using nomic-embed-text"""
    response = embed(model='nomic-embed-text', prompt=text)
    return response['embeddings']

def stream_chat_response(prompt: str) -> Generator[str, None, None]:
    """Stream the chat response token by token"""
    response = chat(
        model='llama2',
        messages=[
            {
                'role': 'system',
                'content': 'You are an AI assistant that helps users interact with and modify webpages. You have access to relevant context about the webpage and can suggest modifications.'
            },
            {
                'role': 'user',
                'content': prompt
            }
        ],
        stream=True
    )
    
    for chunk in response:
        if 'message' in chunk and chunk['message'].get('content'):
            yield f"data: {json.dumps({'type': 'token', 'content': chunk['message']['content']})}\n\n"
            time.sleep(0.02)  # Small delay for smoother streaming

def format_conversation_prompt(user_message: str, context: str) -> str:
    """Format the conversation prompt with context"""
    return f"""Context about the webpage:
{context}

User message: {user_message}"""

@conversation_bp.route('/test', methods=['GET'])
def test():
    return jsonify({'message': 'Webpage agent works!'}), 200


@conversation_bp.route('', methods=['POST', 'OPTIONS'])
@cross_origin(origins=['http://localhost:5173', 'http://127.0.0.1:5173'], 
             methods=['POST', 'OPTIONS'],
             allow_headers=['Content-Type', 'Authorization'],
             supports_credentials=True,
             max_age=600)
def handle_conversation():
    """
    Example route that:
      1) Receives user message
      2) Calls LLM with a ReAct system prompt to produce JSON
      3) Optionally checks "searchNeeded" to do RAG
      4) Returns the final {request, searchNeeded, code}
    """
    try:
        data = request.json
        user_message = data.get('message', '')

        if not user_message:
            return jsonify({'error': 'No message provided'}), 400

        # 1) Prompt LLM for structured JSON
        # For example:
        system_prompt = """You are an AI that returns JSON with this structure:
{
  "request": "<summary of user request>",
  "searchNeeded": false,
  "code": "<code response>",
  "codeType": "<type of code: html, javascript, css, or mixed>"
}
Do not include any text outside of JSON. 
If you think you need more information from a knowledge base, set searchNeeded to true.
For code responses:
- If returning HTML, include necessary CSS and JS inline
- If returning pure JavaScript, do not wrap in HTML
- Always specify the codeType accurately
"""
        
        agent = BaseAgent(name="ReActAgent", system_prompt=system_prompt)
        agent.start_session()
        raw_response = agent.generate_response(user_input=user_message,create_checkpoint=True)
        
        # raw_response should be a JSON string. Example:
        # {
        #   "request": "User wants a red button",
        #   "searchNeeded": false,
        #   "code": "<button style='background:red'>Click Me</button>",
        #   "codeType": "html"
        # }

        # 2) Parse JSON safely
        try:
            parsed = json.loads(raw_response)
        except Exception as e:
            # If parse fails, fallback
            return jsonify({
                'error': 'Failed to parse AI JSON',
                'raw': raw_response
            }), 500

        request_text = parsed.get('request', '')
        search_needed = parsed.get('searchNeeded', False)
        code = parsed.get('code', '')
        code_type = parsed.get('codeType', 'mixed')

        # Validate and format code based on type
        if code and code_type != 'html' and code_type != 'mixed':
            # Wrap non-HTML code in appropriate tags for iframe display
            code = f"""
<!DOCTYPE html>
<html>
<head><title>Code Preview</title></head>
<body>
<pre><code>{code}</code></pre>
<script>
// For JavaScript code, also execute it
if ({json.dumps(code_type)} === 'javascript') {{
    try {{
        eval({json.dumps(code)});
    }} catch (e) {{
        console.error('Code execution error:', e);
    }}
}}
</script>
</body>
</html>
"""

        # 4) Return final JSON to frontend
        return jsonify({
            'request': request_text,
            'searchNeeded': search_needed,
            'code': code,
            'codeType': code_type
        })

    except Exception as e:
        return jsonify({
            'error': str(e),
        }), 500


@conversation_bp.route('/search', methods=['POST'])
@cross_origin()
def handle_search():
    
    try:
        data = request.json
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400

        # Get embedding for the user message
        message_embedding = get_embedding(user_message)

        # Search Qdrant for relevant context
        search_result = qdrant_client.search(
            collection_name="webpage_content",
            query_vector=message_embedding,
            limit=3
        )

        # Extract relevant context
        context = "\n".join([hit.payload.get('content', '') for hit in search_result])
        
        # Format the conversation prompt
        prompt = format_conversation_prompt(user_message, context)

        # Stream the response
        return Response(
            stream_with_context(stream_chat_response(prompt)),
            mimetype='text/event-stream'
        )

    except Exception as e:
        error_response = json.dumps({'type': 'error', 'content': str(e)})
        return f"data: {error_response}\n\n", 500

# Utility endpoint to index webpage content
@conversation_bp.route('/index', methods=['POST'])
def index_content():
    try:
        data = request.json
        content = data.get('content', '')
        metadata = data.get('metadata', {})
        
        if not content:
            return jsonify({'error': 'No content provided'}), 400

        # Get embedding for the content
        embedding = get_embedding(content)

        # Store in Qdrant
        qdrant_client.upsert(
            collection_name="webpage_content",
            points=[
                models.PointStruct(
                    id=hash(content),  # Simple hash as ID
                    vector=embedding,
                    payload={
                        'content': content,
                        **metadata
                    }
                )
            ]
        )

        return jsonify({'message': 'Content indexed successfully'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
