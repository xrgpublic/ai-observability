from flask import Flask
from flask_cors import CORS
from config import Config
from routes import bots_bp, checkpoints_bp, stacks_bp, metrics_bp, sessions_bp, images_bp, python_ide_bp, conversation_bp
from database import init_db
from werkzeug.exceptions import HTTPException
import logging
import os

def create_app(config=None):
    app = Flask(__name__)
    
    # Configure CORS to allow frontend requests
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "expose_headers": ["Content-Type", "Authorization"],
            "max_age": 600,
            "allow_redirects": True
        }
    })

    if config is None:
        app.config.from_object(Config)
    else:
        app.config.update(config)

    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass


    # Register Blueprints
    app.register_blueprint(bots_bp, url_prefix='/api/v1/bots')
    app.register_blueprint(checkpoints_bp, url_prefix='/api/v1/bots/<int:bot_id>/checkpoints')
    app.register_blueprint(stacks_bp, url_prefix='/api/v1/stacks')
    #app.register_blueprint(metrics_bp, url_prefix='/api/v1/bots/<int:bot_id>/metrics')
    app.register_blueprint(sessions_bp, url_prefix='/api/v1/sessions')
    app.register_blueprint(images_bp, url_prefix='/api/v1/images')
    app.register_blueprint(python_ide_bp, url_prefix='/api/v1/python-ide')
    app.register_blueprint(conversation_bp, url_prefix='/api/v1/conversation')

    # Error Handlers
    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        response = e.get_response()
        response.data = {
            "code": e.code,
            "name": e.name,
            "description": e.description,
        }
        response.content_type = "application/json"
        return response, e.code

    @app.errorhandler(Exception)
    def handle_exception(e):
        logging.exception("An unexpected error occurred.")
        return {"error": "Internal Server Error"}, 500

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='127.0.0.1', debug=True, port=5000)