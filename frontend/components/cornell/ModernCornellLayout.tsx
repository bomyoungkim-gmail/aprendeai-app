'use client';

import React, { useState, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronRight, Plus, Share2, Check as CheckIcon } from 'lucide-react';
import type { ViewMode, SaveStatus, CueItem } from '@/lib/types/cornell';
import type { UnifiedStreamItem } from '@/lib/types/unified-stream';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { StreamCard } from './StreamCard';
import { SearchBar, type FilterType } from './SearchBar';
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


interface ModernCornellLayoutProps {
  // Header
  title: string;
  mode: ViewMode;
  onModeToggle: () => void;
  saveStatus: SaveStatus;
  lastSaved?: Date | null;
  contentId: string;
  targetType: 'PDF' | 'IMAGE' | 'VIDEO' | 'AUDIO';
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
}

type SidebarTab = 'stream' | 'cues' | 'synthesis' | 'conversations';

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
}: ModernCornellLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SidebarTab>('stream');
  const [activeAction, setActiveAction] = useState<'highlight' | 'note' | 'question' | 'ai' | null>(null);
  
  // Content Mode
  const { mode: contentModeData, isLoading: isContentModeLoading, updateMode } = useContentMode(contentId);
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);

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
        break;
      case 'note':
        onCreateStreamItem('note', text);
        break;
      case 'question':
        onCreateStreamItem('question', text);
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
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 md:px-4 py-2 md:py-3 flex items-center justify-between gap-2 md:gap-4 flex-shrink-0">
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
              onClick={() => setIsModeSelectorOpen(true)}
              className="hidden sm:flex"
           />

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
      <div className="flex-1 flex overflow-hidden relative">
        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-950" ref={setContentElement}>
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
              onClick={() => setActiveTab('stream')}
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
              className={`
                flex-1 px-4 py-3 text-sm font-medium transition-colors
                ${activeTab === 'cues' 
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }
              `}
            >
              {CORNELL_LABELS.IMPORTANT_QUESTIONS}
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
            {activeTab === 'stream' && (
              <div className="p-4 space-y-4">
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
                    filteredItems.map(item => (
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
        onSelect={(newMode) => updateMode({ mode: newMode, source: 'USER' })}
      />
    </div>
  );
}
