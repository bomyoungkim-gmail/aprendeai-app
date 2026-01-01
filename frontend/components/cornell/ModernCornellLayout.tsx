'use client';

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronRight, Plus, Share2, Check as CheckIcon } from 'lucide-react';
import type { ViewMode, SaveStatus, CueItem } from '@/lib/types/cornell';
import type { UnifiedStreamItem } from '@/lib/types/unified-stream';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { StreamCard } from './StreamCard';
import { SearchBar, type FilterType } from './SearchBar';
import { TargetType, ContentType } from '@/lib/constants/enums';
import { useStreamFilter } from '@/hooks/cornell/use-stream-filter';
import { CORNELL_LABELS } from '@/lib/cornell/labels';
import { ActionToolbar } from './ActionToolbar';
import { SuggestionsPanel } from './SuggestionsPanel';
import { ThreadPanel } from '../sharing/ThreadPanel';
import { ShareModal } from '../sharing/ShareModal';
import { PremiumFeatureBlock } from '../billing/PremiumFeatureBlock';
import { useAuthStore } from '@/stores/auth-store';
import { ShareContextType, CommentTargetType } from '@/lib/types/sharing';
import { useFinishSession } from '@/hooks/sessions/reading/use-reading-session';
import { useSuggestions } from '@/hooks/cornell/use-suggestions';
import { useEntitlements } from '@/hooks/billing/use-entitlements';
import { toast } from 'sonner';

