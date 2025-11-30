import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';

const OrganizationDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.organization_id) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`/api/organizations/${user.organization_id}/dashboard`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Organization Dashboard</h1>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Posts</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.stats.total_posts}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500">Active Posts</h3>
              <p className="text-3xl font-bold text-primary-600 mt-2">{stats.stats.active_posts}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500">Recent Posts (30d)</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.stats.recent_posts}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Claims</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.stats.total_claims}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Organization Information</h2>
          {stats?.organization && (
            <div className="space-y-2">
              <p><span className="font-medium">Name:</span> {stats.organization.name}</p>
              <p><span className="font-medium">Email:</span> {stats.organization.email}</p>
              {stats.organization.description && (
                <p><span className="font-medium">Description:</span> {stats.organization.description}</p>
              )}
              <p>
                <span className="font-medium">Status:</span>{' '}
                <span className={`px-2 py-1 rounded text-sm ${
                  stats.organization.is_verified
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {stats.organization.is_verified ? 'Verified' : 'Pending Verification'}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationDashboard;


