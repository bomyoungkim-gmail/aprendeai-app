'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/config/api';
import toast from 'react-hot-toast';
import { SkeletonCard } from '@/components/ui/skeleton';

interface InstitutionData {
  id: string;
  name: string;
  type: string;
  city?: string;
  state?: string;
  memberCount: number;
  activeInvites: number;
  pendingApprovals: number;
  domains: string[];
}

export default function InstitutionDashboard() {
  const router = useRouter();
  const [institution, setInstitution] = useState<InstitutionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstitutionData();
  }, []);

  const getToken = () => localStorage.getItem('token');

  const fetchInstitutionData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INSTITUTIONS.MY_INSTITUTION}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInstitution(data);
      } else {
        console.error('Failed to fetch institution data');
        toast.error('Failed to load institution data');
      }
    } catch (error) {
      console.error('Error fetching institution:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Loading...</h1>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Institution Found</h2>
        <p className="text-gray-600">You are not assigned as an admin to any institution.</p>
      </div>
    );
  }

  const stats = [
    { name: 'Active Members', value: institution.memberCount, icon: '👥', color: 'bg-blue-500' },
    { name: 'Pending Invites', value: institution.activeInvites, icon: '📧', color: 'bg-yellow-500' },
    { name: 'Pending Approvals', value: institution.pendingApprovals, icon: '⏳', color: 'bg-orange-500' },
    { name: 'Active Domains', value: institution.domains.length, icon: '🌐', color: 'bg-green-500' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{institution.name}</h1>
        <p className="text-gray-600 mt-1">
          {institution.type} • {institution.city}, {institution.state}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
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
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button
            onClick={() => router.push('/institution/members')}
            className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            <span className="text-3xl mb-2 block">👥</span>
            <span className="block text-sm font-medium text-gray-900">Manage Members & Invites</span>
          </button>

          <button
            onClick={() => router.push('/institution/pending')}
            className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
          >
            <span className="text-3xl mb-2 block">⏳</span>
            <span className="block text-sm font-medium text-gray-900">Review Pending Approvals</span>
            {institution.pendingApprovals > 0 && (
              <span className="absolute top-2 right-2 inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                {institution.pendingApprovals}
              </span>
            )}
          </button>

          <button
            onClick={() => router.push('/institution/domains')}
            className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            <span className="text-3xl mb-2 block">🌐</span>
            <span className="block text-sm font-medium text-gray-900">Manage Domains</span>
          </button>
        </div>
      </div>

      {/* Domains Overview */}
      {institution.domains.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Configured Email Domains</h2>
          <div className="flex flex-wrap gap-2">
            {institution.domains.map((domain) => (
              <span
                key={domain}
                className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800"
              >
                {domain}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
