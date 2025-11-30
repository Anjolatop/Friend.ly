"""
User model
"""

from datetime import datetime
from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
import enum

class UserRole(enum.Enum):
    STUDENT = "student"
    ORGANIZATION = "organization"
    ADMIN = "admin"
    MODERATOR = "moderator"
    VOLUNTEER = "volunteer"

class User(db.Model):
    """User model for students, organizations, and admins"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    username = db.Column(db.String(100), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=True)  # Nullable for SSO users
    first_name = db.Column(db.String(100), nullable=True)
    last_name = db.Column(db.String(100), nullable=True)
    role = db.Column(db.Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    campus_id = db.Column(db.String(50), unique=True, nullable=True)  # Campus SSO ID
    
    # Privacy settings
    is_anonymous = db.Column(db.Boolean, default=True)  # Don't show name when claiming food
    
    # Account status
    is_verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=True)
    organization = db.relationship('Organization', backref='members', foreign_keys=[organization_id])
    
    posts = db.relationship('Post', backref='creator', lazy='dynamic', foreign_keys='Post.creator_id')
    ratings = db.relationship('Rating', backref='user', lazy='dynamic')
    notifications = db.relationship('Notification', backref='user', lazy='dynamic')
    preferences = db.relationship('Preference', backref='user', uselist=False)
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password against hash"""
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self, include_private=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'email': self.email if include_private else None,
            'username': self.username,
            'first_name': self.first_name if not self.is_anonymous or include_private else None,
            'last_name': self.last_name if not self.is_anonymous or include_private else None,
            'role': self.role.value,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_private:
            data['organization_id'] = self.organization_id
            data['is_active'] = self.is_active
        return data
    
    def __repr__(self):
        return f'<User {self.email}>'


