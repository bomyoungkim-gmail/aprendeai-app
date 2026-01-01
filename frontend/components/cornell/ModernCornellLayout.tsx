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

import { CreateHighlightModal } from './CreateHighlightModal';
import { TextSelectionMenu, type SelectionAction } from './TextSelectionMenu'; 
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SidebarTab>('toc'); 
  const [activeAction, setActiveAction] = useState<'highlight' | 'note' | 'question' | 'ai' | 'bookmark' | null>(null);
  
  // Telemetry & Tracking
  const { track } = useTelemetry(contentId);
  useScrollTracking(contentId);
  useTimeTracking(contentId);

  // Content Mode
  const contentModeData = useContentMode(contentId);
  const { updateMode, isLoading: isContentModeLoading } = contentModeData;
  
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
    activeTab
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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
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
  const [chatInitialInput, setChatInitialInput] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<'NOTE' | 'QUESTION' | 'STAR' | 'HIGHLIGHT' | 'SUMMARY'>('NOTE');

  // AI Suggestions & Entitlements
  const { suggestions, acceptSuggestion, dismissSuggestion } = useSuggestions(contentId);
  const { hasFeature } = useEntitlements();
  const hasAIAssistant = hasFeature('aiAssistant');

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  
  // Apply search and filter
  const { filteredItems, filteredCount, hasActiveFilter } = useStreamFilter(
    streamItems,
    searchQuery,
    filterType
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
      <header className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 md:px-4 py-2 md:py-3 flex items-center justify-between gap-2 md:gap-4 flex-shrink-0 fixed top-0 w-full z-50 transition-transform duration-300 ${isUiVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        {/* Left: Back button */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <Link 
            href="/dashboard" 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
          >
            <ChevronRight className="w-5 h-5 rotate-180 text-gray-600 dark:text-gray-300" />
          </Link>
        </div>

        {/* Center: Color Picker & Actions */}
        <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar">
           
            <ContentModeIndicator 
               mode={contentModeData?.mode ?? null}
               source={contentModeData?.modeSource}
               inferredMode={contentModeData?.inferredMode}
               isLoading={isContentModeLoading}
               onClick={() => {
                 track('CLICK_MODE_INDICATOR');
                 setIsModeSelectorOpen(true);
               }}
               className={`hidden sm:flex transition-all duration-500 ${isInFlow ? 'ring-2 ring-purple-400 ring-offset-2 scale-105 shadow-purple-200/50 shadow-lg' : ''}`}
            />

            {isInFlow && (
              <span className="animate-pulse text-lg ml-[-12px] z-10" title="Estado de Flow Detectado">✨</span>
            )}

           <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 shrink-0 hidden sm:block"></div>

           {/* Color Picker */}
           <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-full p-1 shrink-0">
              {getDefaultPalette().map((color) => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    selectedColor === color ? 'border-gray-800 dark:border-gray-100 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: getColorForKey(color) }}
                  onClick={() => onColorChange?.(color)}
                  title={color.charAt(0).toUpperCase() + color.slice(1)}
                  aria-label={`Select color ${color}`}
                />
              ))}
           </div>

           <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 shrink-0"></div>

           {/* Action Buttons */}
           <div className="flex items-center gap-2 shrink-0">
              <button 
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                onClick={() => setIsShareModalOpen(true)}
                title="Compartilhar"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Compartilhar</span>
              </button>

      
               {/* Layout Switch - Sprint 6 */}
               {onLayoutChange && (
                 <button 
                   className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
                   onClick={onLayoutChange}
                   title="Alternar para visualização clássica"
                 >
                   <span className="text-lg">🏛️</span>
                   <span className="hidden sm:inline">Clássico</span>
                 </button>
               )}

              {sessionId && (
                <button 
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                  onClick={handleFinish}
                  disabled={finishSession.isPending}
                >
                  <CheckIcon className="w-4 h-4" />
                  <span>{finishSession.isPending ? 'Finalizando...' : 'Entregar'}</span>
                </button>
              )}

              <button 
                className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                  ${activeAction === 'ai'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 ring-2 ring-purple-500'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50'
                  }`}
                onClick={() => setActiveAction(activeAction === 'ai' ? null : 'ai')}
                title="IA Assistente"
              >
                <span className="text-lg">✨</span>
                <span className="hidden md:inline">IA</span>
              </button>
              <button 
                 className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                  ${activeAction === 'question'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 ring-2 ring-blue-500'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50'
                  }`}
                 onClick={() => setActiveAction(activeAction === 'question' ? null : 'question')}
                 title="Triagem"
              >
                <span className="text-lg">📖</span>
                <span className="hidden md:inline">Triagem</span>
              </button>
           </div>
        </div>

        {/* Right: Menu */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors lg:hidden"
            aria-label="Menu"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>
        </div>
      </header>

      {/* Main: PDF + Sidebar */}
      <div className={`flex-1 flex overflow-hidden relative transition-[padding] duration-300 ${isUiVisible ? 'pt-16' : 'pt-0'}`}>
        {/* PDF Viewer */}
        <div 
          className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-950" 
          ref={setContentElement}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            const text = window.getSelection()?.toString().trim();
            
            // SCIENTIFIC mode Glossary Trigger (G5.3)
            if (contentModeData?.effectiveMode === ContentMode.SCIENTIFIC && !text) {
              const clickedText = target.innerText;
              if (clickedText && clickedText.length > 3) {
                // List of scientific terms that trigger glossary
                const scientificTerms = ['mitochondria', 'photosynthesis', 'enzyme'];
                const lowerText = clickedText.toLowerCase();
                
                for (const term of scientificTerms) {
                  if (lowerText.includes(term)) {
                    handleTermClick(term, e as any);
                    return;
                  }
                }
              }
            }

            if (text) return;
            toggleUi();
          }}
        >
          {!disableSelectionMenu && (
            <TextSelectionMenu 
              selectionInfo={selection} 
              onAction={handleSelectionAction} 
            />
          )}
          
          {viewer}
        </div>

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:relative inset-y-0 right-0 z-40
            w-full sm:w-96 lg:w-[30%] max-w-md
            bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            flex flex-col
          `}
        >
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0">
            <button
              onClick={() => setActiveTab('toc')}
              data-testid="tab-toc"
              className={`
                flex-1 px-4 py-3 text-sm font-medium transition-colors
                ${activeTab === 'toc' 
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }
              `}
            >
              Sumário
            </button>
            <button
              onClick={() => setActiveTab('stream')}
              data-testid="tab-stream"
              className={`
                flex-1 px-4 py-3 text-sm font-medium transition-colors
                ${activeTab === 'stream' 
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }
              `}
            >
              {CORNELL_LABELS.HIGHLIGHTS_NOTES}
            </button>
            <button
              onClick={() => setActiveTab('cues')}
              data-testid="tab-bookmarks"
              className={`
                flex-1 px-4 py-3 text-sm font-medium transition-colors
                ${activeTab === 'cues' 
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }
              `}
            >
              Favoritos
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              data-testid="tab-analytics"
              className={`
                flex-1 px-4 py-3 text-sm font-medium transition-colors
                ${activeTab === 'analytics' 
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }
              `}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('synthesis')}
              className={`
                flex-1 px-4 py-3 text-sm font-medium transition-colors
                ${activeTab === 'synthesis' 
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }
              `}
            >
              {CORNELL_LABELS.SYNTHESIS}
            </button>
            <button
              onClick={() => setActiveTab('conversations')}
              className={`
                flex-1 px-4 py-3 text-sm font-medium transition-colors
                ${activeTab === 'conversations' 
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }
              `}
            >
              Conversas
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
             {activeTab === 'toc' && (
                <TableOfContents 
                   contentId={contentId}
                   currentPage={currentPage}
                   onNavigate={(page: number, id: string) => {
                       toast.info(`Navegando para pág ${page}`);
                       // Here we would call viewerRef.current.jumpToPage(page)
                   }}
                />
             )}
             {activeTab === 'analytics' && (
                <div className="p-4">
                  <AnalyticsDashboard contentId={contentId} />
                </div>
             )}

              {activeTab === 'cues' && (
                <div className="p-4 space-y-4">
                   <div className="flex items-center justify-between mb-2">
                       <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Marcadores</h3>
                       <button 
                        onClick={() => createBookmark({ page_number: currentPage || 1, scroll_pct: scrollPercentage })}
                        data-testid="add-bookmark-button"
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 flex items-center gap-1"
                       >
                         <Plus className="w-3 h-3" /> Novo
                       </button>
                   </div>
                   {bookmarks?.length === 0 ? (
                     <p className="text-sm text-gray-500 italic">Nenhum marcador salvo ainda.</p>
                   ) : (
                     <div className="space-y-2">
                        {bookmarks?.map((b: any) => (
                          <div key={b.id} className="group flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-purple-300 transition-all shadow-sm">
                            <div 
                              className="flex-1 cursor-pointer"
                              onClick={() => onNavigate?.(b.page_number, b.scroll_pct)}
                            >
                              <div className="flex items-center gap-2">
                                <BookmarkIcon className="w-4 h-4 text-purple-500" />
                                <span className="font-medium text-sm">Página {b.page_number}</span>
                              </div>
                              {b.label && <p className="text-xs text-gray-500 mt-1">{b.label}</p>}
                              <p className="text-[10px] text-gray-400 mt-1 italic">Salvo em {new Date(b.created_at).toLocaleDateString()}</p>
                            </div>
                            <button 
                              onClick={() => deleteBookmark(b.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                     </div>
                   )}
                </div>
              )}

            {activeTab === 'stream' && (
              <div className="p-4 space-y-4">
                {contentModeData?.effectiveMode === ContentMode.SCIENTIFIC && sections.length > 0 && (
                  <SectionAnnotationsFilter
                    sections={sections}
                    selectedSection={selectedSectionId}
                    annotationCounts={annotationCounts}
                    onSectionSelect={setSelectedSectionId}
                  />
                )}
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onClear={() => setSearchQuery('')}
                  activeFilter={filterType}
                  onFilterChange={setFilterType}
                  resultCount={filteredCount}
                />
                
                <div className="space-y-3">
                  {filteredItems.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                      {hasActiveFilter 
                        ? 'Nenhum resultado encontrado' 
                        : 'Nenhuma anotação ainda. Destaque texto no PDF para começar.'}
                    </p>
                  ) : (
                    filteredItems
                      .filter(item => !selectedSectionId || (item as any).section === selectedSectionId || (selectedSectionId === 'abstract')) // Soft match for MVP
                      .map(item => (
                      <StreamCard
                        key={item.id}
                        item={item}
                        onClick={() => onStreamItemClick?.(item)}
                        onEdit={() => onStreamItemEdit?.(item)}
                        onDelete={() => onStreamItemDelete?.(item)}
                        onSaveEdit={onStreamItemSaveEdit}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'cues' && (
              <div className="p-4 space-y-3">
                 <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onClear={() => setSearchQuery('')}
                  activeFilter={filterType}
                  onFilterChange={setFilterType}
                  resultCount={cues.filter(c => c.prompt.toLowerCase().includes(searchQuery.toLowerCase())).length}
                />
                
                {cues.filter(c => c.prompt.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    {searchQuery 
                      ? 'Nenhuma dúvida encontrada' 
                      : 'Nenhum tópico ainda. Adicione perguntas para estudar.'}
                  </p>
                ) : (
                  cues
                    .filter(c => c.prompt.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(cue => (
                    <div 
                      key={cue.id} 
                      onClick={() => onCueClick?.(cue)}
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {cue.prompt}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}


            {activeTab === 'synthesis' && (
              <div className="p-4 space-y-4">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onClear={() => setSearchQuery('')}
                  activeFilter={filterType}
                  onFilterChange={setFilterType}
                  resultCount={filteredItems.filter(i => {
                      if (i.type === 'annotation') {
                         return inferCornellType(i.highlight.colorKey, i.highlight.tagsJson) === 'SUMMARY';
                      }
                      return false;
                   }).length}
                />

                 <div className="flex items-center justify-end">
                   <button
                     onClick={() => {
                       setCreateModalType('SUMMARY');
                       setIsCreateModalOpen(true);
                     }}
                     className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900"
                     title="Adicionar Síntese"
                   >
                     <Plus className="w-5 h-5" />
                   </button>
                 </div>
                
                <div className="space-y-3">
                   {filteredItems.filter(i => {
                      if (i.type === 'annotation') {
                         return inferCornellType(i.highlight.colorKey, i.highlight.tagsJson) === 'SUMMARY';
                      }
                      return false;
                   }).length === 0 ? (
                    <div className="text-center py-8">
                       <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                         Nenhuma síntese encontrada.
                       </p>
                       <button
                         onClick={() => {
                           setCreateModalType('SUMMARY');
                           setIsCreateModalOpen(true);
                         }}
                         className="text-sm text-blue-600 hover:underline"
                       >
                         Criar primeira síntese
                       </button>
                    </div>
                  ) : (
                    filteredItems.filter(i => {
                      if (i.type === 'annotation') {
                         return inferCornellType(i.highlight.colorKey, i.highlight.tagsJson) === 'SUMMARY';
                      }
                      return false;
                   }).map(item => (
                      <StreamCard
                        key={item.id}
                        item={item}
                        onClick={() => onStreamItemClick?.(item)}
                        onEdit={() => onStreamItemEdit?.(item)}
                        onDelete={() => onStreamItemDelete?.(item)}
                        onSaveEdit={onStreamItemSaveEdit}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'conversations' && (
              <ThreadPanel 
                query={{
                  contextType: threadContext.type,
                  contextId: threadContext.id,
                  targetType: CommentTargetType.CONTENT,
                  targetId: contentId
                }}
              />
            )}
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>

       <CreateHighlightModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        contentId={contentId}
        targetType={targetType as any}
        initialType={createModalType}
        initialPage={currentPage}
        initialTimestamp={currentTimestamp}
      />

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
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        contentId={contentId} 
        title={title} 
      />

      {activeAction === 'ai' && (
        hasAIAssistant ? (
          <SuggestionsPanel 
            suggestions={suggestions} 
            onAccept={acceptSuggestion} 
            onDismiss={dismissSuggestion} 
          />
        ) : (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all animate-in fade-in duration-300">
            <div className="relative w-full max-w-md">
              <button 
                onClick={() => setActiveAction(null)} 
                className="absolute -top-12 right-0 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <PremiumFeatureBlock 
                featureName="IA Assistente Educator" 
                description="Receba sugestões inteligentes, resumos automáticos e tire dúvidas sobre o conteúdo em tempo real com nossa IA avançada."
                className="shadow-2xl"
              />
            </div>
          </div>
        )
      )}

      <ContentModeSelector
        isOpen={isModeSelectorOpen}
        onClose={() => setIsModeSelectorOpen(false)}
        currentMode={contentModeData?.mode ?? null}
        initialInferredMode={contentModeData?.inferredMode ?? null}
        onSelect={(newMode) => {
          updateMode({ mode: newMode, source: 'USER' });
          track('CHANGE_MODE', { newMode, oldMode: contentModeData?.mode });
        }}
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

      {selectedTerm && (
        <GlossaryPopover
          term={selectedTerm}
          definition={definition || null}
          isLoading={isGlossaryLoading}
          onClose={closePopover}
          position={popoverPosition}
        />
      )}
    </div>
  );
}
