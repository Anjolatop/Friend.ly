"""
Organization routes
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.organization import Organization
from models.user import User, UserRole

organizations_bp = Blueprint('organizations', __name__)

@organizations_bp.route('', methods=['GET'])
def get_organizations():
    """Get all organizations"""
    organizations = Organization.query.filter_by(is_active=True).all()
    return jsonify({
        'organizations': [org.to_dict() for org in organizations]
    }), 200

@organizations_bp.route('/<int:org_id>', methods=['GET'])
def get_organization(org_id):
    """Get a single organization"""
    org = Organization.query.get_or_404(org_id)
    return jsonify({'organization': org.to_dict()}), 200

@organizations_bp.route('', methods=['POST'])
@jwt_required()
def create_organization():
    """Create a new organization"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        return jsonify({'error': 'Permission denied'}), 403
    
    data = request.get_json()
    
    org = Organization(
        name=data['name'],
        description=data.get('description'),
        email=data['email'],
        phone=data.get('phone'),
        website=data.get('website')
    )
    
    db.session.add(org)
    db.session.commit()
    
    return jsonify({'organization': org.to_dict()}), 201

@organizations_bp.route('/<int:org_id>/dashboard', methods=['GET'])
@jwt_required()
def get_org_dashboard(org_id):
    """Get organization dashboard data"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    org = Organization.query.get_or_404(org_id)
    
    # Check if user belongs to organization or is admin
    if user.organization_id != org_id and user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        return jsonify({'error': 'Permission denied'}), 403
    
    from models.post import Post
    from datetime import datetime, timedelta
    
    from models.post import PostStatus
    
    # Get stats
    total_posts = Post.query.filter_by(organization_id=org_id).count()
    active_posts = Post.query.filter_by(organization_id=org_id, status=PostStatus.ACTIVE).count()
    
    # Posts in last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_posts = Post.query.filter(
        Post.organization_id == org_id,
        Post.created_at >= thirty_days_ago
    ).count()
    
    # Total claims
    total_claims = db.session.query(db.func.sum(Post.claim_count)).filter(
        Post.organization_id == org_id
    ).scalar() or 0
    
    return jsonify({
        'organization': org.to_dict(),
        'stats': {
            'total_posts': total_posts,
            'active_posts': active_posts,
            'recent_posts': recent_posts,
            'total_claims': int(total_claims)
        }
    }), 200

