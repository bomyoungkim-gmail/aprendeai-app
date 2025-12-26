'use client';

import { useState } from 'react';
import { StudyGroup } from '@/lib/types/study-groups';
import { useGroupSessions } from '@/hooks/social/use-groups';
import { CreateSessionModal } from './CreateSessionModal';
import { Calendar, Play, CheckCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/config/routes';

interface SessionsTabProps {
  group: StudyGroup;
}

export function SessionsTab({ group }: SessionsTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();
  const { data: sessions, isLoading } = useGroupSessions(group.id);

  const getStatusColor = (status: string) => {
    const colors = {
      CREATED: 'bg-gray-100 text-gray-800',
      RUNNING: 'bg-green-100 text-green-800',
      POST: 'bg-blue-100 text-blue-800',
      FINISHED: 'bg-purple-100 text-purple-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return <Play className="w-4 h-4" />;
      case 'FINISHED':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
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

      {isLoading && (
        <div className="text-center py-12 text-gray-600">
          Loading sessions...
        </div>
      )}

      {!isLoading && (!sessions || sessions.length === 0) && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-2">No sessions yet.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Start your first PI Sprint session
          </button>
        </div>
      )}

      {!isLoading && sessions && sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map((session: any) => (
            <div
              key={session.id}
              onClick={() => router.push(ROUTES.GROUPS.SESSION(group.id, session.id))}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${getStatusColor(session.status)}`}>
                  {getStatusIcon(session.status)}
                </div>
                
                <div>
                  <div className="font-medium">
                    Session {new Date(session.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    {session._count?.rounds || 0} rounds
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(session.status)}`}>
                  {session.status}
                </span>
                <Play className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateSessionModal
        groupId={group.id}
        contents={group.contents || []}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(sessionId) => {
          router.push(ROUTES.GROUPS.SESSION(group.id, sessionId));
        }}
      />
    </div>
  );
}
