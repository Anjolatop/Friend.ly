import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FiClock, FiMapPin, FiTag, FiShoppingBag } from 'react-icons/fi';

const Feed = ({ posts, onPostClick, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <p>No food posts available at the moment.</p>
        <p className="text-sm mt-2">Check back later or create a post!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <div
          key={post.id}
          onClick={() => onPostClick && onPostClick(post)}
          className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition overflow-hidden"
        >
          {post.image_url && (
            <div className="w-full h-48 mb-3 rounded-lg overflow-hidden">
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{post.title}</h3>
              {post.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.description}</p>
              )}
            </div>
            {post.price !== null && post.price !== undefined && (
              <div className="flex items-center space-x-1 text-primary-700 font-semibold">
                <FiShoppingBag className="h-4 w-4" />
                <span>${Number(post.price).toFixed(2)}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
            {post.distance !== undefined && (
              <div className="flex items-center space-x-1">
                <FiMapPin className="h-4 w-4" />
                <span>{post.distance.toFixed(1)} km</span>
              </div>
            )}
            {post.available_until && (
              <div className="flex items-center space-x-1">
                <FiClock className="h-4 w-4" />
                <span>{formatDistanceToNow(new Date(post.available_until), { addSuffix: true })}</span>
              </div>
            )}
            {post.quantity && (
              <span className="px-2 py-1 bg-gray-100 rounded">
                {post.quantity - (post.quantity_claimed || 0)} left
              </span>
            )}
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {post.tags.map(tag => (
                <span
                  key={tag.id}
                  className="flex items-center space-x-1 px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs"
                >
                  <FiTag className="h-3 w-3" />
                  <span>{tag.name}</span>
                </span>
              ))}
            </div>
          )}

          {post.organization && (
            <p className="text-xs text-gray-400 mt-2">by {post.organization.name}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default Feed;

