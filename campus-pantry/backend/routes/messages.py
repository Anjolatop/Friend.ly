"""
Message routes
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Post, User
from models.message import Message

messages_bp = Blueprint('messages', __name__)


@messages_bp.route('', methods=['POST'])
@jwt_required()
def send_message():
    """Send a message to the creator of a post"""
    data = request.get_json() or {}
    post_id = data.get('post_id')
    body = (data.get('body') or '').strip()

    if not post_id or not body:
        return jsonify({'error': 'post_id and body are required'}), 400

    post = Post.query.get(post_id)
    if not post:
        return jsonify({'error': 'Post not found'}), 404

    recipient_id = post.creator_id
    sender_id = int(get_jwt_identity())

    if recipient_id == sender_id:
        return jsonify({'error': 'You cannot message your own post'}), 400

    recipient = User.query.get(recipient_id)
    if not recipient or not recipient.is_active:
        return jsonify({'error': 'Recipient not available'}), 400

    msg = Message(
        sender_id=sender_id,
        recipient_id=recipient_id,
        post_id=post_id,
        body=body,
    )
    db.session.add(msg)
    db.session.commit()

    return jsonify({'message': msg.to_dict()}), 201
