from flask import jsonify, request, g
from . import sessions_bp
from database import get_db
from models import Session
from schemas import SessionSchema
from marshmallow import ValidationError
import json
from datetime import datetime

@sessions_bp.route('', methods=['POST'])
def start_session(bot_id):
    """Start a new session for a bot"""
    db = get_db()
    
    if not bot_id:
        return jsonify({'message': 'Bot ID is required'}), 400
        
    try:
        # First, end any existing active sessions for this bot
        db.execute(
            '''
            UPDATE Sessions 
            SET ended_at = ?
            WHERE bot_id = ? AND ended_at IS NULL
            ''',
            (datetime.utcnow(), bot_id)
        )
        
        # Create a new session
        db.execute(
            '''
            INSERT INTO Sessions (bot_id, started_at, messages)
            VALUES (?, ?, ?)
            ''',
            (bot_id, datetime.utcnow(), json.dumps([]))
        )
        db.commit()
        
        session_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]
        
        # Get the newly created session
        session = db.execute(
            'SELECT * FROM Sessions WHERE id = ?', (session_id,)
        ).fetchone()
        
        result = SessionSchema().dump(Session.from_row(session))
        return jsonify(result), 201
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@sessions_bp.route('/current', methods=['GET'])
def get_current_session(bot_id):
    """Get the current session"""
    db = get_db()
    
    if not bot_id:
        return jsonify({'message': 'Bot ID is required'}), 400
        
    # Get the most recent active session
    session = db.execute(
        '''
        SELECT * FROM Sessions 
        WHERE bot_id = ? AND ended_at IS NULL
        ORDER BY started_at DESC LIMIT 1
        ''', 
        (bot_id,)
    ).fetchone()
    
    if not session:
        return jsonify({'message': 'No active session found'}), 404
        
    result = SessionSchema().dump(Session.from_row(session))
    return jsonify(result), 200

@sessions_bp.route('/current', methods=['POST'])
def add_message_to_session(bot_id):
    """Add a message to the current session"""
    db = get_db()
    
    if not bot_id:
        return jsonify({'message': 'Bot ID is required'}), 400
        
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({'message': 'Message is required'}), 400
        
    # Get the current session
    session = db.execute(
        '''
        SELECT * FROM Sessions 
        WHERE bot_id = ? AND ended_at IS NULL
        ORDER BY started_at DESC LIMIT 1
        ''', 
        (bot_id,)
    ).fetchone()
    
    if not session:
        return jsonify({'message': 'No active session found'}), 404
        
    try:
        # Update the messages
        current_messages = json.loads(session['messages'])
        current_messages.append(data['message'])
        
        db.execute(
            '''
            UPDATE Sessions 
            SET messages = ?
            WHERE id = ?
            ''',
            (json.dumps(current_messages), session['id'])
        )
        db.commit()
        
        # Get the updated session
        updated_session = db.execute(
            'SELECT * FROM Sessions WHERE id = ?', (session['id'],)
        ).fetchone()
        
        result = SessionSchema().dump(Session.from_row(updated_session))
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@sessions_bp.route('/current/end', methods=['POST'])
def end_current_session(bot_id):
    """End the current session"""
    db = get_db()
    
    if not bot_id:
        return jsonify({'message': 'Bot ID is required'}), 400
        
    # Get the current session
    session = db.execute(
        '''
        SELECT * FROM Sessions 
        WHERE bot_id = ? AND ended_at IS NULL
        ORDER BY started_at DESC LIMIT 1
        ''', 
        (bot_id,)
    ).fetchone()
    
    if not session:
        return jsonify({'message': 'No active session found'}), 404
        
    try:
        # End the session
        db.execute(
            '''
            UPDATE Sessions 
            SET ended_at = ?
            WHERE id = ?
            ''',
            (datetime.utcnow(), session['id'])
        )
        db.commit()
        
        # Get the updated session
        updated_session = db.execute(
            'SELECT * FROM Sessions WHERE id = ?', (session['id'],)
        ).fetchone()
        
        result = SessionSchema().dump(Session.from_row(updated_session))
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500