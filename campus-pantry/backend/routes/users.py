"""
User routes
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.user import User
from models.preference import Preference

users_bp = Blueprint('users', __name__)

@users_bp.route('/me', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    return jsonify({'user': user.to_dict(include_private=True)}), 200

@users_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update current user profile"""
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    data = request.get_json()
    
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    if 'username' in data:
        user.username = data['username']
    if 'is_anonymous' in data:
        user.is_anonymous = data['is_anonymous']
    
    db.session.commit()
    
    return jsonify({'user': user.to_dict(include_private=True)}), 200

@users_bp.route('/me/preferences', methods=['GET'])
@jwt_required()
def get_preferences():
    """Get user preferences"""
    current_user_id = get_jwt_identity()
    preference = Preference.query.filter_by(user_id=current_user_id).first()
    
    if not preference:
        preference = Preference(user_id=current_user_id)
        db.session.add(preference)
        db.session.commit()
    
    return jsonify({'preferences': preference.to_dict()}), 200

@users_bp.route('/me/preferences', methods=['PUT'])
@jwt_required()
def update_preferences():
    """Update user preferences"""
    current_user_id = get_jwt_identity()
    preference = Preference.query.filter_by(user_id=current_user_id).first()
    
    if not preference:
        preference = Preference(user_id=current_user_id)
        db.session.add(preference)
    
    data = request.get_json()
    
    if 'notify_immediately' in data:
        preference.notify_immediately = data['notify_immediately']
    if 'notify_daily_digest' in data:
        preference.notify_daily_digest = data['notify_daily_digest']
    if 'notify_distance' in data:
        preference.notify_distance = data['notify_distance']
    if 'saved_filters' in data:
        preference.set_saved_filters(data['saved_filters'])
    if 'saved_locations' in data:
        preference.set_saved_locations(data['saved_locations'])
    if 'show_name_on_claim' in data:
        preference.show_name_on_claim = data['show_name_on_claim']
    
    db.session.commit()
    
    return jsonify({'preferences': preference.to_dict()}), 200


