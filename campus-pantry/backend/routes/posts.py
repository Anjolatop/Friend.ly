"""
Post routes
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.post import Post, PostStatus, PostType
from models.location import Location
from models.tag import Tag
from services.geo_service import GeoService
from services.post_service import PostService
from sqlalchemy import func
from datetime import datetime, timedelta

posts_bp = Blueprint('posts', __name__)
geo_service = GeoService()
post_service = PostService()

@posts_bp.route('', methods=['GET'])
def get_posts():
    """Get posts with optional filtering and geographic search"""
    # Query parameters
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    radius = request.args.get('radius', type=float, default=5.0)  # km
    tag_slugs = request.args.getlist('tags')
    post_type = request.args.get('type')
    status = request.args.get('status', 'active')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # Convert string status to enum if needed
    status_filter = PostStatus.ACTIVE
    if status == 'active':
        status_filter = PostStatus.ACTIVE
    elif status == 'claimed':
        status_filter = PostStatus.CLAIMED
    elif status == 'expired':
        status_filter = PostStatus.EXPIRED
    
    query = Post.query.filter(Post.status == status_filter)
    
    # Filter by type
    if post_type:
        try:
            query = query.filter(Post.post_type == PostType(post_type))
        except ValueError:
            pass
    
    # Geographic filtering
    if lat and lng:
        query = query.join(Location)
        # Check if using PostgreSQL with PostGIS
        from sqlalchemy import inspect
        engine = db.get_engine()
        is_postgres = 'postgresql' in str(engine.url)
        
        if is_postgres:
            # Use PostGIS ST_DWithin for distance-based search
            query = query.filter(
                func.ST_DWithin(
                    Location.geometry,
                    func.ST_MakePoint(lng, lat),
                    radius * 1000  # Convert km to meters
                )
            )
        else:
            # SQLite: Use simple distance calculation (Haversine formula approximation)
            # This is a simplified version - for production, use PostGIS
            from sqlalchemy import and_
            import math
            # Approximate bounding box filter (rough distance check)
            # 1 degree latitude ≈ 111 km, 1 degree longitude ≈ 111 km * cos(latitude)
            lat_range = radius / 111.0
            # Calculate longitude range using Python math instead of SQL function
            lng_range = radius / (111.0 * abs(math.cos(math.radians(lat))))
            query = query.filter(
                and_(
                    Location.latitude.between(lat - lat_range, lat + lat_range),
                    Location.longitude.between(lng - lng_range, lng + lng_range)
                )
            )
    
    # Filter by tags
    if tag_slugs:
        tags = Tag.query.filter(Tag.slug.in_(tag_slugs)).all()
        if tags:
            tag_ids = [tag.id for tag in tags]
            query = query.filter(Post.tags.any(Tag.id.in_(tag_ids)))
    
    # Pagination
    pagination = query.order_by(Post.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    posts = pagination.items
    
    # Calculate distances if lat/lng provided
    results = []
    for post in posts:
        post_dict = post.to_dict()
        if lat and lng and post.location:
            distance = geo_service.calculate_distance(
                lat, lng,
                post.location.get_coordinates()['latitude'],
                post.location.get_coordinates()['longitude']
            )
            post_dict['distance'] = round(distance, 2)
        results.append(post_dict)
    
    return jsonify({
        'posts': results,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200

@posts_bp.route('/<int:post_id>', methods=['GET'])
def get_post(post_id):
    """Get a single post by ID"""
    post = Post.query.get_or_404(post_id)
    post.view_count += 1
    db.session.commit()
    
    return jsonify({'post': post.to_dict()}), 200

@posts_bp.route('', methods=['POST'])
@jwt_required()
def create_post():
    """Create a new post"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['title', 'available_from', 'available_until', 'location']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Create or get location
    location_data = data['location']
    if 'latitude' in location_data and 'longitude' in location_data:
        location = Location(
            name=location_data.get('name', ''),
            address=location_data.get('address'),
            building=location_data.get('building'),
            room=location_data.get('room')
        )
        location.set_point(location_data['latitude'], location_data['longitude'])
        db.session.add(location)
        db.session.flush()
    else:
        return jsonify({'error': 'Location coordinates required'}), 400
    
    # Create post
    post = Post(
        title=data['title'],
        description=data.get('description'),
        post_type=PostType(data.get('type', 'surplus')),
        quantity=data.get('quantity'),
        available_from=datetime.fromisoformat(data['available_from'].replace('Z', '+00:00')),
        available_until=datetime.fromisoformat(data['available_until'].replace('Z', '+00:00')),
        pickup_instructions=data.get('pickup_instructions'),
        image_url=data.get('image_url'),
        is_public=data.get('is_public', True),
        creator_id=current_user_id,
        organization_id=data.get('organization_id'),
        location_id=location.id
    )
    
    # Add tags
    if 'tags' in data:
        tag_slugs = data['tags']
        tags = Tag.query.filter(Tag.slug.in_(tag_slugs)).all()
        post.tags = tags
    
    db.session.add(post)
    db.session.commit()
    
    # Trigger notification task (if celery is available)
    # from tasks.notification_tasks import notify_nearby_users
    # notify_nearby_users.delay(post.id)
    
    return jsonify({'post': post.to_dict(include_private=True)}), 201

@posts_bp.route('/<int:post_id>', methods=['PUT'])
@jwt_required()
def update_post(post_id):
    """Update a post"""
    current_user_id = get_jwt_identity()
    post = Post.query.get_or_404(post_id)
    
    # Check permissions
    if post.creator_id != current_user_id:
        from models.user import User
        user = User.query.get(current_user_id)
        if user.role.value not in ['admin', 'moderator']:
            return jsonify({'error': 'Permission denied'}), 403
    
    data = request.get_json()
    
    # Update fields
    if 'title' in data:
        post.title = data['title']
    if 'description' in data:
        post.description = data['description']
    if 'quantity' in data:
        post.quantity = data['quantity']
    if 'available_until' in data:
        post.available_until = datetime.fromisoformat(data['available_until'].replace('Z', '+00:00'))
    if 'pickup_instructions' in data:
        post.pickup_instructions = data['pickup_instructions']
    
    db.session.commit()
    
    return jsonify({'post': post.to_dict(include_private=True)}), 200

@posts_bp.route('/<int:post_id>/claim', methods=['POST'])
@jwt_required()
def claim_post(post_id):
    """Claim food from a post"""
    post = Post.query.get_or_404(post_id)
    data = request.get_json()
    quantity = data.get('quantity', 1)
    
    if post_service.claim_post(post, quantity):
        db.session.commit()
        return jsonify({'message': 'Successfully claimed', 'post': post.to_dict()}), 200
    else:
        return jsonify({'error': 'Post not available or quantity exceeded'}), 400

@posts_bp.route('/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    """Delete a post"""
    current_user_id = get_jwt_identity()
    post = Post.query.get_or_404(post_id)
    
    # Check permissions
    if post.creator_id != current_user_id:
        from models.user import User
        user = User.query.get(current_user_id)
        if user.role.value not in ['admin', 'moderator']:
            return jsonify({'error': 'Permission denied'}), 403
    
    post.status = PostStatus.REMOVED
    db.session.commit()
    
    return jsonify({'message': 'Post removed'}), 200

