'use client';

import { User, BarChart3, Users, BookOpen } from 'lucide-react';
import { UserStats } from '@/hooks/use-user-profile';

interface ProfileStatsProps {
  stats: UserStats;
  isLoading?: boolean;
}

export function ProfileStats({ stats, isLoading }: ProfileStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
            <div className="h-12 w-12 bg-gray-200 rounded-full mb-3" />
            <div className="h-8 w-16 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      icon: BookOpen,
      label: 'Contents Read',
      value: stats.contentsRead,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: BarChart3,
      label: 'Annotations',
      value: stats.annotationsCreated,
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: Users,
      label: 'Groups Joined',
      value: stats.groupsJoined,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: User,
      label: 'Sessions',
      value: stats.sessionsAttended,
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center mb-3`}>
            <stat.icon className="w-6 h-6" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
          <div className="text-sm text-gray-600">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
