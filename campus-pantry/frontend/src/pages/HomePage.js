import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import MapView from '../components/MapView';
import Feed from '../components/Feed';
import { FiMap, FiList, FiSearch, FiFilter, FiShoppingBag, FiMapPin, FiClock } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

// Fallback sample posts so the map/sidebar are populated even before real data
const SAMPLE_POSTS = [
  {
    id: 1001,
    title: 'Fresh Bagels',
    description: 'Half dozen bagels from morning event.',
    price: 5,
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    available_until: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    location: { name: 'NYC Campus Center', latitude: 40.7295, longitude: -73.9965, address: 'New York, NY' },
    is_available: true,
    quantity: 6,
    quantity_claimed: 1,
    tags: [],
  },
  {
    id: 1002,
    title: 'Veggie Pizza Slices',
    description: 'Box of slices left from club meeting.',
    price: 3,
    image_url: 'https://images.unsplash.com/photo-1548365328-9f547b1abd83?auto=format&fit=crop&w=800&q=80',
    available_until: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    location: { name: 'Chicago Student Union', latitude: 41.8781, longitude: -87.6298, address: 'Chicago, IL' },
    is_available: true,
    quantity: 10,
    quantity_claimed: 2,
    tags: [],
  },
  {
    id: 1003,
    title: 'Taco Night Kits',
    description: 'Make-your-own taco kits for 2 people.',
    price: 8,
    image_url: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80',
    available_until: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    location: { name: 'LA Quad', latitude: 34.0689, longitude: -118.4452, address: 'Los Angeles, CA' },
    is_available: true,
    quantity: 5,
    quantity_claimed: 0,
    tags: [],
  },
];

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const [view, setView] = useState('map'); // 'map' or 'feed'
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    tags: [],
    type: null,
  });
  const [selectedPost, setSelectedPost] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([-98.5795, 39.8283]); // Center of USA
  const [messageModal, setMessageModal] = useState({ open: false, post: null });
  const [messageBody, setMessageBody] = useState('');
  const [messageSending, setMessageSending] = useState(false);

  // Fetch user location once on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
          setMapCenter([loc.lng, loc.lat]);
        },
        error => {
          console.error('Error getting location:', error);
          // Default to center of USA
          setMapCenter([-98.5795, 39.8283]);
        }
      );
    }
  }, []); // Only run once on mount

  // Memoize fetchPosts to prevent infinite loops
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
        params.radius = 5; // 5km radius
      }
      if (filters.tags.length > 0) {
        params.tags = filters.tags;
      }
      if (filters.type) {
        params.type = filters.type;
      }

      const response = await axios.get('/api/posts', { params });
      const fetched = response.data.posts || [];
      setPosts(fetched.length ? fetched : SAMPLE_POSTS);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts(SAMPLE_POSTS);
    } finally {
      setLoading(false);
    }
  }, [userLocation, filters]);

  // Fetch posts when filters or userLocation changes
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  const handlePickup = async (post) => {
    if (!post) return;
    if (!isAuthenticated) {
      alert('Please log in to request a pickup.');
      return;
    }
    try {
      await axios.post(`/api/posts/${post.id}/claim`, { quantity: 1 });
      alert('Pickup requested! Check your email/notifications for confirmation.');
    } catch (err) {
      alert(err.response?.data?.error || 'Unable to request pickup.');
    }
  };

  const openMessageModal = (post) => {
    if (!isAuthenticated) {
      alert('Please log in to message the poster.');
      return;
    }
    setSelectedPost(post);
    setMessageBody('');
    setMessageModal({ open: true, post });
  };

  const sendMessage = async () => {
    if (!messageBody.trim() || !messageModal.post) return;
    setMessageSending(true);
    try {
      await axios.post('/api/messages', {
        post_id: messageModal.post.id,
        body: messageBody.trim(),
      });
      alert('Message sent to the poster!');
      setMessageModal({ open: false, post: null });
      setMessageBody('');
    } catch (err) {
      alert(err.response?.data?.error || 'Unable to send message.');
    } finally {
      setMessageSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search for food or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <FiFilter className="h-5 w-5" />
            <span>Filters</span>
          </button>
        </div>

        {/* View Toggle */}
        <div className="mb-4 flex space-x-2">
          <button
            onClick={() => setView('map')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              view === 'map'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FiMap className="h-5 w-5" />
            <span>Map</span>
          </button>
          <button
            onClick={() => setView('feed')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              view === 'feed'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FiList className="h-5 w-5" />
            <span>Feed</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {view === 'map' ? (
              <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-4 h-[600px]">
                <MapView
                  posts={posts}
                  onPostClick={handlePostClick}
                  center={mapCenter}
                  zoom={userLocation ? 10 : 4}
                />
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <Feed posts={posts} onPostClick={handlePostClick} loading={loading} />
              </div>
            </div>
          )}

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {view === 'map' && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="font-semibold text-lg mb-4">Foods nearby</h2>
                <Feed posts={posts.slice(0, 6)} onPostClick={handlePostClick} loading={false} />
              </div>
            )}
            {selectedPost && (
              <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold text-lg">Food details</h2>
                  {selectedPost.price !== null && selectedPost.price !== undefined && (
                    <span className="inline-flex items-center px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-semibold">
                      <FiShoppingBag className="h-4 w-4 mr-1" /> ${Number(selectedPost.price).toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-3">
                  <h3 className="font-semibold text-gray-900">{selectedPost.title}</h3>
                  {selectedPost.description && (
                    <p className="text-sm text-gray-700">{selectedPost.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                    {selectedPost.location?.name && (
                      <span className="inline-flex items-center gap-1">
                        <FiMapPin className="h-4 w-4" />
                        {selectedPost.location.name}
                      </span>
                    )}
                    {selectedPost.available_until && (
                      <span className="inline-flex items-center gap-1">
                        <FiClock className="h-4 w-4" />
                        Available until {new Date(selectedPost.available_until).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {selectedPost.pickup_instructions && (
                    <div className="p-3 bg-gray-50 rounded border border-gray-100 text-sm text-gray-700">
                      <span className="font-medium">Pickup:</span> {selectedPost.pickup_instructions}
                    </div>
                  )}
                  <button
                    onClick={() => handlePickup(selectedPost)}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold"
                  >
                    Request pickup
                  </button>
                  <button
                    onClick={() => openMessageModal(selectedPost)}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-primary-600 text-primary-700 rounded-md hover:bg-primary-50 font-semibold"
                  >
                    Message poster
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {messageModal.open && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Message the poster</h3>
                <button onClick={() => setMessageModal({ open: false, post: null })} className="text-gray-500 hover:text-gray-700">×</button>
              </div>
              <p className="text-sm text-gray-600">
                Send a quick note about <span className="font-semibold">{messageModal.post?.title}</span>
              </p>
              <textarea
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                rows={4}
                placeholder="Hi! I'd like to pick this up. Are there any details I should know?"
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setMessageModal({ open: false, post: null })}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={sendMessage}
                  disabled={messageSending || !messageBody.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-60"
                >
                  {messageSending ? 'Sending...' : 'Send message'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
