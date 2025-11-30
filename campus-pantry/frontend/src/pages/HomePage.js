import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import MapView from '../components/MapView';
import Feed from '../components/Feed';
import { FiMap, FiList, FiSearch, FiFilter } from 'react-icons/fi';

const HomePage = () => {
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
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
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
                <h2 className="font-semibold text-lg mb-4">Recent Posts</h2>
                <Feed posts={posts.slice(0, 5)} onPostClick={handlePostClick} loading={false} />
              </div>
            )}
            {selectedPost && (
              <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
                <h2 className="font-semibold text-lg mb-4">Post Details</h2>
                <div>
                  <h3 className="font-semibold">{selectedPost.title}</h3>
                  {selectedPost.description && (
                    <p className="text-sm text-gray-600 mt-2">{selectedPost.description}</p>
                  )}
                  {selectedPost.pickup_instructions && (
                    <div className="mt-4">
                      <h4 className="font-medium text-sm">Pickup Instructions:</h4>
                      <p className="text-sm text-gray-600">{selectedPost.pickup_instructions}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
