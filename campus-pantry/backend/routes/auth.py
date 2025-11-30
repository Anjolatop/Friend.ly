"""
Authentication routes
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from extensions import db
from models.user import User, UserRole

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    # Allow students (default) and organizations to sign up explicitly
    role_value = data.get('role', UserRole.STUDENT.value)
    try:
        role = UserRole(role_value)
    except ValueError:
        return jsonify({'error': 'Invalid role. Use \"student\" or \"organization\".'}), 400
    
    if role == UserRole.ADMIN or role == UserRole.MODERATOR:
        return jsonify({'error': 'Cannot self-register as admin or moderator'}), 403
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    user = User(
        email=data['email'],
        username=data.get('username'),
        first_name=data.get('first_name'),
        last_name=data.get('last_name'),
        role=role
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    # JWT library expects subject to be a string; store user id as string
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict(include_private=True)
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login with email and password"""
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account is inactive'}), 403
    
    user.last_login = db.func.now()
    db.session.commit()
    
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict(include_private=True)
    }), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    current_user_id = get_jwt_identity()
    new_token = create_access_token(identity=str(current_user_id))
    return jsonify({'access_token': new_token}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information"""
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict(include_private=True)}), 200

@auth_bp.route('/sso', methods=['POST'])
def sso_login():
    """Campus SSO login (placeholder for SSO integration)"""
    # This would integrate with campus SSO system
    data = request.get_json()
    
    # Placeholder implementation
    return jsonify({'error': 'SSO not yet implemented'}), 501


