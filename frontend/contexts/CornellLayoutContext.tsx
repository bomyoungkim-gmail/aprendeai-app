/**
 * Cornell Layout Context Provider
 * 
 * Provides centralized UI state for the Cornell layout.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { CornellType } from '@/lib/types/cornell';
import type { SidebarTab, UnifiedStreamItemType as SelectionAction } from '@/lib/types/unified-stream';
import type { FilterType } from '@/components/cornell/SearchBar';
import { DEFAULT_COLOR } from '@/lib/constants/colors';

export interface CornellLayoutContextType {
  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  
  // Tabs
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  
  // Actions
  activeAction: SelectionAction | null;
  setActiveAction: (action: SelectionAction | null) => void;
  toggleAction: (action: SelectionAction) => void;
  
  // Color
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  
  // UI Visibility
  isUiVisible: boolean;
  setIsUiVisible: (visible: boolean) => void;
  toggleUi: () => void;
  
  // Modals
  isModeSelectorOpen: boolean;
  setIsModeSelectorOpen: (open: boolean) => void;
  isShareModalOpen: boolean;
  setIsShareModalOpen: (open: boolean) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  createModalType: CornellType;
  setCreateModalType: (type: CornellType) => void;
  createModalQuote: string; // Added
  setCreateModalQuote: (quote: string) => void; // Added
  
  // Stream Filtering
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: FilterType;
  setFilterType: (type: FilterType) => void;
  
  // Chat context (for AI assistant)
  aiContext: string;
  setAiContext: (text: string) => void;
  
  // Composite Actions
  handleAISelection: (text: string) => void;
}

const CornellLayoutContext = createContext<CornellLayoutContextType | undefined>(undefined);

export function CornellLayoutProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<SidebarTab>('toc');
  const [activeAction, setActiveAction] = useState<SelectionAction | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_COLOR);
  const [isUiVisible, setIsUiVisible] = useState(true);
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<CornellType>('NOTE');
  const [createModalQuote, setCreateModalQuote] = useState(''); // Added state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [aiContext, setAiContext] = useState('');

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  const toggleAction = useCallback((action: SelectionAction) => {
    setActiveAction(prev => prev === action ? null : action);
  }, []);
  const toggleUi = useCallback(() => setIsUiVisible(prev => !prev), []);

  const handleAISelection = useCallback((text: string) => {
    setAiContext(text);
    setSidebarOpen(true);
    setActiveTab('chat');
  }, []);

  const value = useMemo(() => ({
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    activeTab,
    setActiveTab,
    activeAction,
    setActiveAction,
    toggleAction,
    selectedColor,
    setSelectedColor,
    isUiVisible,
    setIsUiVisible,
    toggleUi,
    isModeSelectorOpen,
    setIsModeSelectorOpen,
    isShareModalOpen,
    setIsShareModalOpen,
    isCreateModalOpen,
    setIsCreateModalOpen,
    createModalType,
    setCreateModalType,
    createModalQuote, // Added
    setCreateModalQuote, // Added
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    aiContext,
    setAiContext,
    handleAISelection,
  }), [
    sidebarOpen, activeTab, activeAction, selectedColor, isUiVisible, 
    isModeSelectorOpen, isShareModalOpen, isCreateModalOpen, 
    createModalType, createModalQuote, searchQuery, filterType, aiContext, 
    toggleSidebar, toggleAction, toggleUi, handleAISelection
  ]);

  return (
    <CornellLayoutContext.Provider value={value}>
      {children}
    </CornellLayoutContext.Provider>
  );
}

export function useCornellLayout() {
  const context = useContext(CornellLayoutContext);
  if (context === undefined) {
    throw new Error('useCornellLayout must be used within a CornellLayoutProvider');
  }
  return context;
}
