'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ModernCornellLayout } from '@/components/cornell/ModernCornellLayout';
import { PDFViewer, ImageViewer, DocxViewer } from '@/components/cornell/viewers';
import { ReviewMode } from '@/components/cornell/review/ReviewMode';
import { Toast, useToast } from '@/components/ui/Toast';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { AudioPlayer } from '@/components/media/AudioPlayer';
import {
  useContent,
  useUnifiedStream,
  useUpdateCornellNotes,
  useCreateHighlight,
  useUpdateHighlight,
  useDeleteHighlight,
  useCornellAutosave,
  useSaveStatusWithOnline,
} from '@/hooks';
import type { ViewMode, UpdateCornellDto, CueItem } from '@/lib/types/cornell';
import type { UnifiedStreamItem } from '@/lib/types/unified-stream';

interface ReaderPageProps {
  params: {
    contentId: string;
  };
}

export default function ReaderPage({ params }: ReaderPageProps) {
  const [mode, setMode] = useState<ViewMode>('study');
  const { toast, show: showToast, hide: hideToast } = useToast();

  // Fetch data with unified stream
  const { data: content, isLoading: contentLoading } = useContent(params.contentId);
  const { streamItems, isLoading: streamLoading, notes, cues, highlights } = useUnifiedStream(params.contentId);

  // Mutations
  const updateMutation = useUpdateCornellNotes(params.contentId);
  const { mutateAsync: createHighlight } = useCreateHighlight(params.contentId);
  const deleteHighlightMutation = useDeleteHighlight();
  const updateHighlightMutation = useUpdateHighlight();

  // Summary state from Cornell notes (sync with fetch)
  const [summaryText, setSummaryText] = useState('');

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
      showToast('error', 'Falha ao salvar alterações');
      console.error('Autosave error:', error);
    },
  });

  const status = useSaveStatusWithOnline(baseStatus);

  // Highlight creation with feedback
  const handleCreateHighlight = useCallback(
    async (highlightData: any) => {
      try {
        await createHighlight(highlightData);
        showToast('success', 'Destaque criado!');
      } catch (error) {
        showToast('error', 'Falha ao criar destaque');
        throw error;
      }
    },
    [createHighlight, showToast]
  );

  // Handlers
  const handleCuesChange = useCallback(
    (newCues: CueItem[]) => {
      save({ cuesJson: newCues });
    },
    [save]
  );

  const handleSummaryChange = useCallback(
    (summary: string) => {
      setSummaryText(summary);
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

  const handleStreamItemClick = useCallback((item: UnifiedStreamItem) => {
    // Navigate to the item location in the viewer
    if (item.type === 'annotation' && item.pageNumber) {
      // TODO: Implement scroll to page
      console.log('Navigate to page:', item.pageNumber);
    }
  }, []);

  const handleStreamItemEdit = useCallback(async (item: UnifiedStreamItem) => {
    // TODO: Open edit modal/inline editor
    if (item.type === 'annotation') {
      // For now, just allow color change
      console.log('Edit annotation:', item);
    }
  }, []);

  const handleStreamItemDelete = useCallback(
    async (item: UnifiedStreamItem) => {
      if (item.type === 'annotation') {
        // Delete highlight
        try {
          await deleteHighlightMutation.mutateAsync(item.highlight.id);
          showToast('success', 'Anotação excluída');
        } catch (error) {
          showToast('error', 'Falha ao excluir anotação');
        }
      } else if (item.type === 'note') {
        // Remove note from Cornell notes
        const updatedNotes = notes.filter((n) => n.id !== item.note.id);
        save({ notesJson: updatedNotes });
        showToast('success', 'Nota excluída');
      }
    },
    [notes, save, showToast, deleteHighlightMutation]
  );

  const handleStreamItemSaveEdit = useCallback(
    async (item: UnifiedStreamItem, updates: any) => {
      if (item.type === 'annotation') {
        // Update highlight
        try {
          await updateHighlightMutation.mutateAsync({
            id: item.highlight.id,
            updates: updates,
          });
          showToast('success', 'Anotação atualizada');
        } catch (error) {
          showToast('error', 'Falha ao atualizar anotação');
        }
      } else if (item.type === 'note') {
        // Update note in Cornell notes
        const updatedNotes = notes.map((n) =>
          n.id === item.note.id ? { ...n, ...updates } : n
        );
        save({ notesJson: updatedNotes });
        showToast('success', 'Nota atualizada');
      }
    },
    [notes, save, showToast, updateHighlightMutation]
  );

  // Render viewer based on content type
  const renderViewer = () => {
    if (!content) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-950">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Carregando conteúdo...</p>
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
            highlights={highlights || []}
            onCreateHighlight={handleCreateHighlight}
          />
        );
      case 'IMAGE':
        return (
          <ImageViewer
            content={content}
            mode={mode}
            highlights={highlights || []}
            onCreateHighlight={handleCreateHighlight}
          />
        );
      case 'DOCX':
        return <DocxViewer content={content} mode={mode} />;
      default:
        return (
          <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-950">
            <p className="text-gray-600 dark:text-gray-400">
              Tipo de conteúdo não suportado: {content.contentType}
            </p>
          </div>
        );
    }
  };

  // Loading state
  if (contentLoading || streamLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando Cornell Notes...</p>
        </div>
      </div>
    );
  }

  // No content
  if (!content) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-950">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg">Conteúdo não encontrado</p>
        </div>
      </div>
    );
  }

  // Review mode (TODO: Pass unified data to ReviewMode)
  if (mode === 'review') {
    return (
      <div className="h-screen flex flex-col">
        <div className="p-4">
          <button
            onClick={() => setMode('study')}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Voltar ao Estudo
          </button>
          <p className="mt-4 text-gray-600">Modo de revisão em desenvolvimento...</p>
        </div>
        {toast && <Toast type={toast.type} message={toast.message} onClose={hideToast} />}
      </div>
    );
  }

  return (
    <>
      <ModernCornellLayout
        title={content.title}
        mode={mode}
        onModeToggle={handleModeToggle}
        saveStatus={status}
        lastSaved={lastSaved}
        viewer={renderViewer()}
        streamItems={streamItems}
        onStreamItemClick={handleStreamItemClick}
        onStreamItemEdit={handleStreamItemEdit}
        onStreamItemDelete={handleStreamItemDelete}
        onStreamItemSaveEdit={handleStreamItemSaveEdit}
        cues={cues}
        onCuesChange={handleCuesChange}
        onCueClick={(cue) => console.log('Cue clicked:', cue)}
        summary={summaryText}
        onSummaryChange={handleSummaryChange}
      />
      {toast && <Toast type={toast.type} message={toast.message} onClose={hideToast} />}
    </>
  );
}
