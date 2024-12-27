from flask import jsonify, request, current_app
from . import stacks_bp
from database import get_db
from models import Stack, StackSlot, Bot
from schemas import StackSchema, StackSlotSchema
from marshmallow import ValidationError

@stacks_bp.route('', methods=['GET', 'POST'])
def manage_stacks():
    db = get_db()
    if request.method == 'GET':
        stacks = db.execute('SELECT * FROM Stacks').fetchall()
        stack_list = []

        # Get all stacks
        for stack in stacks:
            # Get the orchestrator bot for this stack
            orchestrator = db.execute(
                '''
                SELECT id FROM Bots 
                WHERE id = (
                    SELECT orchestrator_bot_id 
                    FROM Stacks 
                    WHERE id = ?
                )
                ''', 
                (stack['id'],)
            ).fetchone()
            print(f"\n\norchestrator: {orchestrator['id']}\n\n")
            stack_data = StackSchema().dump(Stack.from_row(stack))
            # Get all agents (bots) in this stack's slots
            slots = db.execute(
                '''
                SELECT bot_id FROM StackSlots 
                WHERE stack_id = ? AND bot_id IS NOT NULL
                ORDER BY slot_number
                ''', 
                (stack['id'],)
            ).fetchall()
            agents = []
            if orchestrator:
                agents.append(orchestrator['id'])
            agents.extend([slot['bot_id'] for slot in slots])
            stack_data['agents'] = agents
            stack_list.append(stack_data)
            print(f"\n\nstack_list: {stack_list}\n\n")
        return jsonify(stack_list), 200
    elif request.method == 'POST':
        data = request.get_json()
        try:
            stack_data = StackSchema().load(data)
            db.execute(
                '''
                INSERT INTO Stacks (name, description, orchestrator_bot_id)
                VALUES (?, ?, ?)
                ''',
                (
                    stack_data['name'],
                    stack_data.get('description'),
                    stack_data.get('orchestrator_bot_id')
                )
            )
            db.commit()
            stack_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]
            return jsonify({'message': 'Stack created', 'id': stack_id}), 201
        except ValidationError as err:
            return jsonify(err.messages), 400

@stacks_bp.route('/<int:stack_id>', methods=['GET', 'PUT', 'DELETE'])
def stack_detail(stack_id):
    db = get_db()
    if request.method == 'GET':
        stack_row = db.execute('SELECT * FROM Stacks WHERE id = ?', (stack_id,)).fetchone()
        if not stack_row:
            return jsonify({'error': 'Stack not found'}), 404
        stack = Stack.from_row(stack_row)
        result = StackSchema().dump(stack)
        # Get all agents (bots) in this stack's slots
        slots = db.execute(
            '''
            SELECT bot_id FROM StackSlots 
            WHERE stack_id = ? AND bot_id IS NOT NULL
            ORDER BY slot_number
            ''', 
            (stack_id,)
        ).fetchall()
        result['agents'] = [slot['bot_id'] for slot in slots]
        return jsonify(result), 200
    elif request.method == 'PUT':
        data = request.get_json()
        try:
            stack_data = StackSchema().load(data)
            db.execute(
                '''
                UPDATE Stacks SET name = ?, description = ?, orchestrator_bot_id = ?
                WHERE id = ?
                ''',
                (
                    stack_data['name'],
                    stack_data.get('description'),
                    stack_data.get('orchestrator_bot_id'),
                    stack_id
                )
            )
            db.commit()
            return jsonify({'message': 'Stack updated'}), 200
        except ValidationError as err:
            return jsonify(err.messages), 400
    elif request.method == 'DELETE':
        db.execute('DELETE FROM Stacks WHERE id = ?', (stack_id,))
        db.commit()
        return jsonify({'message': 'Stack deleted'}), 200

@stacks_bp.route('/<int:stack_id>/slots', methods=['GET', 'POST'])
def manage_stack_slots(stack_id):
    db = get_db()
    if request.method == 'GET':
        slots = db.execute('SELECT * FROM StackSlots WHERE stack_id = ?', (stack_id,)).fetchall()
        slot_list = [StackSlotSchema().dump(StackSlot.from_row(slot)) for slot in slots]
        return jsonify(slot_list), 200
    elif request.method == 'POST':
        data = request.get_json()
        try:
            slot_data = StackSlotSchema().load(data)
            # Check if the slot number is already used in this stack
            existing_slot = db.execute(
                'SELECT * FROM StackSlots WHERE stack_id = ? AND slot_number = ?',
                (stack_id, slot_data['slot_number'])
            ).fetchone()
            if existing_slot:
                return jsonify({'error': 'Slot number already in use in this stack'}), 400
            db.execute(
                '''
                INSERT INTO StackSlots (stack_id, slot_number, bot_id)
                VALUES (?, ?, ?)
                ''',
                (
                    stack_id,
                    slot_data['slot_number'],
                    slot_data.get('bot_id')
                )
            )
            db.commit()
            slot_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]
            return jsonify({'message': 'Slot added', 'id': slot_id}), 201
        except ValidationError as err:
            return jsonify(err.messages), 400

@stacks_bp.route('/<int:stack_id>/slots/<int:slot_id>', methods=['GET', 'PUT', 'DELETE'])
def stack_slot_detail(stack_id, slot_id):
    db = get_db()
    if request.method == 'GET':
        slot_row = db.execute(
            'SELECT * FROM StackSlots WHERE id = ? AND stack_id = ?',
            (slot_id, stack_id)
        ).fetchone()
        if not slot_row:
            return jsonify({'error': 'Slot not found'}), 404
        slot = StackSlot.from_row(slot_row)
        result = StackSlotSchema().dump(slot)
        return jsonify(result), 200
    elif request.method == 'PUT':
        data = request.get_json()
        try:
            slot_data = StackSlotSchema().load(data)
            # Check if the new slot number is already used
            if 'slot_number' in slot_data:
                existing_slot = db.execute(
                    'SELECT * FROM StackSlots WHERE stack_id = ? AND slot_number = ? AND id != ?',
                    (stack_id, slot_data['slot_number'], slot_id)
                ).fetchone()
                if existing_slot:
                    return jsonify({'error': 'Slot number already in use in this stack'}), 400
            db.execute(
                '''
                UPDATE StackSlots SET slot_number = ?, bot_id = ?
                WHERE id = ? AND stack_id = ?
                ''',
                (
                    slot_data.get('slot_number', slot_row['slot_number']),
                    slot_data.get('bot_id', slot_row['bot_id']),
                    slot_id,
                    stack_id
                )
            )
            db.commit()
            return jsonify({'message': 'Slot updated'}), 200
        except ValidationError as err:
            return jsonify(err.messages), 400
    elif request.method == 'DELETE':
        db.execute('DELETE FROM StackSlots WHERE id = ? AND stack_id = ?', (slot_id, stack_id))
        db.commit()
        return jsonify({'message': 'Slot deleted'}), 200
