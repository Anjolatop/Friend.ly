"""
Post service for business logic
"""

from extensions import db
from models.post import Post, PostStatus

class PostService:
    """Service for post operations"""
    
    def claim_post(self, post, quantity=1):
        """Claim food from a post"""
        if not post.is_available():
            return False
        
        if post.quantity is not None:
            if post.quantity_claimed + quantity > post.quantity:
                return False
            post.quantity_claimed += quantity
            
            if post.quantity_claimed >= post.quantity:
                post.status = PostStatus.CLAIMED
        
        post.claim_count += 1
        return True
    
    def expire_old_posts(self):
        """Mark expired posts as expired"""
        from datetime import datetime
        expired = Post.query.filter(
            Post.status == PostStatus.ACTIVE,
            Post.available_until < datetime.utcnow()
        ).all()
        
        for post in expired:
            post.status = PostStatus.EXPIRED
        
        db.session.commit()
        return len(expired)


