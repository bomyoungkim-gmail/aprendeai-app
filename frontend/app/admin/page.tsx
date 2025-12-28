'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/config/api';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { SkeletonCard } from '@/components/ui/skeleton';

interface PlatformStats {
  totalUsers: number;
  totalInstitutions: number;
  totalFamilies: number;
  totalContent: number;
  activeUsersThisWeek: number;
  newUsersThisMonth: number;
}

interface StatsCardProps {
  name: string;
  value: string;
  icon: string;
  color: string;
}

function StatsCard({ name, value, icon, color }: StatsCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${color} rounded-md p-3`}>
            <span className="text-2xl">{icon}</span>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{name}</dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
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
      const res = await api.get(`${API_BASE_URL}/admin/stats`);
      if (res.status === 200) {
        setStats(res.data);
      } else {
        toast.error('Failed to load platform statistics');
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of AprendeAI platform metrics</p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
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
        <h1 className="text-3xl font-bold text-gray-900">Admin Overview</h1>
        <p className="text-gray-600 mt-1">Platform metrics and quick actions.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {statCards.map((stat) => (
          <StatsCard
            key={stat.name}
            name={stat.name}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
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
