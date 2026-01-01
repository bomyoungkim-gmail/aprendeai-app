/**
 * Tests for use-cornell-session domain hook
 * 
 * Tests session management including:
 * - Bookmarks CRUD
 * - Session lifecycle
 * - Synthesis items
 * - Annotation counts
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCornellSession } from '@/hooks/domain/use-cornell-session';
import type { UnifiedStreamItem } from '@/lib/types/unified-stream';

// Mock dependencies
jest.mock('@/hooks/cornell/use-bookmarks');
jest.mock('@/hooks/cornell/use-create-bookmark');
jest.mock('@/hooks/cornell/use-delete-bookmark');
jest.mock('@/hooks/sessions/reading/use-reading-session');
jest.mock('@/stores/auth-store');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useCornellSession', () => {
  const mockContentId = 'content-123';
  const mockSessionId = 'session-456';
  const mockStreamItems: UnifiedStreamItem[] = [
    {
      id: '1',
      type: 'note',
      content: 'Test note',
      created_at: new Date().toISOString(),
      page_number: 1,
    },
    {
      id: '2',
      type: 'question',
      content: 'Test question',
      created_at: new Date().toISOString(),
      page_number: 2,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with empty bookmarks', () => {
      const { result } = renderHook(
        () => useCornellSession(mockContentId, mockSessionId, [], undefined, undefined),
        { wrapper: createWrapper() }
      );
      
      expect(result.current.bookmarks).toEqual([]);
    });

    it('should have session ID', () => {
      const { result } = renderHook(
        () => useCornellSession(mockContentId, mockSessionId, [], undefined, undefined),
        { wrapper: createWrapper() }
      );
      
      expect(result.current.sessionId).toBe(mockSessionId);
    });
  });

  describe('Synthesis Items', () => {
    it('should compute synthesis items from stream', () => {
      const { result } = renderHook(
        () => useCornellSession(mockContentId, mockSessionId, mockStreamItems, undefined, undefined),
        { wrapper: createWrapper() }
      );
      
      expect(result.current.synthesisItems).toBeDefined();
      expect(Array.isArray(result.current.synthesisItems)).toBe(true);
    });

    it('should filter synthesis items correctly', () => {
      const itemsWithSummary: UnifiedStreamItem[] = [
        ...mockStreamItems,
        {
          id: '3',
          type: 'summary',
          content: 'Test summary',
          created_at: new Date().toISOString(),
          page_number: 3,
        },
      ];
      
      const { result } = renderHook(
        () => useCornellSession(mockContentId, mockSessionId, itemsWithSummary, undefined, undefined),
        { wrapper: createWrapper() }
      );
      
      const summaryItems = result.current.synthesisItems.filter(item => item.type === 'summary');
      expect(summaryItems.length).toBeGreaterThan(0);
    });
  });

  describe('Annotation Counts', () => {
    it('should compute annotation counts by section', () => {
      const { result } = renderHook(
        () => useCornellSession(mockContentId, mockSessionId, mockStreamItems, undefined, undefined),
        { wrapper: createWrapper() }
      );
      
      expect(result.current.annotationCounts).toBeDefined();
      expect(typeof result.current.annotationCounts).toBe('object');
    });

    it('should count annotations correctly', () => {
      const itemsWithSections: UnifiedStreamItem[] = [
        {
          id: '1',
          type: 'note',
          content: 'Note 1',
          created_at: new Date().toISOString(),
          page_number: 1,
          section: 'intro',
        },
        {
          id: '2',
          type: 'note',
          content: 'Note 2',
          created_at: new Date().toISOString(),
          page_number: 1,
          section: 'intro',
        },
        {
          id: '3',
          type: 'note',
          content: 'Note 3',
          created_at: new Date().toISOString(),
          page_number: 2,
          section: 'body',
        },
      ];
      
      const { result } = renderHook(
        () => useCornellSession(mockContentId, mockSessionId, itemsWithSections, undefined, undefined),
        { wrapper: createWrapper() }
      );
      
      const counts = result.current.annotationCounts;
      expect(counts['intro']).toBe(2);
      expect(counts['body']).toBe(1);
    });
  });

  describe('Thread Context', () => {
    it('should determine thread context based on auth', () => {
      const { result } = renderHook(
        () => useCornellSession(mockContentId, mockSessionId, [], undefined, undefined),
        { wrapper: createWrapper() }
      );
      
      expect(result.current.threadContext).toBeDefined();
      expect(result.current.threadContext.type).toBeDefined();
      expect(result.current.threadContext.id).toBeDefined();
    });
  });

  describe('Navigation', () => {
    it('should pass through navigation callback', () => {
      const mockOnNavigate = jest.fn();
      
      const { result } = renderHook(
        () => useCornellSession(mockContentId, mockSessionId, [], mockOnNavigate, undefined),
        { wrapper: createWrapper() }
      );
      
      expect(result.current.onNavigate).toBe(mockOnNavigate);
    });
  });

  describe('Session Finish', () => {
    it('should have finish session function', () => {
      const { result } = renderHook(
        () => useCornellSession(mockContentId, mockSessionId, [], undefined, undefined),
        { wrapper: createWrapper() }
      );
      
      expect(typeof result.current.finishSession).toBe('function');
    });

    it('should have isFinishing state', () => {
      const { result } = renderHook(
        () => useCornellSession(mockContentId, mockSessionId, [], undefined, undefined),
        { wrapper: createWrapper() }
      );
      
      expect(typeof result.current.isFinishing).toBe('boolean');
    });
  });
});
