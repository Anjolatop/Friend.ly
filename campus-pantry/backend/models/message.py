"""
Direct message model for users about posts
"""

from datetime import datetime
from extensions import db


class Message(db.Model):
    """Simple direct message from a user to a post creator"""
    __tablename__ = 'messages'

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    recipient_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    post = db.relationship('Post', backref='messages', foreign_keys=[post_id])
    sender = db.relationship('User', foreign_keys=[sender_id])
    recipient = db.relationship('User', foreign_keys=[recipient_id])

    def to_dict(self):
        return {
            'id': self.id,
            'post_id': self.post_id,
            'sender_id': self.sender_id,
            'recipient_id': self.recipient_id,
            'body': self.body,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'sender': {
                'id': self.sender.id,
                'email': self.sender.email,
                'username': self.sender.username,
            } if self.sender else None
        }
