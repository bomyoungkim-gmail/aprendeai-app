'use client';

import { useState } from 'react';
import { StudyGroup } from '@/lib/types/study-groups';
import { CreateSessionModal } from './CreateSessionModal';
import { Calendar, Play, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SessionsTabProps {
  group: StudyGroup;
}

export function SessionsTab({ group }: SessionsTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();

  // Note: We don't have sessions data in the group object yet
  // This would need to be fetched separately or included in the group query

  const getStatusColor = (status: string) => {
    const colors = {
      CREATED: 'bg-gray-100 text-gray-800',
      RUNNING: 'bg-green-100 text-green-800',
      POST: 'bg-blue-100 text-blue-800',
      FINISHED: 'bg-purple-100 text-purple-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Sessions</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Play className="w-4 h-4" />
          Start PI Sprint
        </button>
      </div>

      <div className="text-center py-12 text-gray-600">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p>No sessions yet.</p>
        <button
          onClick={() => setShowCreateModal(true)}
          className="text-blue-600 hover:text-blue-700 mt-2"
        >
          Start your first PI Sprint session
        </button>
      </div>

      <CreateSessionModal
        groupId={group.id}
        contents={group.contents || []}
        isOpen={showCreateModal}
        on Close={() => setShowCreateModal(false)}
        onSuccess={(sessionId) => {
          router.push(`/groups/${group.id}/sessions/${sessionId}`);
        }}
      />
    </div>
  );
}
