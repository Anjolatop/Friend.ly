"""
Preference model for user settings
"""

from extensions import db
import json

class Preference(db.Model):
    """User preference model"""
    __tablename__ = 'preferences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    
    # Notification preferences
    notify_immediately = db.Column(db.Boolean, default=True)
    notify_daily_digest = db.Column(db.Boolean, default=False)
    notify_distance = db.Column(db.Float, default=1.0)  # km
    
    # Saved filters
    saved_filters = db.Column(db.Text, nullable=True)  # JSON string
    
    # Saved locations
    saved_locations = db.Column(db.Text, nullable=True)  # JSON string
    
    # Privacy settings
    show_name_on_claim = db.Column(db.Boolean, default=False)
    
    def get_saved_filters(self):
        """Get saved filters as dict"""
        if self.saved_filters:
            return json.loads(self.saved_filters)
        return {}
    
    def set_saved_filters(self, filters):
        """Set saved filters from dict"""
        self.saved_filters = json.dumps(filters)
    
    def get_saved_locations(self):
        """Get saved locations as list"""
        if self.saved_locations:
            return json.loads(self.saved_locations)
        return []
    
    def set_saved_locations(self, locations):
        """Set saved locations from list"""
        self.saved_locations = json.dumps(locations)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'notify_immediately': self.notify_immediately,
            'notify_daily_digest': self.notify_daily_digest,
            'notify_distance': self.notify_distance,
            'saved_filters': self.get_saved_filters(),
            'saved_locations': self.get_saved_locations(),
            'show_name_on_claim': self.show_name_on_claim,
        }
    
    def __repr__(self):
        return f'<Preference user_id={self.user_id}>'


