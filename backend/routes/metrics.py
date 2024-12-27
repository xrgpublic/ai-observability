from flask import jsonify, g
from . import metrics_bp
from database import get_db
import json

@metrics_bp.url_value_preprocessor
def preprocess_url_values(endpoint, values):
    g.bot_id = values.pop('bot_id', None)

@metrics_bp.route('/checkpoints/<int:checkpoint_id>/metrics', methods=['GET'])
def get_checkpoint_metrics(checkpoint_id):
    db = get_db()
    bot_id = g.bot_id
    
    if checkpoint_id == 0:
        cp_row = db.execute(
            'SELECT metrics FROM Checkpoints WHERE bot_id = ? ORDER BY checkpoint_number DESC LIMIT 1',
            (bot_id,)
        ).fetchone()
    else:
        cp_row = db.execute(
            'SELECT metrics FROM Checkpoints WHERE checkpoint_number = ? AND bot_id = ?',
            (checkpoint_id, bot_id)
        ).fetchone()
    
    if not cp_row:
        return jsonify({'message': 'Checkpoint not found'}), 404
    
    metrics = json.loads(cp_row['metrics']) if cp_row['metrics'] else {}
    return jsonify(metrics), 200
