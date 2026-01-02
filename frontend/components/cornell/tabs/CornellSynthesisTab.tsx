/**
 * Cornell Synthesis Tab Component
 * 
 * Displays synthesis items with ability to create new ones.
 */

import React from 'react';
import { Plus } from 'lucide-react';
import { SearchBar, type FilterType } from '../SearchBar';
import { StreamCard } from '../StreamCard';
import { inferCornellType } from '@/lib/cornell/type-color-map';
import type { UnifiedStreamItem } from '@/lib/types/unified-stream';

export interface CornellSynthesisTabProps {
  filteredItems: UnifiedStreamItem[];
  searchQuery: string;
  filterType: FilterType;
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: FilterType) => void;
  onCreateSynthesis: () => void;
  onItemClick?: (item: UnifiedStreamItem) => void;
  onItemEdit?: (item: UnifiedStreamItem) => void;
  onItemDelete?: (item: UnifiedStreamItem) => void;
  onItemSaveEdit?: (item: UnifiedStreamItem, updates: any) => void;
}

export function CornellSynthesisTab({
  filteredItems,
  searchQuery,
  filterType,
  onSearchChange,
  onFilterChange,
  onCreateSynthesis,
  onItemClick,
  onItemEdit,
  onItemDelete,
  onItemSaveEdit,
}: CornellSynthesisTabProps) {
  const synthesisItems = filteredItems.filter(i => {
    if (i.type === 'annotation') {
      return inferCornellType(i.highlight.colorKey, i.highlight.tagsJson) === 'SUMMARY';
    }
    return false;
  });

  return (
    <div className="p-4 space-y-4">
      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        onClear={() => onSearchChange('')}
        activeFilter={filterType}
        onFilterChange={onFilterChange}
        resultCount={synthesisItems.length}
      />

      <div className="flex items-center justify-end">
        <button
          onClick={onCreateSynthesis}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900"
          title="Adicionar Síntese"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      
      <div className="space-y-3">
        {synthesisItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Nenhuma síntese encontrada.
            </p>
            <button
              onClick={onCreateSynthesis}
              className="text-sm text-blue-600 hover:underline"
            >
              Criar primeira síntese
            </button>
          </div>
        ) : (
          synthesisItems.map(item => (
            <StreamCard
              key={item.id}
              item={item}
              onClick={() => onItemClick?.(item)}
              onEdit={() => onItemEdit?.(item)}
              onDelete={() => onItemDelete?.(item)}
              onSaveEdit={onItemSaveEdit}
            />
          ))
        )}
      </div>
    </div>
  );
}
