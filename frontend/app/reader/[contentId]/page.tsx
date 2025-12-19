'use client';

import React, { useState, useCallback } from 'react';
import { CornellLayout } from '@/components/cornell';
import { PDFViewer, ImageViewer, DocxViewer } from '@/components/cornell/viewers';
import { ReviewMode } from '@/components/cornell/review/ReviewMode';
import { Toast, useToast } from '@/components/ui/Toast';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { AudioPlayer } from '@/components/media/AudioPlayer';
import {
  useContent,
  useCornellNotes,
  useUpdateCornellNotes,
  useHighlights,
  useCreateHighlight,
  useCornellAutosave,
  useSaveStatusWithOnline,
} from '@/hooks';
import { AnnotationToolbar } from '@/components/annotations/AnnotationToolbar';
import { AnnotationsSidebar } from '@/components/annotations/AnnotationsSidebar';
import { useTextSelection } from '@/hooks/use-text-selection';
import { useCreateAnnotation } from '@/hooks/use-annotations';
import { useStudySession } from '@/hooks/use-study-session';
import type { ViewMode, CueItem, NoteItem, UpdateCornellDto } from '@/lib/types/cornell';

interface ReaderPageProps {
  params: {
    contentId: string;
  };
}

export default function ReaderPage({ params }: ReaderPageProps) {
  const [mode, setMode] = useState<ViewMode>('study');
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [contentRef, setContentRef] = useState<HTMLElement | null>(null);
  const { toast, show: showToast, hide: hideToast } = useToast();

  // Get study session context (will be null for solo study)
  const { groupId, isInSession } = useStudySession();

  // Fetch data
  const { data: content, isLoading: contentLoading } = useContent(params.contentId);
  const { data: cornell, isLoading: cornellLoading } = useCornellNotes(params.contentId);
  const { data: highlights } = useHighlights(params.contentId);

  // Mutations
  const updateMutation = useUpdateCornellNotes(params.contentId);
  const { mutateAsync: createHighlight } = useCreateHighlight(params.contentId);
  const { mutateAsync: createAnnotation } = useCreateAnnotation(params.contentId);

  // Text selection for annotations
  const { selection, clearSelection } = useTextSelection(contentRef);

  // Autosave
  const { save, status: baseStatus, lastSaved } = useCornellAutosave({
    onSave: async (data) => {
      await updateMutation.mutateAsync(data as UpdateCornellDto);
    },
    delay: 1000,
    onSuccess: () => {
      // Optionally show success toast
    },
    onError: (error) => {
      showToast('error', 'Failed to save changes');
      console.error('Autosave error:', error);
    },
  });

  const status = useSaveStatusWithOnline(baseStatus);

  // Highlight creation with feedback
  const handleCreateHighlight = useCallback(
    async (highlightData: any) => {
      try {
        await createHighlight(highlightData);
        showToast('success', 'Highlight created!');
      } catch (error) {
        showToast('error', 'Failed to create highlight');
        throw error;
      }
    },
    [createHighlight, showToast]
  );

  // Annotation creation with feedback
  const handleCreateAnnotation = useCallback(
    async (annotationData: any) => {
      try {
        await createAnnotation({
          contentId: params.contentId,
          ...annotationData,
        });
        showToast('success', 'Annotation created!');
        clearSelection();
      } catch (error) {
        showToast('error', 'Failed to create annotation');
        throw error;
      }
    },
    [createAnnotation, params.contentId, showToast, selection]
  );

  // Handlers
  const handleCuesChange = useCallback(
    (cues: CueItem[]) => {
      save({ cuesJson: cues });
    },
    [save]
  );

  const handleNotesChange = useCallback(
    (notes: NoteItem[]) => {
      save({ notesJson: notes });
    },
    [save]
  );

  const handleSummaryChange = useCallback(
    (summary: string) => {
      save({ summaryText: summary });
    },
    [save]
  );

  const handleModeToggle = useCallback(() => {
    setMode((prev) => {
      if (prev === 'original') return 'study';
      if (prev === 'study') return 'review';
      return 'original';
    });
  }, []);

  // Render viewer based on content type
  const renderViewer = () => {
    if (!content) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading content...</p>
          </div>
        </div>
      );
    }

    // Video content
    if (content.contentType === 'VIDEO') {
      const videoUrl = content.file?.storageKey
        ? `/api/uploads/${content.file.storageKey}`
        : content.sourceUrl || '';

      return (
        <VideoPlayer
          src={videoUrl}
          duration={content.duration}
          onTimeUpdate={(time) => {
            // TODO: Update annotations based on current timestamp
          }}
        />
      );
    }

    // Audio content
    if (content.contentType === 'AUDIO') {
      const audioUrl = content.file?.storageKey
        ? `/api/uploads/${content.file.storageKey}`
        : content.sourceUrl || '';

      return (
        <AudioPlayer
          src={audioUrl}
          duration={content.duration}
          onTimeUpdate={(time) => {
            // TODO: Update annotations based on current timestamp
          }}
        />
      );
    }

    switch (content.contentType) {
      case 'PDF':
        return (
          <PDFViewer
            content={content}
            mode={mode}
            highlights={highlights}
            onCreateHighlight={handleCreateHighlight}
          />
        );
      case 'IMAGE':
        return (
          <ImageViewer
            content={content}
            mode={mode}
            highlights={highlights}
            onCreateHighlight={handleCreateHighlight}
          />
        );
      case 'DOCX':
        return <DocxViewer content={content} mode={mode} />;
      case 'ARTICLE':
        // For now, treat articles as simple text view
        return (
          <div className="h-full overflow-auto bg-white p-8">
            <article className="max-w-3xl mx-auto prose prose-lg">
              <h1>{content.title}</h1>
              {content.sourceUrl && (
                <p className="text-sm text-gray-500">
                  Source: <a href={content.sourceUrl} target="_blank" rel="noopener noreferrer">
                    {content.sourceUrl}
                  </a>
                </p>
              )}
              <div className="mt-8 whitespace-pre-wrap">
                {/* Placeholder - would need to fetch full article text */}
                <p className="text-gray-500 italic">
                  Article content would be displayed here...
                </p>
              </div>
            </article>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <p className="text-gray-500">Unsupported content type: {content.contentType}</p>
          </div>
        );
    }
  };

  // Loading state
  if (contentLoading || cornellLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Cornell Reader...</h2>
          <p className="text-gray-500">Preparing your study environment</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!content) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Content Not Found</h2>
          <p className="text-gray-500">The requested content could not be loaded.</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Review mode renders separately
  if (mode === 'review') {
    return (
      <>
        <ReviewMode />
        {toast && (
          <Toast type={toast.type} message={toast.message} onClose={hideToast} />
        )}
      </>
    );
  }

  return (
    <>
      <div className="relative h-screen flex">
        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${showAnnotations ? 'mr-80' : 'mr-0'}`}>
          <CornellLayout
            title={content.title}
            mode={mode}
            onModeToggle={handleModeToggle}
            saveStatus={status}
            lastSaved={lastSaved}
            cues={cornell?.cuesJson || []}
            onCuesChange={handleCuesChange}
            notes={cornell?.notesJson || []}
            onNotesChange={handleNotesChange}
            summary={cornell?.summaryText || ''}
            onSummaryChange={handleSummaryChange}
            viewer={
              <div ref={(el) => setContentRef(el)}>
                {renderViewer()}
              </div>
            }
          />
        </div>

        {/* Annotation Toolbar - appears on text selection */}
        {selection && (
          <AnnotationToolbar
            selection={selection}
            onCreateAnnotation={(type, color, text) => {
              handleCreateAnnotation({
                type,
                startOffset: selection.startOffset,
                endOffset: selection.endOffset,
                selectedText: selection.text,
                color,
                text,
                visibility: 'PRIVATE',
              });
            }}
            onClose={() => clearSelection()}
          />
        )}

        {/* Annotations Sidebar */}
        {showAnnotations && (
          <div className="fixed right-0 top-0 h-full w-80 border-l border-gray-200 bg-white shadow-lg z-10">
            <AnnotationsSidebar
              contentId={params.contentId}
              groupId={groupId} // ✅ Dynamic - null for solo, real ID for group
            />
          </div>
        )}

        {/* Toggle Annotations Button */}
        <button
          onClick={() => setShowAnnotations(!showAnnotations)}
          className="fixed right-4 bottom-4 z-20 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          title={showAnnotations ? 'Hide annotations' : 'Show annotations'}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
        </button>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={hideToast} />
      )}
    </>
  );
}
