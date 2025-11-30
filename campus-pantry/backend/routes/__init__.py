"""
Route registration
"""

from flask import Blueprint

def register_routes(app):
    """Register all route blueprints"""
    from .auth import auth_bp
    from .posts import posts_bp
    from .organizations import organizations_bp
    from .users import users_bp
    from .admin import admin_bp
    from .notifications import notifications_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(posts_bp, url_prefix='/api/posts')
    app.register_blueprint(organizations_bp, url_prefix='/api/organizations')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')


