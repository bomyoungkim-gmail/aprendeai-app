'use client';

import React, { useState, useCallback } from 'react';
import { CornellLayout } from '@/components/cornell';
import { PDFViewer, ImageViewer, DocxViewer } from '@/components/cornell/viewers';
import { Toast, useToast } from '@/components/ui/Toast';
import {
  useContent,
  useCornellNotes,
  useUpdateCornellNotes,
  useHighlights,
  useCreateHighlight,
  useCornellAutosave,
  useSaveStatusWithOnline,
} from '@/hooks';
import type { ViewMode, CueItem, NoteItem } from '@/lib/types/cornell';

interface ReaderPageProps {
  params: {
    contentId: string;
  };
}

export default function ReaderPage({ params }: ReaderPageProps) {
  const [mode, setMode] = useState<ViewMode>('study');
  const { toast, show: showToast, hide: hideToast } = useToast();

  // Fetch data
  const { data: content, isLoading: contentLoading } = useContent(params.contentId);
  const { data: cornell, isLoading: cornellLoading } = useCornellNotes(params.contentId);
  const { data: highlights } = useHighlights(params.contentId);

  // Mutations
  const updateMutation = useUpdateCornellNotes(params.contentId);
  const { mutateAsync: createHighlight } = useCreateHighlight(params.contentId);

  // Autosave
  const { save, status: baseStatus, lastSaved } = useCornellAutosave({
    onSave: async (data) => {
      await updateMutation.mutateAsync(data);
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
    setMode((prev) => (prev === 'original' ? 'study' : 'original'));
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

  return (
    <>
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
        viewer={renderViewer()}
      />

      {/* Toast Notifications */}
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={hideToast} />
      )}
    </>
  );
}
