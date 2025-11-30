"""
Flask extensions initialization
"""

from flask_sqlalchemy import SQLAlchemy
import redis
from celery import Celery

db = SQLAlchemy()

class RedisClient:
    """Simple Redis client wrapper"""
    def __init__(self):
        self.client = None
    
    def init_app(self, app):
        redis_url = app.config.get('REDIS_URL', 'redis://localhost:6379/0')
        self.client = redis.from_url(redis_url, decode_responses=True)
    
    def get(self, key):
        return self.client.get(key)
    
    def set(self, key, value, ex=None):
        return self.client.set(key, value, ex=ex)

redis_client = RedisClient()

def make_celery(app):
    """Create Celery instance"""
    celery = Celery(
        app.import_name,
        broker=app.config['CELERY_BROKER_URL'],
        backend=app.config['CELERY_RESULT_BACKEND']
    )
    celery.conf.update(app.config)
    return celery

celery = None  # Will be initialized in create_app