import { CornellHeader } from './CornellHeader';
import { CornellContentArea } from './CornellContentArea';
import { CornellSidebar } from './CornellSidebar';
import { CornellModals } from './CornellModals';
import { CreateHighlightModal } from './CreateHighlightModal';
import { TextSelectionMenu, type SelectionAction } from './TextSelectionMenu';
import { useCornellLayout } from '@/hooks/domain/use-cornell-layout';
import { useCornellSession } from '@/hooks/domain/use-cornell-session';
import { useCornellPedagogical } from '@/hooks/domain/use-cornell-pedagogical'; 
import { useContentContext } from '@/hooks/cornell/use-content-context';
import { useTextSelection } from '@/hooks/ui/use-text-selection';
import { getColorForKey, getDefaultPalette, DEFAULT_COLOR } from '@/lib/constants/colors';
import { inferCornellType } from '@/lib/cornell/type-color-map';
import { filterSynthesisItems } from '@/lib/cornell/helpers';
import { CORNELL_MODAL_LABELS } from '@/lib/cornell/labels';
import { ContentModeIndicator } from './ContentModeIndicator';
import { ContentModeSelector } from './ContentModeSelector';
import { useContentMode } from '@/hooks/content/use-content-mode';
import { useTelemetry } from '@/hooks/telemetry/use-telemetry';
import { useScrollTracking } from '@/hooks/telemetry/use-scroll-tracking';
import { useTimeTracking } from '@/hooks/telemetry/use-time-tracking';
import { useUiBehavior } from '@/hooks/cornell/use-ui-behavior'; 
import { useUndoRedo } from '@/hooks/cornell/use-undo-redo';
import { MODE_CONFIGS } from '@/lib/config/mode-config';
import { TableOfContents } from './TableOfContents';
import { AnalyticsDashboard } from '../analytics/AnalyticsDashboard'; 
import { useFlowDetection } from '@/hooks/heuristics/use-flow-detection'; 
import { useConfusionDetection } from '@/hooks/heuristics/use-confusion-detection'; 
import { useHeuristicsStore } from '@/stores/heuristics-store'; 
import { ContentMode } from '@/lib/types/content-mode';
import { useReadingPersistence } from '@/hooks/sessions/reading/use-reading-persistence';
import { Bookmark as BookmarkIcon, History, Save, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/shared/use-online-status';
import { telemetryClient } from '@/lib/telemetry/telemetry-client';

// Pedagogical (Sprint 4)
import { useInterventions } from '@/hooks/pedagogical/use-interventions';
import { useDidacticFlow } from '@/hooks/pedagogical/use-didactic-flow';
import { useScaffolding } from '@/hooks/pedagogical/use-scaffolding';
import { PedagogicalCheckpoint } from './pedagogical/PedagogicalCheckpoint';
import { DidacticPostPhase } from './pedagogical/DidacticPostPhase';
import { MODE_PEDAGOGICAL_CONFIGS } from '@/lib/pedagogical/mode-configs';
import { useOfflineSync } from '@/hooks/offline/use-offline-sync';
import { OfflineIndicator } from '../offline/OfflineIndicator';
import { useGlossary } from '@/hooks/glossary/use-glossary';
import { GlossaryPopover } from '../glossary/GlossaryPopover';
import { SectionAnnotationsFilter } from '../annotations/SectionAnnotationsFilter';
import { detectSections, type Section } from '@/lib/content/section-detector';
import { useAccessibility } from '@/hooks/accessibility/use-accessibility';

interface ModernCornellLayoutProps {
  // Header
  title: string;
  mode: ViewMode;
  onModeToggle: () => void;
  saveStatus: SaveStatus;
  lastSaved?: Date | null;
  contentId: string;
  targetType: ContentType;
  currentPage?: number;
  currentTimestamp?: number;

  // Content
  viewer: React.ReactNode;
  
  // Unified Stream
  streamItems: UnifiedStreamItem[];
  onStreamItemClick?: (item: UnifiedStreamItem) => void;
  onStreamItemEdit?: (item: UnifiedStreamItem) => void;
  onStreamItemDelete?: (item: UnifiedStreamItem) => void;
  onStreamItemSaveEdit?: (item: UnifiedStreamItem, updates: any) => void;
  
  // Cues
  cues: CueItem[];
  onCuesChange: (cues: CueItem[]) => void;
  onCueClick?: (cue: CueItem) => void;
  
  // Summary
  summary: string;
  onSummaryChange: (summary: string) => void;

  // Creation
  // Creation
  onCreateStreamItem?: (type: 'annotation' | 'note' | 'question' | 'star' | 'ai' | 'triage', content: string, context?: any) => void;

  // Highlight Controls
  selectedColor?: string;
  onColorChange?: (color: string) => void;
  disableSelectionMenu?: boolean;
  
  // Session / Phase 5
  sessionId?: string;
  onFinishSession?: () => void;
  
  // Navigation / Resume
  onNavigate?: (page: number, scrollPct?: number) => void;
  scrollPercentage?: number;
  contentText?: string;
  onLayoutChange?: () => void;
}

type SidebarTab = 'toc' | 'stream' | 'analytics' | 'cues' | 'synthesis' | 'conversations';

export function ModernCornellLayout({
  title,
  mode,
  onModeToggle,
  saveStatus,
  lastSaved,
  contentId,
  targetType,
  currentPage,
  currentTimestamp,
  viewer,
  streamItems,
  onStreamItemClick,
  onStreamItemEdit,
  onStreamItemDelete,
  onStreamItemSaveEdit,
  cues,
  onCuesChange,
  onCueClick,
  summary,
  onSummaryChange,
  onCreateStreamItem,
  selectedColor = DEFAULT_COLOR,
  onColorChange,
  disableSelectionMenu = false,
  sessionId,
  onFinishSession,
  onNavigate,
  scrollPercentage = 0,
  contentText,
  onLayoutChange,
}: ModernCornellLayoutProps) {
  
  // Telemetry & Tracking (needed by domain hooks)
  const { track } = useTelemetry(contentId);
  useScrollTracking(contentId);
  useTimeTracking(contentId);

  // Content Mode (needed by domain hooks)
  const contentModeData = useContentMode(contentId);
  const { updateMode, isLoading: isContentModeLoading } = contentModeData;
  
  // Domain Hooks - Manage UI state and business logic
  const layout = useCornellLayout();
  const session = useCornellSession(
    contentId,
    sessionId,
    streamItems,
    onNavigate,
    onFinishSession
  );
  const pedagogical = useCornellPedagogical(
    contentId,
    contentModeData?.effectiveMode || ContentMode.NARRATIVE,
    currentPage || 1,
    layout.isUiVisible,
    track
  );
  
  
  // Offline Sync (I2.1-I2.2)
  const { isOnline, pendingCount, isSyncing, manualSync } = useOfflineSync();

  // Accessibility (I3.1-I3.3)
  const { settings } = useAccessibility();

  // Glossary (G5.3)
  const { 
    selectedTerm, 
    definition, 
    isLoading: isGlossaryLoading, 
    popoverPosition, 
    handleTermClick, 
    closePopover 
  } = useGlossary();

  // Section Filtering (G5.4)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const sections = useMemo(() => {
    if (contentModeData?.effectiveMode === ContentMode.SCIENTIFIC) {
      if (contentText) {
        return detectSections(contentText, 'SCIENTIFIC');
      }
      
      // Fallback/Mocked sections for MVP/testing if no text is provided
      return [
        { id: 'abstract', title: 'Abstract', startLine: 0, type: 'IMRAD' as const },
        { id: 'introduction', title: 'Introduction', startLine: 10, type: 'IMRAD' as const },
        { id: 'methods', title: 'Methods', startLine: 50, type: 'IMRAD' as const },
        { id: 'results', title: 'Results', startLine: 100, type: 'IMRAD' as const },
        { id: 'discussion', title: 'Discussion', startLine: 150, type: 'IMRAD' as const },
        { id: 'conclusion', title: 'Conclusion', startLine: 200, type: 'IMRAD' as const }
      ];
    }
    return [];
  }, [contentModeData?.effectiveMode, contentText]);

  const annotationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    streamItems.forEach(item => {
      if (item.type === 'annotation') {
        // For MVP/Test, we randomly assign or mock sections if not present
        const sec = (item as any).section || 'abstract';
        counts[sec] = (counts[sec] || 0) + 1;
      }
    });
    return counts;
  }, [streamItems]);

  // Pedagogical State (Sprint 4)
  const { isInFlow } = useFlowDetection({
    contentId,
    modeConfig: MODE_CONFIGS[contentModeData.effectiveMode as ContentMode],
    currentPage: currentPage || 1,
    isUiVisible: true,
  });

  const {
    shouldShow,
    handleInterventionShown,
    handleInterventionDismissed,
    handleInterventionCompleted,
    config: pedagogicalConfig
  } = useInterventions({
    contentId,
    mode: contentModeData?.effectiveMode as any || ContentMode.NARRATIVE,
    isInFlow
  });

  const { phase, completeActivation } = useDidacticFlow({
    contentId,
    enabled: contentModeData?.effectiveMode === ContentMode.DIDACTIC,
    onComplete: () => {
      toast.success('Você concluiu o fluxo didático desta leitura!');
    }
  });

  // G2.3: Scaffolding/Fading Logic
  const { currentDelay, adjustScaffolding, isScaffolding } = useScaffolding({
    config: pedagogicalConfig || MODE_PEDAGOGICAL_CONFIGS[ContentMode.NARRATIVE],
    enabled: contentModeData?.effectiveMode === ContentMode.DIDACTIC
  });

  const [activeCheckpoint, setActiveCheckpoint] = useState<{
    type: 'CHECKPOINT' | 'SCAFFOLDING';
    isBlocking: boolean;
  } | null>(null);

  // Auto-trigger Interventions
  useEffect(() => {
    if (activeCheckpoint) return; // Don't trigger if one is already active

    const interval = setInterval(() => {
      if (shouldShow()) {
        const isDidactic = contentModeData?.effectiveMode === ContentMode.DIDACTIC;
        setActiveCheckpoint({
          type: 'CHECKPOINT',
          isBlocking: isDidactic // Only block in Didactic/Scientific
        });
        handleInterventionShown('CHECKPOINT');
      }
    }, 10000); // Check every 10s

    return () => clearInterval(interval);
  }, [shouldShow, activeCheckpoint, contentModeData?.effectiveMode, handleInterventionShown]);

  // G2.1: Pre-Reading Activation Phase
  useEffect(() => {
    if (contentModeData?.effectiveMode === ContentMode.DIDACTIC && phase === 'PRE' && !activeCheckpoint) {
      setActiveCheckpoint({
        type: 'CHECKPOINT',
        isBlocking: true
      });
      handleInterventionShown('CHECKPOINT');
    }
  }, [contentModeData?.effectiveMode, phase, activeCheckpoint, handleInterventionShown]);

  // Scaffolding Adjustment (G2.3)
  useEffect(() => {
    if (pedagogicalConfig && currentDelay) {
      // The currentDelay from useScaffolding is already calculated
      // We could pass this to useUiBehavior if it supported dynamic updates
      // For now, we track that scaffolding is active
      if (isScaffolding) {
        track('SCAFFOLDING_ACTIVE', { 
          delay: currentDelay,
          mode: contentModeData?.effectiveMode 
        });
      }
    }
  }, [currentDelay, isScaffolding, pedagogicalConfig, contentModeData?.effectiveMode, track]);

  // Scaffolding Adjustment (G2.3)
  useEffect(() => {
    if (pedagogicalConfig && currentDelay) {
      if (isScaffolding) {
        track('SCAFFOLDING_ACTIVE', { 
          delay: currentDelay,
          mode: contentModeData?.effectiveMode 
        });
      }
    }
  }, [currentDelay, isScaffolding, pedagogicalConfig, contentModeData?.effectiveMode, track]);

  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);

  // Adaptive UI
  const currentMode = contentModeData?.mode || contentModeData?.inferredMode;
  const modeConfig = currentMode ? MODE_CONFIGS[currentMode] : null;

  const { isVisible: isUiVisible, toggleUi } = useUiBehavior({
    modeConfig,
    contentId
  });

  // Flow Detection
  useFlowDetection({
    contentId,
    modeConfig,
    currentPage: currentPage || 0,
    isUiVisible
  });

  // Reading Persistence (Resume & Bookmarks)
  const { 
    progress, 
    bookmarks, 
    createBookmark, 
    deleteBookmark,
    isSaving 
  } = useReadingPersistence({
    contentId,
    currentPage: currentPage || 0,
    scrollPercentage: scrollPercentage || 0,
    onRestore: (saved) => {
      toast("Retomar de onde parou?", {
        description: `Página ${saved.last_page}`,
        action: {
          label: "Sim",
          onClick: () => onNavigate?.(saved.last_page, saved.last_scroll_pct)
        },
        duration: 8000,
      });
    }
  });

  // Confusion & Overload Detection
  const { onProgress } = useConfusionDetection({
    contentId,
    modeConfig,
    mode: currentMode || ContentMode.NARRATIVE,
    currentPage: currentPage || 0,
    activeTab: layout.activeTab,
  });

  // const { isInFlow } = useHeuristicsStore(); // Removed to avoid redeclaration, using hook value instead

  // Track progress on specific actions
  useEffect(() => {
    onProgress();
  }, [currentPage, onProgress]);

  // Undo/Redo
  const { registerAction, undo, redo, canUndo, canRedo } = useUndoRedo(contentId);

  // Action Handlers
  const performUndo = useCallback(() => {
    const action = undo();
    if (!action) return;

    // Logic to revert action
    if (action.type === 'CREATE') {
        // If we created something, Undo means DELETE it.
        onStreamItemDelete?.({ id: action.data.id } as UnifiedStreamItem);
        toast.info('Ação desfeita');
    } else if (action.type === 'DELETE') {
        // If we deleted, Undo means RESTORE (params needed).
        // MVP: We might not support full restore yet without data persistence in action.data
    }
  }, [undo, onStreamItemDelete]);

  const performRedo = useCallback(() => {
    const action = redo();
    if (!action) return;
    // Logic to re-apply
    if (action.type === 'CREATE') {
        // Redo create? We need the data.
        // If action.data contains full payload...
    }
  }, [redo]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            // Check if user is typing in input
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

            e.preventDefault();
            if (e.shiftKey) {
                performRedo();
            } else {
                performUndo();
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performUndo, performRedo]);

  // --- Resume Logic (Sprint 2 Requirement 3.4 - Deferred) ---
  // TODO: Implement actual session resumption logic when backend persistence is granular enough.
  /*
  useEffect(() => {
    const savedPosition = localStorage.getItem(`reading_pos_${contentId}`);
    if (savedPosition) {
       // toast("Resume from where you left off?", { action: { label: "Yes", onClick: () => scrollTo(savedPosition) } })
    }
  }, [contentId]);
  */
  // -----------------------------------------------------------

  // History Watcher
  const prevStreamItemsLength = useRef(streamItems.length);
  useEffect(() => {
      if (streamItems.length > prevStreamItemsLength.current) {
          // Item added
          const newItem = streamItems[0]; 
          if (newItem) {
              registerAction({
                  type: 'CREATE',
                  entity: newItem.type === 'annotation' ? 'HIGHLIGHT' : 'NOTE',
                  data: { id: newItem.id },
                  description: `Created ${newItem.type}`
              });
          }
      }
      prevStreamItemsLength.current = streamItems.length;
  }, [streamItems, registerAction]);

  const user = useAuthStore((state) => state.user);

  // Phase 5 State

  const finishSession = useFinishSession(sessionId || '');

  const handleFinish = async () => {
    if (!sessionId) return;
    try {
      await finishSession.mutateAsync(undefined);
      toast.success('Tarefa finalizada com sucesso!');
      onFinishSession?.();
    } catch (error) {
      toast.error('Erro ao finalizar tarefa.');
    }
  };

  // Determine context for threads
  const threadContext = useMemo(() => {
    if (user?.activeInstitutionId) {
      return { type: ShareContextType.CLASSROOM, id: user.activeInstitutionId };
    }
    if (user?.settings?.primaryFamilyId) {
      return { type: ShareContextType.FAMILY, id: user.settings.primaryFamilyId };
    }
    // Fallback or Individual - UI should really provide this if in a Study Group
    return { type: ShareContextType.STUDY_GROUP, id: contentId }; 
  }, [user, contentId]);
  
  // Selection State
  const [contentElement, setContentElement] = useState<HTMLDivElement | null>(null);
  const { selection, clearSelection } = useTextSelection(contentElement);


  const [createModalType, setCreateModalType] = useState<'NOTE' | 'QUESTION' | 'STAR' | 'HIGHLIGHT' | 'SUMMARY'>('NOTE');

  // AI Suggestions & Entitlements
  const { suggestions, acceptSuggestion, dismissSuggestion } = useSuggestions(contentId);
  const { hasFeature } = useEntitlements();
  const hasAIAssistant = hasFeature('aiAssistant');

  // Search and filter state


  
  // Apply search and filter
  const { filteredItems, filteredCount, hasActiveFilter } = useStreamFilter(
    streamItems,
    layout.searchQuery,
    layout.filterType
  );

  const handleSelectionAction = useCallback((action: SelectionAction, text: string) => {
    if (!onCreateStreamItem) return;

    switch (action) {
      case 'highlight':
        onCreateStreamItem('annotation', text, { color: selectedColor });
        track('HIGHLIGHT_CREATED', {
            color: selectedColor,
            length: text.length,
            hasComment: false // Initial creation usually no comment
        });
        break;
      case 'note':
        onCreateStreamItem('note', text);
        track('NOTE_CREATED', { type: 'NOTE', length: text.length });
        break;
      case 'question':
        onCreateStreamItem('question', text);
        track('NOTE_CREATED', { type: 'QUESTION', length: text.length });
        break;
      case 'star':
        onCreateStreamItem('star', text);
        break;
      case 'ai':
        onCreateStreamItem('ai', text);
        break;
      case 'triage':
        onCreateStreamItem('triage', text);
        break;
    }
    clearSelection();
  }, [onCreateStreamItem, selectedColor, clearSelection]);

  // Memoize synthesis items to avoid repeated filtering
  const synthesisItems = useMemo(
    () => filterSynthesisItems(filteredItems),
    [filteredItems]
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <CornellHeader
        title={title}
        contentId={contentId}
        mode={mode}
        contentMode={contentModeData?.effectiveMode || ContentMode.NARRATIVE}
        modeSource={(contentModeData?.modeSource as 'USER' | 'INFERRED' | 'DEFAULT' | undefined) || undefined}
        inferredMode={contentModeData?.inferredMode}
        isContentModeLoading={isContentModeLoading}
        onModeClick={() => setIsModeSelectorOpen(true)}
        selectedColor={selectedColor}
        onColorChange={onColorChange}
        onShareClick={() => layout.setIsShareModalOpen(true)}
        onAIClick={() => layout.setActiveAction(layout.activeAction === 'ai' ? null : 'ai')}
        onTriageClick={() => layout.setActiveAction(layout.activeAction === 'question' ? null : 'question')}
        activeAction={layout.activeAction}
        sessionId={sessionId}
        onFinishSession={handleFinish}
        isFinishing={finishSession.isPending}
        onLayoutChange={onLayoutChange}
        isInFlow={isInFlow}
        isVisible={isUiVisible}
        onTrack={track}
      />

      {/* Main: PDF + Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Content Area */}
        <CornellContentArea
          viewer={viewer}
          selection={selection}
          onSelectionAction={handleSelectionAction}
          disableSelectionMenu={disableSelectionMenu}
          contentMode={contentModeData?.effectiveMode || ContentMode.NARRATIVE}
          onTermClick={handleTermClick}
          onContentClick={toggleUi}
          onContentElementReady={setContentElement}
          isVisible={isUiVisible}
        />

        {/* Sidebar */}
        <CornellSidebar
          isOpen={layout.sidebarOpen}
          onToggle={layout.toggleSidebar}
          activeTab={layout.activeTab}
          onTabChange={layout.setActiveTab}
          tocProps={{
            contentId,
            currentPage,
            onNavigate: (page: number, id: string) => {
              toast.info(`Navegando para pág ${page}`);
              // Here we would call viewerRef.current.jumpToPage(page)
            },
          }}
          analyticsProps={{
            contentId,
          }}
          bookmarksProps={{
            bookmarks: bookmarks || [],
            currentPage,
            scrollPercentage,
            onCreateBookmark: createBookmark,
            onDeleteBookmark: deleteBookmark,
            onNavigate,
          }}
          streamProps={{
            streamItems,
            filteredItems,
            searchQuery: layout.searchQuery,
            filterType: layout.filterType,
            onSearchChange: layout.setSearchQuery,
            onFilterChange: layout.setFilterType,
            filteredCount,
            hasActiveFilter,
            contentMode: contentModeData?.effectiveMode || ContentMode.NARRATIVE,
            sections,
            selectedSectionId,
            onSectionSelect: setSelectedSectionId,
            annotationCounts,
            onItemClick: onStreamItemClick,
            onItemEdit: onStreamItemEdit,
            onItemDelete: onStreamItemDelete,
            onItemSaveEdit: onStreamItemSaveEdit,
          }}
          cuesProps={{
            cues,
            searchQuery: layout.searchQuery,
            onSearchChange: layout.setSearchQuery,
            onCueClick,
          }}
          synthesisProps={{
            filteredItems,
            searchQuery,
            filterType,
            onSearchChange: setSearchQuery,
            onFilterChange: setFilterType,
            onCreateSynthesis: () => {
              setCreateModalType('SUMMARY');
              layout.setIsCreateModalOpen(true);
            },
            onItemClick: onStreamItemClick,
            onItemEdit: onStreamItemEdit,
            onItemDelete: onStreamItemDelete,
            onItemSaveEdit: onStreamItemSaveEdit,
          }}
          conversationsProps={{
            contentId,
            threadContext,
          }}
        />

        {/* Mobile Overlay */}
        {layout.sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => layout.setSidebarOpen(false)}
          />
        )}
      </div>



      {/* Footer with Title and Status */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <h1 className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <SaveStatusIndicator status={saveStatus} lastSaved={lastSaved} />
          {/* Connectivity Status Indicator */}
          <div className="flex items-center px-2 py-1 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-medium transition-all ml-auto sm:ml-0">
            {!isOnline ? (
              <div className="flex items-center gap-1.5 text-red-500">
                <WifiOff className="h-3 w-3" />
                <span>Modo Offline</span>
              </div>
            ) : isSyncing ? (
              <div className="flex items-center gap-1.5 text-blue-500">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Sincronizando...</span>
              </div>
            ) : pendingCount > 0 ? (
              <div className="flex items-center gap-1.5 text-amber-500">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>{pendingCount} pendentes</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-green-500">
                <Wifi className="h-3 w-3" />
                <span>Conectado</span>
              </div>
            )}
          </div>

          {lastSaved && (
            <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Modificado: {new Date(lastSaved as Date).toLocaleString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          )}
        </div>
      </footer>

      {/* Consolidated Modals */}
      <CornellModals
        // Create Highlight Modal
        isCreateModalOpen={layout.isCreateModalOpen}
        onCreateModalClose={() => layout.setIsCreateModalOpen(false)}
        createModalType={layout.createModalType}
        onCreateHighlight={onCreateStreamItem}
        selectedColor={layout.selectedColor}
        
        // Mode Selector
        isModeSelectorOpen={layout.isModeSelectorOpen}
        onModeSelectorClose={() => layout.setIsModeSelectorOpen(false)}
        contentMode={contentModeData?.mode ?? null}
        inferredMode={contentModeData?.inferredMode}
        modeSource={(contentModeData?.modeSource as 'USER' | 'INFERRED' | 'DEFAULT' | undefined) || undefined}
        onModeChange={(mode, source) => {
          updateMode({ mode, source });
          track('CHANGE_MODE', { newMode: mode, oldMode: contentModeData?.mode });
        }}
        contentId={contentId}
        
        // Share Modal
        isShareModalOpen={layout.isShareModalOpen}
        onShareModalClose={() => layout.setIsShareModalOpen(false)}
        
        // Glossary Popover
        selectedTerm={selectedTerm}
        glossaryDefinition={definition}
        isGlossaryLoading={isGlossaryLoading}
        glossaryPosition={popoverPosition}
        onGlossaryClose={closePopover}
        
        // Suggestions Panel
        showSuggestions={layout.activeAction === 'ai'}
        suggestions={pedagogical.suggestions}
        onAcceptSuggestion={pedagogical.acceptSuggestion}
        onDismissSuggestion={pedagogical.dismissSuggestion}
        hasAIAssistant={hasAIAssistant}
        
        // Action Toolbar
        showActionToolbar={layout.activeAction !== null}
        activeAction={layout.activeAction}
        onActionChange={layout.setActiveAction}
        chatInitialInput={layout.chatInitialInput}
        onChatInputChange={layout.setChatInitialInput}
        
        // Premium Feature
        showPremiumBlock={!hasAIAssistant && layout.activeAction === 'ai'}
        featureName="IA Assistente Educator"
        onPremiumDismiss={() => layout.setActiveAction(null)}
      />





      {/* Pedagogical Checkpoints (Sprint 4) */}
      {activeCheckpoint && (
        <PedagogicalCheckpoint
          contentId={contentId}
          isBlocking={activeCheckpoint.isBlocking}
          onComplete={(score) => {
            handleInterventionCompleted(activeCheckpoint.type, { score });
            adjustScaffolding(score); // G2.3: Adjust UI based on performance
            setActiveCheckpoint(null);
            if (activeCheckpoint.isBlocking && phase === 'PRE') {
              completeActivation();
            }
          }}
          onDismiss={() => {
            handleInterventionDismissed(activeCheckpoint.type);
            setActiveCheckpoint(null);
          }}
        />
      )}

      {/* G2.4: POST Phase for DIDACTIC Mode */}
      {contentModeData?.effectiveMode === ContentMode.DIDACTIC && phase === 'POST' && (
        <DidacticPostPhase
          contentId={contentId}
          onComplete={() => {
            toast.success('Leitura didática concluída com sucesso!');
            // Could trigger navigation or other completion logic
          }}
        />
      )}

      <OfflineIndicator 
        isOnline={isOnline}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
        onManualSync={manualSync}
      />


    </div>
  );
}
