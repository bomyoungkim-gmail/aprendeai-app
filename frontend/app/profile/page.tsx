'use client';

import { useState } from 'react';
import { useUserProfile, useUserStats, useUserActivity, useUploadAvatar } from '@/hooks/profile/use-user-profile';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { RecentActivity } from '@/components/profile/RecentActivity';
import { Toast, useToast } from '@/components/ui/Toast';

export default function ProfilePage() {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const { toast, show: showToast, hide: hideToast } = useToast();

  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: activities, isLoading: activitiesLoading } = useUserActivity();
  const uploadAvatar = useUploadAvatar();

  const handleEditProfile = () => {
    // TODO: Open edit modal
    showToast('info', 'Edit profile functionality coming soon!');
  };

  const handleAvatarClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          showToast('error', 'File size must be less than 5MB');
          return;
        }

        try {
          await uploadAvatar.mutateAsync(file);
          showToast('success', 'Avatar updated successfully!');
        } catch (error) {
          showToast('error', 'Failed to upload avatar');
        }
      }
    };
    input.click();
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600">Unable to load your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <ProfileHeader
            profile={profile}
            onEdit={handleEditProfile}
            onAvatarClick={handleAvatarClick}
          />
        </div>

        {/* Statistics */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Study Statistics</h2>
          <ProfileStats stats={stats || {
            contentsRead: 0,
            annotationsCreated: 0,
            groupsJoined: 0,
            sessionsAttended: 0,
            studyHours: 0,
          }} isLoading={statsLoading} />
        </div>

        {/* Recent Activity */}
        <div>
          <RecentActivity
            activities={activities || []}
            isLoading={activitiesLoading}
          />
        </div>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={hideToast} />
      )}
    </div>
  );
}
