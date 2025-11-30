"""
Notification background tasks
"""

from extensions import db
from models.post import Post
from models.user import User
from models.preference import Preference
from models.notification import Notification, NotificationType, NotificationStatus
from services.geo_service import GeoService
from datetime import datetime

geo_service = GeoService()

def make_tasks(celery_app):
    """Create tasks with celery app"""
    @celery_app.task
    def notify_nearby_users(post_id):
        """Notify users within range of a new post"""
        post = Post.query.get(post_id)
        if not post or not post.location:
            return
        
        post_coords = post.location.get_coordinates()
        if not post_coords:
            return
        
        post_lat = post_coords['latitude']
        post_lng = post_coords['longitude']
        
        # Get all users with notification preferences
        users = User.query.join(Preference).filter(
            Preference.notify_immediately == True
        ).all()
        
        notifications_created = 0
        
        for user in users:
            # Check if user is within notification distance
            # For now, we'll notify all users (in production, you'd check saved locations)
            preference = user.preferences
            
            # Create notification
            notification = Notification(
                user_id=user.id,
                post_id=post_id,
                notification_type=NotificationType.IN_APP,
                title=f"New food available: {post.title}",
                message=f"{post.description or 'Food available nearby'}",
                status=NotificationStatus.PENDING
            )
            
            db.session.add(notification)
            notifications_created += 1
            
            # Send push notification if user has FCM token (would be stored in user model)
            # send_push_notification.delay(user.id, notification.id)
        
        db.session.commit()
        return f"Created {notifications_created} notifications"
    
    @celery_app.task
    def send_daily_digest():
        """Send daily digest emails to users who opted in"""
        # This would send daily digest emails
        pass
    
    @celery_app.task
    def expire_old_posts():
        """Mark expired posts"""
        from services.post_service import PostService
        service = PostService()
        count = service.expire_old_posts()
        return f"Expired {count} posts"
    
    return {
        'notify_nearby_users': notify_nearby_users,
        'send_daily_digest': send_daily_digest,
        'expire_old_posts': expire_old_posts,
    }
