import { renderHook, act } from '@testing-library/react';
import { useStreamFilter } from '@/hooks/cornell/use-stream-filter';
import type { UnifiedStreamItem } from '@/lib/types/unified-stream';

describe('useStreamFilter', () => {
  const mockItems: UnifiedStreamItem[] = [
    {
      id: '1',
      type: 'annotation',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
      highlight: {} as any,
      colorKey: 'yellow',
      quote: 'Important concept about React',
      pageNumber: 5,
    },
    {
      id: '2',
      type: 'note',
      createdAt: '2024-01-01T11:00:00Z',
      updatedAt: '2024-01-01T11:00:00Z',
      note: { id: '2', body: 'My understanding of hooks', linkedHighlightIds: [] },
      body: 'My understanding of hooks',
    },
    {
      id: '3',
      type: 'annotation',
      createdAt: '2024-01-01T12:00:00Z',
      updatedAt: '2024-01-01T12:00:00Z',
      highlight: {} as any,
      colorKey: 'blue',
      quote: 'Advanced patterns in TypeScript',
      pageNumber: 10,
    },
  ];

  it('should return all items when no filter is applied', () => {
    const { result } = renderHook(() => 
      useStreamFilter(mockItems, '', 'all')
    );

    expect(result.current.filteredItems).toHaveLength(3);
    expect(result.current.totalCount).toBe(3);
    expect(result.current.filteredCount).toBe(3);
    expect(result.current.hasActiveFilter).toBe(false);
  });

  it('should filter by type', () => {
    const { result } = renderHook(() =>
      useStreamFilter(mockItems, '', 'annotation')
    );

    expect(result.current.filteredItems).toHaveLength(2);
    expect(result.current.filteredItems.every(item => item.type === 'annotation')).toBe(true);
    expect(result.current.hasActiveFilter).toBe(true);
  });

  it('should filter by search query in annotation quote', () => {
    const { result } = renderHook(() =>
      useStreamFilter(mockItems, 'react', 'all')
    );

    expect(result.current.filteredItems).toHaveLength(1);
    expect(result.current.filteredItems[0].id).toBe('1');
  });

  it('should filter by search query in note body', () => {
    const { result } = renderHook(() =>
      useStreamFilter(mockItems, 'hooks', 'all')
    );

    expect(result.current.filteredItems).toHaveLength(1);
    expect(result.current.filteredItems[0].type).toBe('note');
  });

  it('should search by page number', () => {
    const { result } = renderHook(() =>
      useStreamFilter(mockItems, 'page 10', 'all')
    );

    expect(result.current.filteredItems).toHaveLength(1);
    expect(result.current.filteredItems[0].id).toBe('3');
  });

  it('should combine type filter and search query', () => {
    const { result } = renderHook(() =>
      useStreamFilter(mockItems, 'typescript', 'annotation')
    );

    expect(result.current.filteredItems).toHaveLength(1);
    expect(result.current.filteredItems[0].id).toBe('3');
  });

  it('should return empty array when no matches', () => {
    const { result } = renderHook(() =>
      useStreamFilter(mockItems, 'nonexistent', 'all')
    );

    expect(result.current.filteredItems).toHaveLength(0);
    expect(result.current.filteredCount).toBe(0);
  });

  it('should be case insensitive', () => {
    const { result } = renderHook(() =>
      useStreamFilter(mockItems, 'REACT', 'all')
    );

    expect(result.current.filteredItems).toHaveLength(1);
  });
});
