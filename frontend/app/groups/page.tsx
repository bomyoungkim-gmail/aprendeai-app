'use client';

import { useState } from 'react';
import { useGroups } from '@/hooks/use-groups';
import { GroupCard } from '@/components/study-groups/GroupCard';
import { CreateGroupModal } from '@/components/study-groups/CreateGroupModal';
import AuthGuard from '@/components/auth-guard';
import { Plus } from 'lucide-react';

export default function GroupsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data: groups, isLoading, error } = useGroups();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Study Groups</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Create Group
            </button>
          </div>

          {isLoading && (
            <div className="text-center py-12 text-gray-600">
              Loading groups...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              Failed to load groups. Please try again.
            </div>
          )}

          {groups && groups.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">You haven't joined any study groups yet.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first group
              </button>
            </div>
          )}

          {groups && groups.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
        </div>

        <CreateGroupModal 
          isOpen={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
        />
      </div>
    </AuthGuard>
  );
}
