'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/config/api';
import toast from 'react-hot-toast';
import { SkeletonCard } from '@/components/ui/skeleton';
import { StatsCard } from '@/components/dashboard/StatsCard';

interface FamilyData {
  id: string;
  name: string;
  stats: {
    totalMembers: number;
    activeMembers: number;
    plan: string;
  };
}

export default function FamilyDashboard() {
  const router = useRouter();
  const [family, setFamily] = useState<FamilyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFamily();
  }, []);

  const getToken = () => localStorage.getItem('token');

  const fetchFamily = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FAMILY.MY_FAMILY}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFamily(data);
      } else {
        console.error('Failed to fetch family data');
        toast.error('Failed to load family data');
      }
    } catch (error) {
      console.error('Error fetching family:', error);
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!family) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Family Found</h2>
        <p className="text-gray-600">You are not owning any family group yet.</p>
        <button 
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white"
          onClick={() => router.push('/dashboard')}
        >
          Create Family
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {family.name}</h1>
        <p className="text-gray-600 mt-1">
          Plan: <span className="font-semibold text-blue-600">{family.stats.plan}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <StatsCard
          name="Total Members"
          value={family.stats.totalMembers}
          icon="👥"
          color="bg-blue-500"
        />
        <StatsCard
          name="Active Learners"
          value={family.stats.activeMembers}
          icon="⚡"
          color="bg-green-500"
        />
      </div>

      {/* Visual Placeholder for Activity Heatmap */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Learning Activity</h2>
        <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
          <p className="text-gray-500">Learning activity visualization coming soon...</p>
        </div>
      </div>
    </div>
  );
}
