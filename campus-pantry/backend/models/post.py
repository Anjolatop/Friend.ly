"""
Post model
"""

from datetime import datetime
from extensions import db
import enum

class PostType(enum.Enum):
    SURPLUS = "surplus"  # Temporary leftover food
    RESOURCE = "resource"  # Permanent resource like food pantry

class PostStatus(enum.Enum):
    ACTIVE = "active"
    CLAIMED = "claimed"
    EXPIRED = "expired"
    REMOVED = "removed"

class Post(db.Model):
    """Post model for food offerings"""
    __tablename__ = 'posts'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    post_type = db.Column(db.Enum(PostType), default=PostType.SURPLUS, nullable=False)
    status = db.Column(db.Enum(PostStatus), default=PostStatus.ACTIVE, nullable=False)
    
    # Quantity
    quantity = db.Column(db.Integer, nullable=True)  # Nullable for unlimited resources
    quantity_claimed = db.Column(db.Integer, default=0)
    
    # Timing
    available_from = db.Column(db.DateTime, nullable=False)
    available_until = db.Column(db.DateTime, nullable=False)
    pickup_instructions = db.Column(db.Text, nullable=True)
    
    # Media
    image_url = db.Column(db.String(500), nullable=True)
    
    # Visibility
    is_public = db.Column(db.Boolean, default=True)
    
    # Relationships
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=True)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=False)
    location = db.relationship('Location', backref='posts')
    
    # Many-to-many with tags
    tags = db.relationship('Tag', secondary='post_tags', backref='posts', lazy='dynamic')
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Analytics
    view_count = db.Column(db.Integer, default=0)
    claim_count = db.Column(db.Integer, default=0)
    
    def is_available(self):
        """Check if post is currently available"""
        now = datetime.utcnow()
        return (
            self.status == PostStatus.ACTIVE and
            self.available_from <= now <= self.available_until and
            (self.quantity is None or self.quantity_claimed < self.quantity)
        )
    
    def claim(self, quantity=1):
        """Claim food from this post"""
        if not self.is_available():
            return False
        
        if self.quantity is not None:
            if self.quantity_claimed + quantity > self.quantity:
                return False
            self.quantity_claimed += quantity
            
            if self.quantity_claimed >= self.quantity:
                self.status = PostStatus.CLAIMED
        
        self.claim_count += 1
        return True
    
    def to_dict(self, include_private=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'post_type': self.post_type.value,
            'status': self.status.value,
            'quantity': self.quantity,
            'quantity_claimed': self.quantity_claimed,
            'available_from': self.available_from.isoformat() if self.available_from else None,
            'available_until': self.available_until.isoformat() if self.available_until else None,
            'pickup_instructions': self.pickup_instructions,
            'image_url': self.image_url,
            'is_public': self.is_public,
            'is_available': self.is_available(),
            'location': self.location.to_dict() if self.location else None,
            'tags': [tag.to_dict() for tag in self.tags],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'view_count': self.view_count if include_private else None,
            'claim_count': self.claim_count if include_private else None,
        }
        
        if include_private:
            data['creator_id'] = self.creator_id
            data['organization_id'] = self.organization_id
        
        if self.organization:
            data['organization'] = self.organization.to_dict()
        
        return data
    
    def __repr__(self):
        return f'<Post {self.title}>'


