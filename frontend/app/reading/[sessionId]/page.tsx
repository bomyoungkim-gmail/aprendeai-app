'use client';

import { useState } from 'react';
import { ViewMode } from '@/lib/types/cornell';
import { ModernCornellLayout } from '@/components/cornell/ModernCornellLayout';
import { PromptConsole } from '@/components/reading/PromptConsole';
import { PromptDrawer } from '@/components/reading/PromptDrawer';
import { useReadingSession } from '@/hooks/sessions/reading/use-reading-session';
import { useUnifiedStream } from '@/hooks/cornell';
import '@/components/reading/prompt-drawer.css';

interface ReadingSessionPageProps {
  params: { sessionId: string };
}

export default function ReadingSessionPage({ params }: ReadingSessionPageProps) {
  const { sessionId } = params;
  const { data, isLoading, error } = useReadingSession(sessionId);
  const [mode, setMode] = useState<ViewMode>('study');
  
  // Minimal state for ModernCornellLayout in this context
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [selectedColor, setSelectedColor] = useState('yellow');

  const contentId = data?.content?.id || '';
  const { streamItems, cues, summary } = useUnifiedStream(contentId);

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

  const { session, content } = data;

  return (
    <div className="reading-session-container">
      <div className="cornell-container h-screen">
        <ModernCornellLayout 
          title={content?.title || 'Reading Session'}
          mode={mode}
          onModeToggle={() => setMode(prev => 
            prev === 'original' ? 'study' : 
            prev === 'study' ? 'review' : 'original'
          )}
          saveStatus="saved"
          lastSaved={new Date()}
          contentId={contentId}
          targetType={content?.contentType || 'ARTICLE'}
          currentPage={currentPage}
          currentTimestamp={currentTimestamp}
          streamItems={streamItems}
          onStreamItemClick={(item) => console.log('Item clicked:', item)}
          onStreamItemEdit={(item) => console.log('Edit item:', item)}
          onStreamItemDelete={(item) => console.log('Delete item:', item)}
          onStreamItemSaveEdit={(item, updates) => console.log('Save item edit:', item, updates)}
          cues={cues}
          onCuesChange={() => {}}
          summary={summary}
          onSummaryChange={() => {}}
          viewer={
            <div className="flex items-center justify-center h-full bg-gray-100">
              <div className="text-center">
                <p className="text-gray-500 text-lg mb-2">Content Viewer</p>
                <p className="text-gray-400 text-sm">Phase: {session?.phase || 'LOADING'}</p>
                {content?.file?.storageKey && (
                  <p className="text-gray-400 text-sm mt-1">
                    Media: {content.file.storageKey}
                  </p>
                )}
              </div>
            </div>
          }
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
          onNavigate={(page) => setCurrentPage(page)}
          onCreateStreamItem={() => {}}
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
