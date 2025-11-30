"""
Location model with geospatial data
Uses latitude/longitude for SQLite, can be extended for PostGIS
"""

from extensions import db

class Location(db.Model):
    """Location model with geospatial data"""
    __tablename__ = 'locations'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    address = db.Column(db.String(500), nullable=True)
    building = db.Column(db.String(100), nullable=True)
    room = db.Column(db.String(50), nullable=True)
    
    # Always use latitude/longitude columns for compatibility
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    
    # Additional metadata
    description = db.Column(db.Text, nullable=True)
    is_accessible = db.Column(db.Boolean, default=True)
    
    def set_point(self, latitude, longitude):
        """Set location as a point"""
        self.latitude = latitude
        self.longitude = longitude
    
    def get_coordinates(self):
        """Get latitude and longitude"""
        return {
            'latitude': self.latitude,
            'longitude': self.longitude
        }
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'address': self.address,
            'building': self.building,
            'room': self.room,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'description': self.description,
            'is_accessible': self.is_accessible,
        }
    
    def __repr__(self):
        return f'<Location {self.name}>'
