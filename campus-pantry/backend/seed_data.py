"""
Seed script to add placeholder food posts across America
"""

from app import create_app
from extensions import db
from models import User, Organization, Post, Location, Tag
from models.post import PostType, PostStatus
from models.user import UserRole
from datetime import datetime, timedelta
import random

def seed_data():
    """Seed database with placeholder food posts"""
    app = create_app()
    
    with app.app_context():
        # Create a test organization if it doesn't exist
        org = Organization.query.filter_by(email='dining@campus.edu').first()
        if not org:
            org = Organization(
                name='Campus Dining Services',
                description='Main campus dining hall',
                email='dining@campus.edu',
                is_verified=True,
                is_active=True
            )
            db.session.add(org)
            db.session.flush()
        
        # Create a test user if it doesn't exist
        user = User.query.filter_by(email='test@campus.edu').first()
        if not user:
            user = User(
                email='test@campus.edu',
                username='testuser',
                first_name='Test',
                last_name='User',
                role=UserRole.ORGANIZATION,
                organization_id=org.id,
                is_verified=True,
                is_active=True
            )
            user.set_password('test123')
            db.session.add(user)
            db.session.flush()
        
        # Get or create tags
        tags_map = {}
        tag_slugs = ['vegetarian', 'vegan', 'halal', 'hot', 'cold', 'produce']
        for slug in tag_slugs:
            tag = Tag.query.filter_by(slug=slug).first()
            if tag:
                tags_map[slug] = tag
        
        # Sample locations across America (major cities)
        locations_data = [
            {'name': 'Main Dining Hall', 'address': '123 University Ave, New York, NY', 'lat': 40.7128, 'lng': -74.0060, 'city': 'New York, NY'},
            {'name': 'Student Center Cafe', 'address': '456 Campus Drive, Los Angeles, CA', 'lat': 34.0522, 'lng': -118.2437, 'city': 'Los Angeles, CA'},
            {'name': 'Library Coffee Shop', 'address': '789 College Blvd, Chicago, IL', 'lat': 41.8781, 'lng': -87.6298, 'city': 'Chicago, IL'},
            {'name': 'Campus Food Pantry', 'address': '321 Main St, Houston, TX', 'lat': 29.7604, 'lng': -95.3698, 'city': 'Houston, TX'},
            {'name': 'Dining Commons', 'address': '555 University Way, Miami, FL', 'lat': 25.7617, 'lng': -80.1918, 'city': 'Miami, FL'},
            {'name': 'Student Union', 'address': '888 Campus Circle, Philadelphia, PA', 'lat': 39.9526, 'lng': -75.1652, 'city': 'Philadelphia, PA'},
            {'name': 'Cafeteria', 'address': '222 College Ave, Phoenix, AZ', 'lat': 33.4484, 'lng': -112.0740, 'city': 'Phoenix, AZ'},
            {'name': 'Food Court', 'address': '777 University Plaza, Dallas, TX', 'lat': 32.7767, 'lng': -96.7970, 'city': 'Dallas, TX'},
            {'name': 'Dining Hall', 'address': '999 Campus Road, San Francisco, CA', 'lat': 37.7749, 'lng': -122.4194, 'city': 'San Francisco, CA'},
            {'name': 'Student Cafe', 'address': '111 Main Campus, Seattle, WA', 'lat': 47.6062, 'lng': -122.3321, 'city': 'Seattle, WA'},
        ]
        
        # Sample food posts with image URLs (using Unsplash for placeholder images)
        food_posts = [
            {'title': 'Fresh Pizza Slices', 'description': 'Leftover pizza from lunch service. Pepperoni and cheese available.', 'type': 'surplus', 'quantity': 15, 'tags': ['hot', 'vegetarian'], 'hours_from_now': 0, 'hours_until': 4, 'image': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop'},
            {'title': 'Sandwich Platters', 'description': 'Assorted sandwich platters from catering event. Turkey, ham, and vegetarian options.', 'type': 'surplus', 'quantity': 8, 'tags': ['cold'], 'hours_from_now': 1, 'hours_until': 6, 'image': 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=800&h=600&fit=crop'},
            {'title': 'Fresh Salad Bar', 'description': 'Daily salad bar with fresh vegetables and dressings. Available until closing.', 'type': 'resource', 'quantity': None, 'tags': ['vegetarian', 'vegan', 'produce'], 'hours_from_now': 0, 'hours_until': 8, 'image': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop'},
            {'title': 'Bagels and Pastries', 'description': 'Fresh bagels, muffins, and pastries from morning service.', 'type': 'surplus', 'quantity': 20, 'tags': ['vegetarian'], 'hours_from_now': 2, 'hours_until': 5, 'image': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&h=600&fit=crop'},
            {'title': 'Soup Station', 'description': 'Hot soup available - tomato, chicken noodle, and vegetable options.', 'type': 'resource', 'quantity': None, 'tags': ['hot'], 'hours_from_now': 0, 'hours_until': 7, 'image': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&h=600&fit=crop'},
            {'title': 'Fruit Baskets', 'description': 'Fresh fruit baskets - apples, bananas, oranges, and grapes.', 'type': 'surplus', 'quantity': 12, 'tags': ['vegetarian', 'vegan', 'produce'], 'hours_from_now': 0, 'hours_until': 6, 'image': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&h=600&fit=crop'},
            {'title': 'Halal Meal Options', 'description': 'Halal-certified meals available daily. Chicken and rice dishes.', 'type': 'resource', 'quantity': None, 'tags': ['halal', 'hot'], 'hours_from_now': 0, 'hours_until': 8, 'image': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop'},
            {'title': 'Dessert Trays', 'description': 'Assorted cookies, brownies, and cake slices from event.', 'type': 'surplus', 'quantity': 25, 'tags': ['vegetarian'], 'hours_from_now': 1, 'hours_until': 5, 'image': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&h=600&fit=crop'},
            {'title': 'Breakfast Items', 'description': 'Leftover breakfast items - scrambled eggs, bacon, and hash browns.', 'type': 'surplus', 'quantity': 10, 'tags': ['hot'], 'hours_from_now': 3, 'hours_until': 6, 'image': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&h=600&fit=crop'},
            {'title': 'Vegetarian Wraps', 'description': 'Fresh vegetable wraps with hummus and fresh vegetables.', 'type': 'surplus', 'quantity': 15, 'tags': ['vegetarian', 'vegan', 'cold'], 'hours_from_now': 0, 'hours_until': 4, 'image': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&h=600&fit=crop'},
        ]
        
        # Clear existing posts (optional - comment out if you want to keep existing data)
        # Post.query.delete()
        # Location.query.filter(Location.id.in_([loc.id for loc in Location.query.all() if loc.posts.count() == 0])).delete()
        
        # Create posts for each location
        posts_created = 0
        for i, loc_data in enumerate(locations_data):
            # Create location
            location = Location(
                name=loc_data['name'],
                address=loc_data['address'],
                description=f"Food location in {loc_data['city']}"
            )
            location.set_point(loc_data['lat'], loc_data['lng'])
            db.session.add(location)
            db.session.flush()
            
            # Create 1-2 posts per location
            num_posts = random.randint(1, 2)
            for j in range(num_posts):
                food = food_posts[(i * 2 + j) % len(food_posts)]
                
                now = datetime.utcnow()
                available_from = now + timedelta(hours=food['hours_from_now'])
                available_until = now + timedelta(hours=food['hours_until'])
                
                post = Post(
                    title=food['title'],
                    description=food['description'],
                    post_type=PostType(food['type']),
                    status=PostStatus.ACTIVE,
                    quantity=food['quantity'],
                    quantity_claimed=0,
                    available_from=available_from,
                    available_until=available_until,
                    pickup_instructions=f"Available at {loc_data['name']}. Ask at the front desk.",
                    image_url=food.get('image', None),
                    is_public=True,
                    creator_id=user.id,
                    organization_id=org.id,
                    location_id=location.id
                )
                
                # Add tags
                post_tags = [tags_map[tag] for tag in food['tags'] if tag in tags_map]
                post.tags = post_tags
                
                db.session.add(post)
                posts_created += 1
        
        db.session.commit()
        print(f"[OK] Created {posts_created} food posts across {len(locations_data)} locations in America")
        print(f"[OK] Organization: {org.name} (ID: {org.id})")
        print(f"[OK] Test user: {user.email} (password: test123)")

if __name__ == '__main__':
    seed_data()

