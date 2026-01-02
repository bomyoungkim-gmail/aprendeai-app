'use client';

import { useState } from 'react';
import { ViewMode } from '@/lib/types/cornell';
import { CornellLayout } from '@/components/cornell/classic/CornellLayout';
import { PromptConsole } from '@/components/reading/PromptConsole';
import { PromptDrawer } from '@/components/reading/PromptDrawer';
import { useReadingSession } from '@/hooks/sessions/reading/use-reading-session';
import '@/components/reading/prompt-drawer.css';

interface ReadingSessionPageProps {
  params: { sessionId: string };
}

export default function ReadingSessionPage({ params }: ReadingSessionPageProps) {
  const { sessionId } = params;
  const { data, isLoading, error } = useReadingSession(sessionId);
  const [mode, setMode] = useState<ViewMode>('study');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-600">Loading session...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-6 text-red-600">
          Failed to load session. Please try again.
        </div>
      </div>
    );
  }

  const { session, content, messages, quickReplies } = data;

  return (
    <div className="reading-session-container">
      <div className="cornell-container h-screen">
        <CornellLayout 
          title={content?.title || 'Reading Session'}
          mode={mode}
          onModeToggle={() => setMode(prev => 
            prev === 'original' ? 'study' : 
            prev === 'study' ? 'review' : 'original'
          )}
          saveStatus="saved"
          cues={[]}
          onCuesChange={() => {}}
          notes={[]}
          onNotesChange={() => {}}
          summary=""
          onSummaryChange={() => {}}
          viewer={
            <div className="flex items-center justify-center h-full bg-gray-100">
              <div className="text-center">
                <p className="text-gray-500 text-lg mb-2">Content Viewer</p>
                <p className="text-gray-400 text-sm">Phase: {session?.phase || 'LOADING'}</p>
                {content?.file?.storageKey && (
                  <p className="text-gray-400 text-xs mt-1">
                    Media: {content.file.storageKey}
                  </p>
                )}
              </div>
            </div>
          }
        />
      </div>

      <PromptDrawer sessionId={sessionId}>
        <PromptConsole 
          sessionId={sessionId}
        />
      </PromptDrawer>
    </div>
  );
}
