# Checkpoints.py

from flask import jsonify, request, current_app, g
from . import checkpoints_bp
from database import get_db
from models import Checkpoint
from schemas import CheckpointSchema
from marshmallow import ValidationError
import json

# URL Value Preprocessor to extract bot_id from URL and store it in g
@checkpoints_bp.url_value_preprocessor
def preprocess_url_values(endpoint, values):
    g.bot_id = values.pop('bot_id', None)

@checkpoints_bp.route('', methods=['GET', 'POST'])
def manage_checkpoints():
    db = get_db()
    bot_id = g.bot_id
    if not bot_id:
        return jsonify({'message': 'Bot ID is required'}), 400

    if request.method == 'GET':
        # Fetch checkpoints for the specified bot_id
        checkpoints = db.execute(
            'SELECT * FROM Checkpoints WHERE bot_id = ?', (bot_id,)
        ).fetchall()
        # Deserialize and serialize data
        checkpoint_list = [CheckpointSchema().dump(Checkpoint.from_row(cp)) for cp in checkpoints]
        return jsonify(checkpoint_list), 200

    elif request.method == 'POST':
        data = request.get_json()
        try:
            cp_data = CheckpointSchema().load(data)
            
            # Get the next checkpoint number for this bot
            next_checkpoint = db.execute(
                'SELECT COALESCE(MAX(checkpoint_number), 0) + 1 FROM Checkpoints WHERE bot_id = ?',
                (bot_id,)
            ).fetchone()[0]
            
            # Serialize JSON fields before inserting into the database
            db.execute(
                '''
                INSERT INTO Checkpoints (bot_id, checkpoint_number, name, description, version, system_prompt, datasets, memories, session_history)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''',
                (
                    bot_id,
                    next_checkpoint,
                    cp_data.get('name', 'New Checkpoint'),
                    cp_data.get('description', ''),
                    cp_data.get('version', '1.0'),
                    cp_data.get('system_prompt'),
                    json.dumps(cp_data.get('datasets')) if cp_data.get('datasets') else None,
                    json.dumps(cp_data.get('memories')) if cp_data.get('memories') else None,
                    json.dumps(cp_data.get('session_history')) if cp_data.get('session_history') else None
                )
            )
            db.commit()
            cp_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]
            return jsonify({'message': 'Checkpoint created', 'id': cp_id, 'checkpoint_number': next_checkpoint}), 201
        except ValidationError as err:
            return jsonify({'message': err.messages}), 400
        except Exception as e:
            current_app.logger.error(f"Error creating checkpoint: {e}")
            return jsonify({'message': 'Internal server error'}), 500

@checkpoints_bp.route('/<int:checkpoint_id>', methods=['GET', 'PATCH'])
def checkpoint_detail(checkpoint_id):
    db = get_db()
    bot_id = g.bot_id
    if not bot_id:
        return jsonify({'message': 'Bot ID is required'}), 400

    # Handle checkpoint_id = 0 as the latest checkpoint
    if checkpoint_id == 0:
        cp_row = db.execute(
            'SELECT * FROM Checkpoints WHERE bot_id = ? ORDER BY checkpoint_number DESC LIMIT 1',
            (bot_id,)
        ).fetchone()
    else:
        cp_row = db.execute(
            'SELECT * FROM Checkpoints WHERE checkpoint_number = ? AND bot_id = ?',
            (checkpoint_id, bot_id)
        ).fetchone()

    if not cp_row:
        return jsonify({'message': 'Checkpoint not found'}), 404

    if request.method == 'GET':
        # Deserialize and serialize data
        checkpoint = Checkpoint.from_row(cp_row)
        result = CheckpointSchema().dump(checkpoint)
        return jsonify(result), 200

    elif request.method == 'PATCH':
        data = request.get_json()
        try:
            # Update only the fields that are provided
            update_fields = []
            update_values = []
            
            if 'name' in data:
                update_fields.append('name = ?')
                update_values.append(data['name'])
            
            if update_fields:
                update_values.extend([checkpoint_id, bot_id])
                db.execute(
                    f'''
                    UPDATE Checkpoints SET {', '.join(update_fields)}
                    WHERE checkpoint_number = ? AND bot_id = ?
                    ''',
                    update_values
                )
                db.commit()
                return jsonify({'message': 'Checkpoint updated'}), 200
            return jsonify({'message': 'No fields to update'}), 400
        except Exception as e:
            current_app.logger.error(f"Error updating checkpoint: {e}")
            return jsonify({'message': 'Internal server error'}), 500


@checkpoints_bp.route('/<int:checkpoint_id>', methods=['OPTIONS', 'DELETE'])
def handle_options(checkpoint_id):
    if request.method == 'OPTIONS':
        # Respond with CORS headers
        response = jsonify({'message': 'CORS preflight response'})
        response.headers.add('Access-Control-Allow-Origin', '*')  # Adjust '*' to your allowed origins
        response.headers.add('Access-Control-Allow-Methods', 'DELETE, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response, 200

    db = get_db()
    bot_id = g.bot_id
    try:
        print(f"Checkpoint {checkpoint_id} type{type(checkpoint_id)} deleted for bot {bot_id}")
        db.execute('DELETE FROM Checkpoints WHERE id = ?', (checkpoint_id,))
        db.commit()
        
        #print(f" fetchies: {db.fetchall()}")
        return jsonify({'message': 'Checkpoint deleted'}), 200
    except Exception as e:
        current_app.logger.error(f"Error deleting checkpoint: {e}")
        return jsonify({'message': 'Internal server error'}), 500

@checkpoints_bp.route('/<int:checkpoint_id>/session_history', methods=['GET'])
def get_checkpoint_session_history(checkpoint_id):
    db = get_db()
    bot_id = g.bot_id
    
    if checkpoint_id == 0:
        cp_row = db.execute(
            'SELECT session_history FROM Checkpoints WHERE bot_id = ? ORDER BY checkpoint_number DESC LIMIT 1',
            (bot_id,)
        ).fetchone()
    else:
        cp_row = db.execute(
            'SELECT session_history FROM Checkpoints WHERE checkpoint_number = ? AND bot_id = ?',
            (checkpoint_id, bot_id)
        ).fetchone()
    
    if not cp_row:
        return jsonify({'message': 'Checkpoint not found'}), 404
    
    history = json.loads(cp_row['session_history']) if cp_row['session_history'] else []
    return jsonify(history), 200

@checkpoints_bp.route('/<int:checkpoint_id>/context', methods=['GET'])
def get_checkpoint_context(checkpoint_id):
    db = get_db()
    bot_id = g.bot_id
    
    if checkpoint_id == 0:
        cp_row = db.execute(
            'SELECT session_history FROM Checkpoints WHERE bot_id = ? ORDER BY checkpoint_number DESC LIMIT 1',
            (bot_id,)
        ).fetchone()
    else:
        cp_row = db.execute(
            'SELECT session_history FROM Checkpoints WHERE checkpoint_number = ? AND bot_id = ?',
            (checkpoint_id, bot_id)
        ).fetchone()
    
    if not cp_row:
        return jsonify({'message': 'Checkpoint not found'}), 404
    
    context = json.loads(cp_row['session_history']) if cp_row['session_history'] else []
    return jsonify(context), 200
