"""
Database initialization script
Creates initial tags and optionally creates a test admin user
"""

from app import create_app
from extensions import db
from models import User, Organization, Tag, Preference
from models.user import UserRole

def init_database():
    """Initialize database with default data"""
    app = create_app()
    
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Create default tags
        default_tags = [
            {'name': 'Vegetarian', 'slug': 'vegetarian', 'description': 'Vegetarian options available'},
            {'name': 'Vegan', 'slug': 'vegan', 'description': 'Vegan options available'},
            {'name': 'Halal', 'slug': 'halal', 'description': 'Halal certified'},
            {'name': 'Kosher', 'slug': 'kosher', 'description': 'Kosher certified'},
            {'name': 'Gluten-Free', 'slug': 'gluten-free', 'description': 'Gluten-free options'},
            {'name': 'Dairy-Free', 'slug': 'dairy-free', 'description': 'Dairy-free options'},
            {'name': 'Needs Refrigeration', 'slug': 'refrigerated', 'description': 'Requires refrigeration'},
            {'name': 'Hot Food', 'slug': 'hot', 'description': 'Hot food'},
            {'name': 'Cold Food', 'slug': 'cold', 'description': 'Cold food'},
            {'name': 'Fresh Produce', 'slug': 'produce', 'description': 'Fresh fruits and vegetables'},
        ]
        
        for tag_data in default_tags:
            existing_tag = Tag.query.filter_by(slug=tag_data['slug']).first()
            if not existing_tag:
                tag = Tag(
                    name=tag_data['name'],
                    slug=tag_data['slug'],
                    description=tag_data['description']
                )
                db.session.add(tag)
        
        db.session.commit()
        print("[OK] Database initialized with default tags")
        
        # Optionally create admin user (skip in non-interactive mode)
        try:
            admin_email = input("Create admin user? Enter email (or press Enter to skip): ").strip()
            if admin_email:
                password = input("Enter password: ").strip()
                if password:
                    admin = User(
                        email=admin_email,
                        role=UserRole.ADMIN,
                        is_verified=True,
                        is_active=True
                    )
                    admin.set_password(password)
                    db.session.add(admin)
                    
                    # Create preferences for admin
                    preference = Preference(user_id=admin.id)
                    db.session.add(preference)
                    
                    db.session.commit()
                    print(f"[OK] Admin user created: {admin_email}")
        except (EOFError, KeyboardInterrupt):
            print("[SKIP] Skipping admin user creation (non-interactive mode)")

if __name__ == '__main__':
    init_database()

