'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/config/api';

interface PlatformStats {
  totalUsers: number;
  totalInstitutions: number;
  totalFamilies: number;
  totalContent: number;
  activeUsersThisWeek: number;
  newUsersThisMonth: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const getToken = () => localStorage.getItem('token');

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-12 text-gray-500">Failed to load platform statistics</div>;
  }

  const statCards = [
    {
      name: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: '👥',
      color: 'bg-blue-500',
    },
    {
      name: 'Institutions',
      value: stats.totalInstitutions.toLocaleString(),
      icon: '🏛️',
      color: 'bg-purple-500',
    },
    {
      name: 'Families',
      value: stats.totalFamilies.toLocaleString(),
      icon: '👨‍👩‍👧‍👦',
      color: 'bg-green-500',
    },
    {
      name: 'Content Items',
      value: stats.totalContent.toLocaleString(),
      icon: '📚',
      color: 'bg-yellow-500',
    },
    {
      name: 'Active This Week',
      value: stats.activeUsersThisWeek.toLocaleString(),
      icon: '⚡',
      color: 'bg-orange-500',
    },
    {
      name: 'New This Month',
      value: stats.newUsersThisMonth.toLocaleString(),
      icon: '🆕',
      color: 'bg-pink-500',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of AprendeAI platform metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${stat.color}`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{stat.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <a
            href="/admin/users"
            className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            <span className="text-3xl mb-2 block">👥</span>
            <span className="block text-sm font-medium text-gray-900">Manage Users</span>
          </a>

          <a
            href="/admin/institutions"
            className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
          >
            <span className="text-3xl mb-2 block">🏛️</span>
            <span className="block text-sm font-medium text-gray-900">View Institutions</span>
          </a>

          <a
            href="/admin/feature-flags"
            className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            <span className="text-3xl mb-2 block">🚩</span>
            <span className="block text-sm font-medium text-gray-900">Feature Flags</span>
          </a>
        </div>
      </div>
    </div>
  );
}
