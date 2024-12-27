from flask import jsonify, request, current_app
from . import bots_bp
from database import get_db
from config import Config
from models import Bot
from schemas import BotSchema
from marshmallow import ValidationError

@bots_bp.route('', methods=['GET', 'POST'])
def manage_bots():
    db = get_db()
    if request.method == 'GET':
        bots = db.execute('SELECT * FROM Bots').fetchall()
        print(bots)
        bot_list = [BotSchema().dump(Bot.from_row(bot)) for bot in bots]
        return jsonify(bot_list), 200
    elif request.method == 'POST':
        data = request.get_json()
        try:
            bot_data = BotSchema().load(data)
            db.execute(
                '''
                INSERT INTO Bots (name, description, default_system_prompt, orchestrator_bot)
                VALUES (?, ?, ?, ?)
                ''',
                (
                    bot_data['name'],
                    bot_data.get('description'),
                    bot_data.get('default_system_prompt'),
                    int(bot_data['orchestrator_bot'])
                )
            )
            db.commit()
            bot_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]
            return jsonify({'message': 'Bot created', 'id': bot_id}), 201
        except ValidationError as err:
            return jsonify(err.messages), 400

@bots_bp.route('/<int:bot_id>', methods=['GET', 'PUT', 'DELETE'])
def bot_detail(bot_id):
    print("received")
    db = get_db()
    if request.method == 'GET':
        bot_row = db.execute('SELECT * FROM Bots WHERE id = ?', (bot_id,)).fetchone()
        print(bot_row)
        if not bot_row:
            return jsonify({'error': 'Bot not found'}), 404
        bot = Bot.from_row(bot_row)
        result = BotSchema().dump(bot)
        return jsonify(result), 200
    elif request.method == 'PUT':
        data = request.get_json()
        try:
            bot_data = BotSchema().load(data)
            db.execute(
                '''
                UPDATE Bots SET name = ?, description = ?, default_system_prompt = ?, orchestrator_bot = ?
                WHERE id = ?
                ''',
                (
                    bot_data['name'],
                    bot_data.get('description'),
                    bot_data.get('default_system_prompt'),
                    bot_data.get('system_prompt'),
                    bot_data.get('model'),
                    int(bot_data['orchestrator_bot']),
                    bot_id
                )
            )
            db.commit()
            return jsonify({'message': 'Bot updated'}), 200
        except ValidationError as err:
            return jsonify(err.messages), 400
    elif request.method == 'DELETE':
        db.execute('DELETE FROM Bots WHERE id = ?', (bot_id,))
        db.commit()
        return jsonify({'message': 'Bot deleted'}), 200
