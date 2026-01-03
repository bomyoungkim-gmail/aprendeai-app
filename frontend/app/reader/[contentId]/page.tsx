'use client';

import { logger } from '@/lib/utils/logger';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ModernCornellLayout } from '@/components/cornell/ModernCornellLayout';
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
import { TextViewer } from '@/components/cornell/viewers/TextViewer';

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
import type { UnifiedStreamItem, UnifiedStreamItemType } from '@/lib/types/unified-stream';
import { reactPDFToBackend } from '@/lib/adapters/highlight-adapter';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { CreateHighlightDto } from '@/lib/types/cornell';
import { ContentType } from '@/lib/constants/enums';

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
  const { save, status, lastSaved } = useCornellAutosave<UpdateCornellDto>({
    onSave: async (data) => {
      console.log('📝 Autosave payload:', JSON.stringify(data, null, 2));
      await updateMutation.mutateAsync(data);
    },
    delay: 1000,
    onSuccess: () => {
      // Optionally show success toast
    },
    onError: (error: any) => {
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

  const handleNavigate = useCallback((page: number, _scrollPct?: number) => {
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
      } else if (item.type === 'note' || item.type === 'synthesis') {
        // Remove note from Cornell notes
        const targetId = item.type === 'note' ? item.note.id : item.id;
        const updatedNotes = (notes || []).filter((n: any) => n.id !== targetId);
        save({ notes_json: updatedNotes });
        toastControls.success(item.type === 'synthesis' ? 'Síntese concluída/removida' : 'Nota excluída');
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
      } else if (item.type === 'note' || item.type === 'synthesis') {
        // Update note in Cornell notes
        const targetId = item.type === 'note' ? item.note.id : item.id;
        const updatedNotes = (notes || []).map((n: any) =>
          n.id === targetId ? { ...n, ...updates } : n
        );
        save({ notes_json: updatedNotes });
        toastControls.success(item.type === 'synthesis' ? 'Síntese atualizada' : 'Nota atualizada');
      }
    },
    [notes, save, toastControls, updateHighlightMutation]
  );



  // Render viewer based on content type
  // Handle creating stream items from viewers (PDF/Text)
  const handleCreateStreamItem = useCallback(
    async (type: UnifiedStreamItemType, text: string, data?: unknown) => {
      logger.debug('Create stream item action', { type, textLength: text.length });
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
          case 'important':
            track('star_added', { text: text.substring(0, 50) });
            toastControls.success('Marcado como Favorito');
            break;
          case 'annotation':
            // Robust Highlight Creation
            const meta = data as any;
            if (meta?.isManualSelection || meta?.anchor) {
              const tagsJson = meta.tags || ['highlight'];
              const colorKey = meta.colorKey || selectedColor;

              // Fallback anchor for text/HTML content if none provided
              const fallbackAnchor: any = {
                  type: 'DOCX_TEXT', 
                  quote: text,
                  range: { 
                    startPath: [], 
                    startOffset: 0, 
                    endPath: [], 
                    endOffset: text.length 
                  } 
              };

              await handleCreateHighlight({
                kind: 'TEXT',
                target_type: content?.contentType || ContentType.ARTICLE,
                anchor_json: (meta.anchor || fallbackAnchor) as any,
                color_key: colorKey,
                tags_json: tagsJson,
                timestamp_ms: currentTimestamp,
                page_number: currentPage
              });
              
              track('highlight_created', { 
                type: meta.type || 'HIGHLIGHT', 
                color: colorKey, 
                text_length: text.length 
              });
            }
            break;
          case 'ai':
            // AI action is handled by ModernCornellLayout.handleSelectionAction
            // This case should not be reached if using TextSelectionMenu
            logger.warn('AI action called on ReaderPage handler - should use Layout handler');
            track('ai_action_deprecated_path', { text_length: text.length });
            break;
          case 'synthesis':
            const synthesisId = id || crypto.randomUUID();
            const newSynthesisNote = { id: synthesisId, body: text, type: 'synthesis', linkedHighlightIds: [] };
            await save({ notes_json: [...(notes || []), newSynthesisNote] });
            track('synthesis_created', { note_id: synthesisId });
            toastControls.success('Instância de síntese criada');
            break;
          case 'triage':
            // Create highlight with 'triage' tag - To be implemented with proper tagging
            track('definition_opened', { text: text.substring(0, 50) });
            toastControls.info('Adicionado à triagem 📋');
            break;
        }
      } catch (error) {
        logger.error('Failed to create stream item', error, { type });
        toastControls.error('Falha ao criar item');
      }
    },
    [save, notes, cues, toastControls, track]
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
            forwardedRef={viewerRef}
            content={content}
            mode={mode}
            highlights={highlights || []}
            onCreateHighlight={handleCreateHighlight}
            selectedColor={selectedColor}
            onSelectionAction={handleCreateStreamItem as any}
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


  // Common props calculated safely
  const commonProps = {
    title: content?.title || 'Carregando...',
    mode,
    onModeToggle: handleModeToggle,
    saveStatus: status,
    lastSaved: lastSaved,
    viewer: renderViewer()
  };

  return (
    <ErrorBoundary>
      <div className="h-screen w-full overflow-hidden flex flex-col relative">
        {/* Main Render Logic - Single Return Path */}
        {(!content || contentLoading || streamLoading) ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Carregando conteúdo...</p>
            </div>
          </div>
        ) : mode === 'review' ? (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
              <button
                onClick={() => setMode('study')}
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
              >
                ← Voltar ao Estudo
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-600 dark:text-gray-400 text-lg italic">
                Modo de revisão em desenvolvimento...
              </p>
            </div>
          </div>
        ) : (
          /* Cornell Study Layout - Only Modern remains */
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
            onCreateStreamItem={handleCreateStreamItem as any}
            selectedColor={selectedColor}
            onColorChange={setSelectedColor}
            onNavigate={handleNavigate}
            contentText={content?.text}
            scrollPercentage={0}
          />
        )}
        
        {/* Global UI Elements */}
        {toastControls.toast && (
          <Toast 
            type={toastControls.toast.type} 
            message={toastControls.toast.message} 
            onClose={toastControls.hide} 
          />
        )}
        

      </div>
    </ErrorBoundary>
  );
}
