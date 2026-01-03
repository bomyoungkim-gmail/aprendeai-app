import { useMemo } from 'react';
import type { UnifiedStreamItem } from '@/lib/types/unified-stream';
import type { FilterType } from '@/lib/types/ui';

/**
 * Hook to filter and search unified stream items
 */
export function useStreamFilter(
  items: UnifiedStreamItem[],
  searchQuery: string,
  filterType: FilterType
) {
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((item) => item.type === filterType);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        // Search in different fields based on item type
        if (item.type === 'annotation') {
          return (
            item.quote?.toLowerCase().includes(query) ||
            item.commentText?.toLowerCase().includes(query) ||
            `page ${item.pageNumber}`.includes(query)
          );
        } else if (item.type === 'note') {
          return item.body.toLowerCase().includes(query);
        } else if (item.type === 'synthesis') {
          const contentMatch = item.body.toLowerCase().includes(query);
          const anchor = item.anchor;
          const categoryMatch = anchor?.transversal?.category?.toLowerCase().includes(query);
          const themeMatch = anchor?.transversal?.theme?.toLowerCase().includes(query);
          const locationMatch = anchor?.location?.label?.toLowerCase().includes(query);
          const temporalMatch = anchor?.temporal?.label?.toLowerCase().includes(query);
          return !!(contentMatch || categoryMatch || themeMatch || locationMatch || temporalMatch);
        } else if (item.type === 'ai-suggestion') {
          return item.content.toLowerCase().includes(query);
        }
        return false;
      });
    }

    return filtered;
  }, [items, searchQuery, filterType]);

  const allFilteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((item) => {
      if (item.type === 'annotation') {
        return (
          item.quote?.toLowerCase().includes(query) ||
          item.commentText?.toLowerCase().includes(query) ||
          `page ${item.pageNumber}`.includes(query)
        );
      } else if (item.type === 'note') {
        return item.body.toLowerCase().includes(query);
      } else if (item.type === 'synthesis') {
        const contentMatch = item.body.toLowerCase().includes(query);
        const anchor = item.anchor;
        const categoryMatch = anchor?.transversal?.category?.toLowerCase().includes(query);
        const themeMatch = anchor?.transversal?.theme?.toLowerCase().includes(query);
        const locationMatch = anchor?.location?.label?.toLowerCase().includes(query);
        const temporalMatch = anchor?.temporal?.label?.toLowerCase().includes(query);
        return !!(contentMatch || categoryMatch || themeMatch || locationMatch || temporalMatch);
      } else if (item.type === 'ai-suggestion') {
        return item.content.toLowerCase().includes(query);
      }
      return false;
    });
  }, [items, searchQuery]);

  return {
    filteredItems,
    allFilteredItems,
    totalCount: items.length,
    filteredCount: filteredItems.length,
    hasActiveFilter: filterType !== 'all' || searchQuery.trim() !== '',
  };
}
