'use client';

import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import { ContinueLearningCards } from '@/components/dashboard/ContinueLearningCards';
import { RecentContentCards } from '@/components/dashboard/RecentContentCards';
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap';
import { ActivityStats } from '@/components/dashboard/ActivityStats';

export default function EnhancedDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your learning overview.</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <QuickActionsCard />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Continue Learning */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Continue Learning
              </h2>
              <ContinueLearningCards />
            </div>
          </div>

          {/* Right Column - Activity Stats */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Your Activity
              </h2>
              <ActivityStats />
            </div>
          </div>
        </div>

        {/* Activity Heatmap */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Activity Heatmap
            </h2>
            <ActivityHeatmap />
          </div>
        </div>

        {/* Recent Content */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Recently Viewed
            </h2>
            <RecentContentCards />
          </div>
        </div>
      </div>
    </div>
  );
}
