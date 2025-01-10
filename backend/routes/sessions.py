from flask import jsonify, request, Response, current_app
from flask_cors import cross_origin
from . import sessions_bp
from modular_intelligence.agents import BaseAgent
import json
from contextlib import contextmanager

# Global dictionary to store agent instances and their sessions in memory
_agents = {}
now_messages = []

@contextmanager
def get_agent(bot_id: int, checkpoint_id: int = None) -> BaseAgent:
    """Get or create an agent instance for a bot with proper thread handling."""
    agent = None
    try:
        global now_messages
        agent = BaseAgent()
        agent.load_from_db(bot_id=bot_id, checkpoint_id=checkpoint_id)
        
        # Initialize or restore session
        if bot_id in _agents:
            # Restore previous session messages
            stored_messages = _agents[bot_id]["session"]
            agent.session_messages = stored_messages
            now_messages = stored_messages.copy() if stored_messages else []
        else:
            # Initialize new session storage
            _agents[bot_id] = {
                "session": agent.session_messages
            }
            now_messages = agent.session_messages.copy() if agent.session_messages else []
        
        yield agent
        
        # Always update session storage after yield
        if bot_id in _agents:
            _agents[bot_id]["session"] = agent.session_messages.copy() if agent.session_messages else []
            now_messages = agent.session_messages.copy() if agent.session_messages else []
    finally:
        if agent and bot_id in _agents:
            # Ensure session state is saved
            _agents[bot_id]["session"] = agent.session_messages.copy() if agent.session_messages else []
            now_messages = agent.session_messages.copy() if agent.session_messages else []

def update_current_session(bot_id: int, messages: list[dict]):
    if bot_id in _agents:
        _agents[bot_id]["session"] = messages

def get_current_session(bot_id: int):
    return _agents[bot_id]["session"] if bot_id in _agents else []

@sessions_bp.route('/bot/<int:bot_id>/start', methods=['GET'])
def start_session(bot_id):
    """Start a new session for a bot"""
    try:
        with get_agent(bot_id) as agent:
            global now_messages
            agent.start_session()
            # Initialize with any preloaded context
            now_messages = agent.session_messages.copy() if agent.session_messages else []
            return jsonify(now_messages), 201
    except Exception as e:
        error = json.dumps({'error': str(e)})
        return Response(error, status=500, mimetype='application/json')


@sessions_bp.route('/bot/<int:bot_id>/load/<int:checkpoint_id>', methods=['GET'])
@cross_origin()
def get_current_session(bot_id, checkpoint_id):
    """Get the current session"""
    try:
        with get_agent(bot_id, checkpoint_id) as agent:
            global now_messages
            # Load messages from checkpoint
            now_messages = agent.session_messages.copy() if agent.session_messages else []
            messages = json.dumps(now_messages)
            return Response(messages, status=200, mimetype='application/json')
    except Exception as e:
        error = json.dumps({'error': str(e)})
        return Response(error, status=500, mimetype='application/json')


@sessions_bp.route('/bot/<int:bot_id>/message', methods=['POST', 'OPTIONS'])
@cross_origin()
def add_message_to_session(bot_id):
    """Add a message to the current session"""
    data = request.get_json()
    if not data or 'role' not in data or 'content' not in data:
        error = json.dumps({'error': 'Message role and content are required'})
        return Response(error, status=400, mimetype='application/json')

    try:
        with get_agent(bot_id) as agent:
            global now_messages
            if data['role'] == 'user':
                # Generate the agent's response
                now_messages.append({"role": "user", "content": data['content']})
                response = agent.generate_response(user_input=data['content'])
                now_messages.append({"role": "assistant", "content": response})
                # Update session storage with the complete conversation
                _agents[bot_id]["session"] = now_messages.copy() if now_messages else []
                
                # Return the entire conversation
                messages = json.dumps(now_messages)
                return Response(messages, status=201, mimetype='application/json')

            error = json.dumps({'error': 'Only user messages are accepted'})
            return Response(error, status=400, mimetype='application/json')

    except Exception as e:
        error = json.dumps({'error': str(e)})
        return Response(error, status=500, mimetype='application/json')


@sessions_bp.route('/bot/<int:bot_id>/end', methods=['GET', 'OPTIONS'])
@cross_origin()
def end_current_session(bot_id):
    """End the current session"""
    try:
        with get_agent(bot_id) as agent:
            global now_messages
            # Save current session messages to a checkpoint
            agent.session_messages = now_messages.copy() if now_messages else []
            agent.session_history = now_messages.copy() if now_messages else []
            agent.save_to_db()  # Save the current state to DB
            print(f"messages saved: {agent.session_messages}")
            
            # End the session and clear storage
            agent.end_session()
            
            # Clear both storages
            if bot_id in _agents:
                print(f"Clearing session storage for bot {bot_id}")
                _agents.pop(bot_id, None)
            
            now_messages = []
            
            # Return empty conversation state
            return jsonify([])

    except Exception as e:
        print(f"Error ending session: {str(e)}")
        return jsonify({'error': str(e)}), 500
