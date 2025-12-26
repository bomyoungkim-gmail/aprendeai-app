import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronRight } from 'lucide-react';
import type { ViewMode, SaveStatus, CueItem } from '@/lib/types/cornell';
import type { UnifiedStreamItem } from '@/lib/types/unified-stream';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { StreamCard } from './StreamCard';
import { SearchBar, type FilterType } from './SearchBar';
import { useStreamFilter } from '@/hooks/cornell/use-stream-filter';
import { CORNELL_LABELS } from '@/lib/cornell/labels';
import { ActionToolbar } from './ActionToolbar';
import { SuggestionsPanel } from './SuggestionsPanel';
import { TextSelectionMenu, type SelectionAction } from './TextSelectionMenu'; 
import { EducationalPDFViewer } from './EducationalPDFViewer'; // NEW
import { useContentContext } from '@/hooks/cornell/use-content-context';
import { useSuggestions } from '@/hooks/cornell/use-suggestions';

interface ModernCornellLayoutProps {
  // Header
  title: string;
  mode: ViewMode;
  onModeToggle: () => void;
  saveStatus: SaveStatus;
  lastSaved?: Date | null;
  contentId: string; // NEW - for fetching context

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

  // Creation (NEW)
  onCreateStreamItem?: (type: 'annotation' | 'note' | 'question' | 'star', content: string, context?: any) => void;
}

type SidebarTab = 'stream' | 'cues';

export function ModernCornellLayout({
  title,
  mode,
  onModeToggle,
  saveStatus,
  lastSaved,
  contentId,
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
  onCreateStreamItem, // NEW
}: ModernCornellLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SidebarTab>('stream');
  const [activeAction, setActiveAction] = useState<'highlight' | 'note' | 'question' | 'ai' | null>(null);
  
  // Selection State
  const [selectionInfo, setSelectionInfo] = useState<{ text: string; rect: DOMRect | null } | null>(null);
  const [chatInitialInput, setChatInitialInput] = useState(''); // NEW
  
  // Fetch content context and suggestions
  const { suggestions, acceptSuggestion, dismissSuggestion, hasUnseenSuggestions } = useSuggestions(contentId);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  
  // Apply search and filter
  const { filteredItems, filteredCount, hasActiveFilter } = useStreamFilter(
    streamItems,
    searchQuery,
    filterType
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="h-14 sm:h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <Link 
            href="/dashboard" 
            className="flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors p-1 sm:p-2 -ml-1 sm:-ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Back to Dashboard"
          >
            <ChevronRight className="h-5 w-5 rotate-180" />
          </Link>
          <div className="h-5 sm:h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
          <h1 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate" title={title}>
            {title || 'Untitled Document'}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <SaveStatusIndicator status={saveStatus} lastSaved={lastSaved} />
          
          {/* Mobile: Sidebar Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden flex items-center p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Main: PDF + Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* PDF Viewer (70% desktop, 100% mobile) */}
        <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-950">
          <EducationalPDFViewer theme="sepia">
            {viewer}
          </EducationalPDFViewer>
        </div>

        {/* Sidebar (30% desktop, overlay mobile) */}
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
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'stream' && (
              <div className="p-4 space-y-4">
                {/* Search Bar */}
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onClear={() => setSearchQuery('')}
                  activeFilter={filterType}
                  onFilterChange={setFilterType}
                  resultCount={filteredCount}
                />
                
                {/* Stream Items */}
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
              <div className="space-y-3">
                {cues.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    Nenhum tópico ainda. Adicione perguntas para estudar.
                  </p>
                ) : (
                  cues.map(cue => (
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

      {/* Bottom: Summary (Collapsible on mobile) */}
      <div className="h-0 sm:h-32 lg:h-40 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0 overflow-hidden transition-all">
        <div className="h-full p-4">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            {CORNELL_LABELS.SYNTHESIS}
          </label>
          <textarea
            value={summary}
            onChange={(e) => onSummaryChange(e.target.value)}
            className="w-full h-[calc(100%-2rem)] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
            placeholder="Resuma os principais pontos aqui..."
          />
        </div>
      </div>
    </div>
  );
}
