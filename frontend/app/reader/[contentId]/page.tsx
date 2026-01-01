'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ModernCornellLayout } from '@/components/cornell/ModernCornellLayout';
import { CornellLayout } from '@/components/cornell/CornellLayout'; // Added for Classic Mode
// Dynamic imports to avoid SSR issues (canvas) and reduce bundle size
const PDFViewer = dynamic(() => import('@/components/cornell/viewers/PDFViewerNew').then(mod => mod.PDFViewer), { ssr: false, loading: () => <div className="h-full flex items-center justify-center">Carregando PDF...</div> });
// Import the ref type separately
import type { PDFViewerRef } from '@/components/cornell/viewers/PDFViewerNew';
const ImageViewer = dynamic(() => import('@/components/cornell/viewers/ImageViewer').then(mod => mod.ImageViewer), { ssr: false, loading: () => <div className="h-full flex items-center justify-center">Carregando Imagem...</div> });
const DocxViewer = dynamic(() => import('@/components/cornell/viewers/DocxViewer').then(mod => mod.DocxViewer), { ssr: false, loading: () => <div className="h-full flex items-center justify-center">Carregando Documento...</div> });
import { ReviewMode } from '@/components/cornell/review/ReviewMode';
import { Toast, useToast } from '@/components/ui/Toast';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { AudioPlayer } from '@/components/media/AudioPlayer';
import { ActionToolbar } from '@/components/cornell/ActionToolbar';
import { TextViewer } from '@/components/cornell/viewers/TextViewer';
import { AIChatPanel } from '@/components/cornell/AIChatPanel';
import {
  useContent,
  useUnifiedStream,
  useUpdateCornellNotes,
  useCreateHighlight,
  useUpdateHighlight,
  useDeleteHighlight,
  useCornellAutosave,
} from '@/hooks/cornell';
import { useFocusTracking } from '@/hooks/ui';
import { useAutoTrackReading } from '@/hooks/shared';
import { useTelemetry } from '@/hooks/telemetry/use-telemetry';
import type { ViewMode, UpdateCornellDto, CueItem } from '@/lib/types/cornell';
import type { UnifiedStreamItem } from '@/lib/types/unified-stream';
import { reactPDFToBackend } from '@/lib/adapters/highlight-adapter';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { CreateHighlightDto } from '@/lib/types/cornell';

interface ReaderPageProps {
  params: {
    contentId: string;
  };
}

