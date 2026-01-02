/**
 * Cornell Layout Domain Hook
 * 
 * Manages UI state for the Cornell layout including sidebar, tabs, actions,
 * color selection, modals, search/filter, and selection actions.
 * 
 * This hook extracts UI state management from ModernCornellLayout to make
 * the component a pure orchestrator.
 */

import { useState, useCallback } from 'react';
import type { CornellType } from '@/lib/types/cornell';
import type { SidebarTab, UnifiedStreamItemType as SelectionAction } from '@/lib/types/unified-stream';
import type { FilterType } from '@/components/cornell/SearchBar';
import { DEFAULT_COLOR } from '@/lib/constants/colors';

export interface UseCornellLayoutReturn {
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
  
  // Stream Filtering
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: FilterType;
  setFilterType: (type: FilterType) => void;
  
  // Selection Actions
  handleSelectionAction: (action: SelectionAction, text: string) => void;
  
  // Chat Input (for AI assistant)
  chatInitialInput: string;
  setChatInitialInput: (input: string) => void;
}

/**
 * Hook for managing Cornell layout UI state
 */
export function useCornellLayout(): UseCornellLayoutReturn {
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<SidebarTab>('toc');
  
  // Action state
  const [activeAction, setActiveAction] = useState<SelectionAction | null>(null);
  const toggleAction = useCallback((action: SelectionAction) => {
    setActiveAction(prev => prev === action ? null : action);
  }, []);
  
  // Color state
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_COLOR);
  
  // UI visibility state
  const [isUiVisible, setIsUiVisible] = useState(true);
  const toggleUi = useCallback(() => {
    setIsUiVisible(prev => !prev);
  }, []);
  
  // Modal states
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<CornellType>('NOTE');
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  
  // Chat input state
  const [chatInitialInput, setChatInitialInput] = useState('');
  
  // Selection action handler
  const handleSelectionAction = useCallback((action: SelectionAction, text: string) => {
    switch (action) {
      case 'annotation':
        setCreateModalType('HIGHLIGHT');
        setIsCreateModalOpen(true);
        break;
      case 'note':
        setCreateModalType('NOTE');
        setIsCreateModalOpen(true);
        break;
      case 'question':
        setCreateModalType('QUESTION');
        setIsCreateModalOpen(true);
        break;
      case 'ai':
        setChatInitialInput(text);
        setActiveAction('ai');
        break;
      default:
        break;
    }
  }, []);
  
  return {
    // Sidebar
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    
    // Tabs
    activeTab,
    setActiveTab,
    
    // Actions
    activeAction,
    setActiveAction,
    toggleAction,
    
    // Color
    selectedColor,
    setSelectedColor,
    
    // UI Visibility
    isUiVisible,
    toggleUi,
    
    // Modals
    isModeSelectorOpen,
    setIsModeSelectorOpen,
    isShareModalOpen,
    setIsShareModalOpen,
    isCreateModalOpen,
    setIsCreateModalOpen,
    createModalType,
    setCreateModalType,
    
    // Stream Filtering
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    
    // Selection Actions
    handleSelectionAction,
    
    // Chat Input
    chatInitialInput,
    setChatInitialInput,
  };
}
