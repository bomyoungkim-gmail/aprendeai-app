'use client';

import { useParams } from 'next/navigation';
import { useSession } from '@/hooks/sessions/group/use-sessions';
import AuthGuard from '@/components/auth-guard';
import { PISprintInterface } from '@/components/study-groups/PISprintInterface';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const groupId = params.groupId as string;
  
  const { data: session, isLoading, error } = useSession(sessionId);

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600">Loading session...</div>
        </div>
      </AuthGuard>
    );
  }

  if (error || !session) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              Failed to load session. Please try again.
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-6 py-3">
          <Link 
            href={`/groups/${groupId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Group
          </Link>
        </div>
        
        <PISprintInterface session={session} />
      </div>
    </AuthGuard>
  );
}
