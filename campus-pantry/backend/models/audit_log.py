"""
Audit log model for tracking sensitive actions
"""

from datetime import datetime
from extensions import db
import enum
import json

class AuditAction(enum.Enum):
    POST_CREATED = "post_created"
    POST_MODIFIED = "post_modified"
    POST_DELETED = "post_deleted"
    POST_FLAGGED = "post_flagged"
    USER_BANNED = "user_banned"
    USER_VERIFIED = "user_verified"
    ORG_VERIFIED = "org_verified"
    ORG_SUSPENDED = "org_suspended"

class AuditLog(db.Model):
    """Audit log for tracking sensitive actions"""
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    action = db.Column(db.Enum(AuditAction), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    target_id = db.Column(db.Integer, nullable=True)  # ID of affected entity
    target_type = db.Column(db.String(50), nullable=True)  # 'post', 'user', 'organization'
    
    details = db.Column(db.Text, nullable=True)  # JSON string for additional info
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def set_details(self, details_dict):
        """Set details as JSON"""
        self.details = json.dumps(details_dict)
    
    def get_details(self):
        """Get details as dict"""
        if self.details:
            return json.loads(self.details)
        return {}
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'action': self.action.value,
            'user_id': self.user_id,
            'target_id': self.target_id,
            'target_type': self.target_type,
            'details': self.get_details(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
    
    def __repr__(self):
        return f'<AuditLog {self.action.value}>'


