from database import init_db
from app import create_app

app = create_app()
with app.app_context():
    init_db(app)
