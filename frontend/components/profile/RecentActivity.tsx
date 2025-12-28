'use client';

import { MessageSquare, Users, Clock } from 'lucide-react';
import { Activity } from '@/hooks/profile/use-user-profile';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityProps {
  activities: Activity[];
  isLoading?: boolean;
}

export function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-24 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No recent activity</p>
        </div>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'annotation':
        return <MessageSquare className="w-5 h-5" />;
      case 'group_join':
        return <Users className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'annotation':
        return 'bg-blue-100 text-blue-600';
      case 'group_join':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start gap-3 py-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconColor(activity.type)}`}>
              {getIcon(activity.type)}
            </div>
            <div className="flex-1">
              <p className="text-gray-900">{activity.description}</p>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
