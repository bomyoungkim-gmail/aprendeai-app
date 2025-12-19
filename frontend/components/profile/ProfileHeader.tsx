'use client';

import { Camera, Edit2 } from 'lucide-react';
import { UserProfile } from '@/hooks/use-user-profile';
import { formatDistanceToNow } from 'date-fns';

interface ProfileHeaderProps {
  profile: UserProfile;
  onEdit: () => void;
  onAvatarClick: () => void;
}

export function ProfileHeader({ profile, onEdit, onAvatarClick }: ProfileHeaderProps) {
  const initials = profile.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start gap-6">
        {/* Avatar */}
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <button
            onClick={onAvatarClick}
            className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Camera className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-gray-600">{profile.email}</p>
              {profile.bio && (
                <p className="mt-2 text-gray-700">{profile.bio}</p>
              )}
            </div>
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Role:</span> {profile.role}
            </div>
            <div>
              <span className="font-medium">Level:</span> {profile.schoolingLevel}
            </div>
            {profile.lastLoginAt && (
              <div>
                <span className="font-medium">Last active:</span>{' '}
                {formatDistanceToNow(new Date(profile.lastLoginAt), { addSuffix: true })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
