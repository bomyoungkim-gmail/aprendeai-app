import { renderHook } from '@testing-library/react';
import { useStreamFilter } from '@/hooks/cornell/use-stream-filter';
import type { UnifiedStreamItem } from '@/lib/types/unified-stream';

describe('useStreamFilter', () => {
  const mockItems: UnifiedStreamItem[] = [
    {
      id: '1',
      type: 'annotation',
      quote: 'Important Quote',
      commentText: 'My comment',
      pageNumber: 1,
      createdAt: '2023-01-01',
      highlight: { id: 'h1', contentId: 'c1' } as any
    },
    {
      id: '2',
      type: 'note',
      body: 'Personal note content',
      createdAt: '2023-01-02',
    },
    {
      id: '3',
      type: 'ai-suggestion',
      content: 'AI generated hint',
      createdAt: '2023-01-03',
    },
  ] as UnifiedStreamItem[];

  it('should return all items when no filter or search', () => {
    const { result } = renderHook(() => 
      useStreamFilter(mockItems, '', 'all')
    );

    expect(result.current.filteredItems).toHaveLength(3);
    expect(result.current.hasActiveFilter).toBe(false);
  });

  it('should filter by type', () => {
    const { result } = renderHook(() => 
      useStreamFilter(mockItems, '', 'annotation')
    );

    expect(result.current.filteredItems).toHaveLength(1);
    expect(result.current.filteredItems[0].type).toBe('annotation');
    expect(result.current.hasActiveFilter).toBe(true);
  });

  it('should filter by search query (quote)', () => {
    const { result } = renderHook(() => 
      useStreamFilter(mockItems, 'Quote', 'all')
    );

    expect(result.current.filteredItems).toHaveLength(1);
    expect(result.current.filteredItems[0].quote).toContain('Quote');
    expect(result.current.hasActiveFilter).toBe(true);
  });

  it('should filter by search query (note body)', () => {
    const { result } = renderHook(() => 
      useStreamFilter(mockItems, 'Personal', 'all')
    );

    expect(result.current.filteredItems).toHaveLength(1);
    expect(result.current.filteredItems[0].id).toBe('2');
  });

  it('should filter by search query (ai content)', () => {
    const { result } = renderHook(() => 
      useStreamFilter(mockItems, 'AI generated', 'all')
    );

    expect(result.current.filteredItems).toHaveLength(1);
    expect(result.current.filteredItems[0].id).toBe('3');
  });

  it('should combine type filter and search', () => {
    const { result } = renderHook(() => 
      useStreamFilter(mockItems, 'Personal', 'annotation')
    );

    // Matches search but not type
    expect(result.current.filteredItems).toHaveLength(0);
  });

  it('should handle case insensitivity', () => {
    const { result } = renderHook(() => 
      useStreamFilter(mockItems, 'important', 'all') // lowercase search
    );

    expect(result.current.filteredItems).toHaveLength(1);
    expect(result.current.filteredItems[0].id).toBe('1');
  });
});
