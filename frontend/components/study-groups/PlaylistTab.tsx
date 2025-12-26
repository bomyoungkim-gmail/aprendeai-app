'use client';

import { useState } from 'react';
import { StudyGroup } from '@/lib/types/study-groups';
import { useAuthStore } from '@/stores/auth-store';
import { useRemoveContent } from '@/hooks/social/use-groups';
import { AddContentModal } from './AddContentModal';
import { Plus, Trash2, BookOpen } from 'lucide-react';

interface PlaylistTabProps {
  group: StudyGroup;
}

export function PlaylistTab({ group }: PlaylistTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const { user } = useAuthStore();
  const removeContent = useRemoveContent(group.id);

  const myMembership = group.members?.find((m) => m.userId === user?.id);
  const canAddContent = myMembership?.status === 'ACTIVE';
  const canRemoveContent = myMembership?.role === 'OWNER' || myMembership?.role === 'MOD';

  const handleRemoveContent = async (contentId: string) => {
    if (!confirm('Remove this content from playlist?')) return;
    
    try {
      await removeContent.mutateAsync(contentId);
    } catch (error) {
      console.error('Failed to remove content:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Playlist ({group.contents?.length || 0})</h2>
        {canAddContent && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Content
          </button>
        )}
      </div>

      {!group.contents || group.contents.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No content in playlist yet.</p>
          {canAddContent && (
            <button
              onClick={() => setShowAddModal(true)}
              className="text-blue-600 hover:text-blue-700 mt-2"
            >
              Add your first content
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {group.contents.map((item) => (
            <div
              key={item.contentId}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div>
                <div className="font-medium">{item.content?.title || 'Untitled'}</div>
                <div className="text-sm text-gray-600">Type: {item.content?.type || 'Unknown'}</div>
              </div>
              
              {canRemoveContent && (
                <button
                  onClick={() => handleRemoveContent(item.contentId)}
                  disabled={removeContent.isPending}
                  className="text-red-600 hover:text-red-700 disabled:opacity-50"
                  title="Remove content"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <AddContentModal
        groupId={group.id}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
}
