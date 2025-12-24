'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/config/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export default function FamilyAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const getToken = () => localStorage.getItem('token');

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/families/my-family`, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      
      if (res.ok) {
        const family = await res.json();
        // Mock analytics data for demonstration
        setAnalytics({
          activityHeatmap: generateMockHeatmap(),
          memberProgress: family.members?.map((m: any) => ({
            name: m.user.name,
            sessions: Math.floor(Math.random() * 20),
            minutes: Math.floor(Math.random() * 300),
          })) || [],
          weeklyTrend: generateWeeklyTrend(),
        });
      } else {
        toast.error('Failed to load analytics');
      }
    } catch (error) {
      console.error(error);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const generateMockHeatmap = () => {
    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      sessions: Math.floor(Math.random() * 10),
    }));
  };

  const generateWeeklyTrend = () => {
    return Array.from({ length: 7 }, (_, i) => ({
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
      minutes: Math.floor(Math.random() * 120),
    }));
  };

  if (loading) {
    return <div className="text-center py-12">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-12">No analytics data available</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Family Analytics</h1>

      {/* Weekly Trend */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Weekly Learning Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.weeklyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="minutes" fill="#8884d8" name="Minutes" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Member Progress */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Member Progress</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.memberProgress}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="sessions" fill="#82ca9d" name="Sessions" />
            <Bar dataKey="minutes" fill="#8884d8" name="Minutes" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">30-Day Activity</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={analytics.activityHeatmap}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="sessions" stroke="#8884d8" name="Sessions" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
