"""
Campus Pantry Flask Application
Main entry point for the backend API server
"""

from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
import os
from dotenv import load_dotenv

from config import Config
from extensions import db, redis_client, make_celery
from routes import register_routes

# Load environment variables
load_dotenv()

def create_app(config_class=Config):
    """Application factory pattern"""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    Migrate(app, db)
    JWTManager(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Initialize Redis
    redis_client.init_app(app)
    
    # Initialize Celery
    celery = make_celery(app)
    app.celery = celery
    
    # Register routes
    register_routes(app)
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)

