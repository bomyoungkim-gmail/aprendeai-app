/**
 * Tests for use-cornell-layout domain hook
 * 
 * Tests UI state management including:
 * - Sidebar state
 * - Tab state
 * - Action state
 * - Modal states
 * - Search/filter state
 */

import { renderHook, act } from '@testing-library/react';
import { useCornellLayout } from '@/hooks/domain/use-cornell-layout';

describe('useCornellLayout', () => {
  describe('Sidebar State', () => {
    it('should initialize with sidebar closed', () => {
      const { result } = renderHook(() => useCornellLayout());
      
      expect(result.current.sidebarOpen).toBe(false);
    });

    it('should toggle sidebar state', () => {
      const { result } = renderHook(() => useCornellLayout());
      
      act(() => {
        result.current.toggleSidebar();
      });
      
      expect(result.current.sidebarOpen).toBe(true);
      
      act(() => {
        result.current.toggleSidebar();
      });
      
      expect(result.current.sidebarOpen).toBe(false);
    });

    it('should set sidebar state directly', () => {
      const { result } = renderHook(() => useCornellLayout());
      
      act(() => {
        result.current.setSidebarOpen(true);
      });
      
      expect(result.current.sidebarOpen).toBe(true);
    });
  });

  describe('Tab State', () => {
    it('should initialize with toc tab', () => {
      const { result } = renderHook(() => useCornellLayout());
      
      expect(result.current.activeTab).toBe('toc');
    });

    it('should change active tab', () => {
      const { result } = renderHook(() => useCornellLayout());
      
      act(() => {
        result.current.setActiveTab('stream');
      });
      
      expect(result.current.activeTab).toBe('stream');
    });
  });

  describe('Action State', () => {
    it('should initialize with no active action', () => {
      const { result } = renderHook(() => useCornellLayout());
      
      expect(result.current.activeAction).toBeNull();
    });

    it('should set active action', () => {
      const { result } = renderHook(() => useCornellLayout());
      
      act(() => {
        result.current.setActiveAction('ai');
      });
      
      expect(result.current.activeAction).toBe('ai');
    });

    it('should toggle action on/off', () => {
      const { result } = renderHook(() => useCornellLayout());
      
      act(() => {
        result.current.toggleAction('ai');
      });
      
      expect(result.current.activeAction).toBe('ai');
      
      act(() => {
        result.current.toggleAction('ai');
      });
      
      expect(result.current.activeAction).toBeNull();
    });

    it('should switch between actions', () => {
      const { result } = renderHook(() => useCornellLayout());
      
      act(() => {
        result.current.toggleAction('ai');
      });
      
      expect(result.current.activeAction).toBe('ai');
      
      act(() => {
        result.current.toggleAction('question');
      });
      
      expect(result.current.activeAction).toBe('question');
    });
  });

  describe('Modal States', () => {
    it('should initialize with all modals closed', () => {
      const { result } = renderHook(() => useCornellLayout());
      
      expect(result.current.isModeSelectorOpen).toBe(false);
      expect(result.current.isShareModalOpen).toBe(false);
      expect(result.current.isCreateModalOpen).toBe(false);
    });

    it('should open and close mode selector', () => {
      const { result } = renderHook(() => useCornellLayout());
      
      act(() => {
        result.current.setIsModeSelectorOpen(true);
      });
      
      expect(result.current.isModeSelectorOpen).toBe(true);
      
      act(() => {
        result.current.setIsModeSelectorOpen(false);
      });
      
      expect(result.current.isModeSelectorOpen).toBe(false);
    });

    it('should open and close share modal', () => {
      const { result } = renderHook(() => useCornellLayout());
      
      act(() => {
        result.current.setIsShareModalOpen(true);
      });
      
      expect(result.current.isShareModalOpen).toBe(true);
    });

    it('should open and close create modal', () => {
      const { result } = renderHook(() => useCornellLayout());
      
      act(() => {
        result.current.setIsCreateModalOpen(true);
      });
      
      expect(result.current.isCreateModalOpen).toBe(true);
    });

    it('should set create modal type', () => {
      const { result } = renderHook(() => useCornellLayout());
      
      act(() => {
        result.current.setCreateModalType('QUESTION');
      });
      
      expect(result.current.createModalType).toBe('QUESTION');
    });
  });

  describe('Search and Filter', () => {
    it('should initialize with empty search', () => {
      const { result } = renderHook(() => useCornellLayout());
      
      expect(result.current.searchQuery).toBe('');
      expect(result.current.filterType).toBe('all');
    });

    it('should update search query', () => {
      const { result } = renderHook(() => useCornellLayout());
      
      act(() => {
        result.current.setSearchQuery('test query');
      });
      
      expect(result.current.searchQuery).toBe('test query');
    });

    it('should update filter type', () => {
      const { result } = renderHook(() => useCornellLayout());
      
      act(() => {
        result.current.setFilterType('notes');
      });
      
      expect(result.current.filterType).toBe('notes');
    });
  });

  describe('Color Selection', () => {
    it('should initialize with default color', () => {
      const { result } = renderHook(() => useCornellLayout());
      
      expect(result.current.selectedColor).toBeDefined();
    });

    it('should update selected color', () => {
      const { result } = renderHook(() => useCornellLayout());
      
      act(() => {
        result.current.setSelectedColor('#FF0000');
      });
      
      expect(result.current.selectedColor).toBe('#FF0000');
    });
  });

  describe('UI Visibility', () => {
    it('should initialize with UI visible', () => {
      const { result } = renderHook(() => useCornellLayout());
      
      expect(result.current.isUiVisible).toBe(true);
    });

    it('should toggle UI visibility', () => {
      const { result } = renderHook(() => useCornellLayout());
      
      act(() => {
        result.current.toggleUi();
      });
      
      expect(result.current.isUiVisible).toBe(false);
      
      act(() => {
        result.current.toggleUi();
      });
      
      expect(result.current.isUiVisible).toBe(true);
    });
  });

  describe('Chat Input', () => {
    it('should initialize with empty chat input', () => {
      const { result } = renderHook(() => useCornellLayout());
      
      expect(result.current.chatInitialInput).toBe('');
    });

    it('should update chat input', () => {
      const { result } = renderHook(() => useCornellLayout());
      
      act(() => {
        result.current.setChatInitialInput('Hello AI');
      });
      
      expect(result.current.chatInitialInput).toBe('Hello AI');
    });
  });
});
