import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Users</h2>
              <div className="space-y-2">
                <p><span className="text-gray-600">Total:</span> <span className="font-bold">{stats.users.total}</span></p>
                <p><span className="text-gray-600">Active:</span> <span className="font-bold text-green-600">{stats.users.active}</span></p>
                <p><span className="text-gray-600">New (30d):</span> <span className="font-bold">{stats.users.new_30d}</span></p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Posts</h2>
              <div className="space-y-2">
                <p><span className="text-gray-600">Total:</span> <span className="font-bold">{stats.posts.total}</span></p>
                <p><span className="text-gray-600">Active:</span> <span className="font-bold text-primary-600">{stats.posts.active}</span></p>
                <p><span className="text-gray-600">New (30d):</span> <span className="font-bold">{stats.posts.new_30d}</span></p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Organizations</h2>
              <div className="space-y-2">
                <p><span className="text-gray-600">Total:</span> <span className="font-bold">{stats.organizations.total}</span></p>
                <p><span className="text-gray-600">Verified:</span> <span className="font-bold text-green-600">{stats.organizations.verified}</span></p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Platform Management</h2>
          <div className="space-y-4">
            <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
              View Flagged Posts
            </button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 ml-4">
              Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;