export default function ReaderPage({ params }: ReaderPageProps) {
  const [mode, setMode] = useState<ViewMode>('study');
  const toastControls = useToast();
  const viewerRef = useRef<PDFViewerRef>(null);

  // Activity tracking: Focus metrics and reading time
  const focusMetrics = useFocusTracking(true);
  useAutoTrackReading(params.contentId);
  const { track } = useTelemetry(params.contentId);

  // Fetch data with unified stream
  const { data: content, isLoading: contentLoading } = useContent(params.contentId);
  const { streamItems, isLoading: streamLoading, notes, cues, highlights, summary } = useUnifiedStream(params.contentId);

  // Mutations
  const updateMutation = useUpdateCornellNotes(params.contentId);
  const { mutateAsync: createHighlight } = useCreateHighlight(params.contentId);
  const deleteHighlightMutation = useDeleteHighlight();
  const updateHighlightMutation = useUpdateHighlight();

  // Summary state from Cornell notes (sync with fetch)
  const [summaryText, setSummaryText] = useState('');
  
  // Sync summary when loaded
  useEffect(() => {
    if (summary) {
      setSummaryText(summary);
    }
  }, [summary]);

  // Highlight state
  // Highlight state
  const [selectedColor, setSelectedColor] = useState('red');
  
  // Context State (for anchoring)
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTimestamp, setCurrentTimestamp] = useState(0);

  // Autosave
  const { save, status, lastSaved } = useCornellAutosave({
    onSave: async (data) => {
      console.log('📝 Autosave payload:', JSON.stringify(data, null, 2));
      await updateMutation.mutateAsync(data as UpdateCornellDto);
    },
    delay: 1000,
    onSuccess: () => {
      // Optionally show success toast
    },
    onError: (error) => {
      toastControls.error('Falha ao salvar alterações');
      console.error('Autosave error:', error);
    },
  });

  // Highlight creation with feedback
  const handleCreateHighlight = useCallback(
    async (highlightData: CreateHighlightDto) => {
      try {
        await createHighlight(highlightData);
        toastControls.success('Destaque criado!');
      } catch (error) {
        toastControls.error('Falha ao criar destaque');
        throw error;
      }
    },
    [createHighlight, toastControls]
  );

  // Handlers
  const handleCuesChange = useCallback(
    (newCues: CueItem[]) => {
      save({ cues_json: newCues });
    },
    [save]
  );

  const handleSummaryChange = useCallback(
    (summary: string) => {
      setSummaryText(summary);
      save({ summary_text: summary });
    },
    [save, setSummaryText]
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
      viewerRef.current?.jumpToPage(item.pageNumber);
      toastControls.info(`Navegando para página ${item.pageNumber}`);
    }
  }, [toastControls]);

  const handleNavigate = useCallback((page: number, scrollPct?: number) => {
    setCurrentPage(page);
    viewerRef.current?.jumpToPage(page);
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
          toastControls.success('Anotação excluída');
        } catch (error) {
          toastControls.error('Falha ao excluir anotação');
        }
      } else if (item.type === 'note') {
        // Remove note from Cornell notes
        const updatedNotes = (notes || []).filter((n) => n.id !== item.note.id);
        save({ notes_json: updatedNotes });
        toastControls.success('Nota excluída');
      }
    },
    [notes, save, toastControls, deleteHighlightMutation]
  );

  const handleStreamItemSaveEdit = useCallback(
    async (item: UnifiedStreamItem, updates: Partial<{ body: string; color_key: string; comment_text: string }>) => {
      if (item.type === 'annotation') {
        // Update highlight
        try {
          await updateHighlightMutation.mutateAsync({
            id: item.highlight.id,
            updates: updates,
          });
          toastControls.success('Anotação atualizada');
        } catch (error) {
          toastControls.error('Falha ao atualizar anotação');
        }
      } else if (item.type === 'note') {
        // Update note in Cornell notes
        const updatedNotes = (notes || []).map((n) =>
          n.id === item.note.id ? { ...n, ...updates } : n
        );
        save({ notes_json: updatedNotes });
        toastControls.success('Nota atualizada');
      }
    },
    [notes, save, toastControls, updateHighlightMutation]
  );

  // AI Chat Panel state
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiChatContext, setAiChatContext] = useState<{ text: string; selection?: any }>({ text: '' });

  // Render viewer based on content type
  // Handle creating stream items from viewers (PDF/Text)
  const handleCreateStreamItem = useCallback(
    async (type: 'note' | 'question' | 'ai' | 'star' | 'triage' | 'annotation', text: string, data?: any) => {
      console.log('Create stream item action:', type, text);
      const id = crypto.randomUUID();

      try {
        switch (type) {
          case 'note':
            const newNote = { id, body: text, linkedHighlightIds: [] };
            await save({ notes_json: [...(notes || []), newNote] });
            track('note_created', { note_id: id, text_length: text.length });
            toastControls.success('Nota criada');
            break;
          case 'question':
            const newCue = { id, prompt: text, linkedHighlightIds: [] };
            await save({ cues_json: [...(cues || []), newCue] });
            track('question_created', { cue_id: id });
            toastControls.success('Dúvida criada');
            break;
          case 'star':
            track('star_added', { text: text.substring(0, 50) });
            toastControls.success('Marcado como Favorito');
            break;
          case 'annotation':
            // For HTML content, we would create a highlight here.
            // For PDF, this is handled by viewer's internal menu usually.
            // If triggered from global menu (HTML), we need logic.
            // For now, simpler fallback:
             track('highlight_created', { type: 'manual_fallback', text_length: text.length });
             toastControls.success('Destaque criado');
            break;
          case 'ai':
            // Open AI chat panel with selected text as context
            track('ai_chat_opened', { context_text: text.substring(0, 100) });
            setAiChatContext({ text, selection: data });
            setAiChatOpen(true);
            break;
           case 'triage':
            // Create highlight with 'triage' tag - To be implemented with proper tagging
            track('definition_opened', { text: text.substring(0, 50) });
            toastControls.info('Adicionado à triagem 📋');
            break;
        }
      } catch (error) {
        console.error('Failed to create item:', error);
        toastControls.error('Falha ao criar item');
      }
    },
    [save, notes, cues, toastControls, setAiChatContext, setAiChatOpen]
  );

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
            setCurrentTimestamp(Math.floor(time * 1000)); // Convert to ms
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
             setCurrentTimestamp(Math.floor(time * 1000)); // Convert to ms
          }}
        />
      );
    }

    switch (content.contentType) {
      case 'PDF':
        return (
          <PDFViewer
            ref={viewerRef}
            content={content}
            mode={mode}
            highlights={highlights || []}
            onCreateHighlight={handleCreateHighlight}
            selectedColor={selectedColor}
            onSelectionAction={handleCreateStreamItem}
            onPageChange={setCurrentPage}
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
      case 'ARTICLE':
        return <TextViewer content={content} />;
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
        {toastControls.toast && <Toast type={toastControls.toast.type} message={toastControls.toast.message} onClose={toastControls.hide} />}
      </div>
    );
  }

  // Layout Toggle State (Sprint 6)
  const [layoutMode, setLayoutMode] = useState<'modern' | 'classic'>('modern');

  // Load preference from local storage on mount
  useEffect(() => {
    const savedLayout = localStorage.getItem('cornell-layout-preference');
    if (savedLayout === 'classic') {
      setLayoutMode('classic');
    }
  }, []);

  const toggleLayout = useCallback(() => {
    setLayoutMode((prev) => {
      const newMode = prev === 'modern' ? 'classic' : 'modern';
      localStorage.setItem('cornell-layout-preference', newMode);
      toastControls.success(`Modo ${newMode === 'modern' ? 'Moderno' : 'Clássico'} ativado`);
      return newMode;
    });
  }, [toastControls]);

  // Loading state
  const isLoading = contentLoading || streamLoading || !content;

  if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-950">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Carregando Cornell Notes...</p>
          </div>
        </div>
      );
  }

  // Common props
  const commonProps = {
    title: content.title,
    mode,
    onModeToggle: handleModeToggle,
    saveStatus: status,
    lastSaved: lastSaved,
    viewer: renderViewer(),
    onLayoutChange: toggleLayout
  };

  return (
    <ErrorBoundary>
      <>
        {layoutMode === 'modern' ? (
          <ModernCornellLayout
            {...commonProps}
            contentId={params.contentId}
            targetType={content.contentType}
            currentPage={currentPage}
            currentTimestamp={currentTimestamp}
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
            disableSelectionMenu={content.contentType === 'PDF'}
            onCreateStreamItem={handleCreateStreamItem}
            selectedColor={selectedColor}
            onColorChange={setSelectedColor}
            onNavigate={handleNavigate}
            contentText={(content as any)?.text}
            scrollPercentage={0}
          />
        ) : (
          /* Classic Layout needs raw cues and notes, which we have from useUnifiedStream */
          /* We need to import CornellLayout at the top! */
          <div className="h-screen bg-white">
             {/* Dynamic import CornellLayout to avoid circular dependencies if any, or just standard import */}
             <CornellLayout 
                {...commonProps}
                cues={cues || []}
                onCuesChange={handleCuesChange}
                notes={notes || []}
                onNotesChange={(newNotes: any[]) => save({ notes_json: newNotes })}
                summary={summaryText}
                onSummaryChange={handleSummaryChange}
                onCueClick={(cue: any) => console.log('Classic Cue click:', cue)}
                onNoteClick={(note: any) => console.log('Classic Note click:', note)}
             />
          </div>
        )}
        
        {toastControls.toast && <Toast type={toastControls.toast.type} message={toastControls.toast.message} onClose={toastControls.hide} />}
        
        <AIChatPanel 
          isOpen={aiChatOpen} 
          onClose={() => setAiChatOpen(false)}
          initialInput={aiChatContext.text}
          selection={aiChatContext.selection}
        />
      </>
    </ErrorBoundary>
  );
}
