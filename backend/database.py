import sqlite3
from flask import g, current_app
from pathlib import Path
from config import Config

def get_db(DB_PATH=Config.DATABASE):
    if 'db' not in g:
        g.db = sqlite3.connect(
            DB_PATH,
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row
        # Enable foreign key constraint support
        g.db.execute("PRAGMA foreign_keys = ON;")
    return g.db

def close_db(e=None):
    db = g.pop('db', None)

    if db is not None:
        db.close()

def init_db(app):
    app.teardown_appcontext(close_db)
    print("Initializing database...", Config.DATABASE)
    db_path = Path(Config.DATABASE)
    # Always reinitialize the database for this setup
    if db_path.exists():
        db_path.unlink()
    with app.app_context():
        db = get_db()
        with current_app.open_resource(Config.SCHEMA_PATH) as f:
            db.executescript(f.read().decode('utf8'))
        db.commit()
