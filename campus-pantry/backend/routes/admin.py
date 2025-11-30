"""
Admin routes
"""

from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.user import User, UserRole
from models.post import Post, PostStatus
from models.organization import Organization
from models.audit_log import AuditLog, AuditAction

admin_bp = Blueprint('admin', __name__)

def require_admin():
    """Decorator helper to check admin access"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user or user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        return None
    return user

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Get platform statistics"""
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Permission denied'}), 403
    
    from datetime import timedelta
    
    # User stats
    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    new_users_30d = User.query.filter(
        User.created_at >= datetime.utcnow() - timedelta(days=30)
    ).count()
    
    # Post stats
    total_posts = Post.query.count()
    active_posts = Post.query.filter_by(status='active').count()
    new_posts_30d = Post.query.filter(
        Post.created_at >= datetime.utcnow() - timedelta(days=30)
    ).count()
    
    # Organization stats
    total_orgs = Organization.query.count()
    verified_orgs = Organization.query.filter_by(is_verified=True).count()
    
    return jsonify({
        'users': {
            'total': total_users,
            'active': active_users,
            'new_30d': new_users_30d
        },
        'posts': {
            'total': total_posts,
            'active': active_posts,
            'new_30d': new_posts_30d
        },
        'organizations': {
            'total': total_orgs,
            'verified': verified_orgs
        }
    }), 200

@admin_bp.route('/posts/flagged', methods=['GET'])
@jwt_required()
def get_flagged_posts():
    """Get flagged posts for review"""
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Permission denied'}), 403
    
    # This would query posts that have been flagged
    # For now, return empty list
    return jsonify({'posts': []}), 200

@admin_bp.route('/organizations/<int:org_id>/verify', methods=['POST'])
@jwt_required()
def verify_organization(org_id):
    """Verify an organization"""
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Permission denied'}), 403
    
    org = Organization.query.get_or_404(org_id)
    org.is_verified = True
    org.verified_by = admin.id
    org.verified_at = datetime.utcnow()
    
    # Log action
    audit_log = AuditLog(
        action=AuditAction.ORG_VERIFIED,
        user_id=admin.id,
        target_id=org_id,
        target_type='organization'
    )
    audit_log.set_details({'organization_name': org.name})
    
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({'organization': org.to_dict()}), 200

