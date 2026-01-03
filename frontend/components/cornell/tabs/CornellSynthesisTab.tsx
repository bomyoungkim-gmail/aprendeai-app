/**
 * Cornell Synthesis Tab Component
 * 
 * Displays synthesis items with ability to create new ones.
 */

import React, { useMemo } from 'react';
import { Plus, FileText } from 'lucide-react';
import { CornellTabHeader } from '../CornellTabHeader';
import { NoteCard } from '../stream-cards/NoteCard';
import { filterSynthesisItems } from '@/lib/cornell/helpers';
import type { UnifiedStreamItem, SynthesisStreamItem } from '@/lib/types/unified-stream';
import type { FilterType } from '../SearchBar';
import { sortSynthesisItems } from '@/lib/cornell/synthesis-logic';
import type { Section } from '@/lib/content/section-detector';

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
  currentPage?: number;
  sections?: Section[];
}

import { SearchBar } from '../SearchBar';

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
  currentPage,
  sections,
}: CornellSynthesisTabProps) {
  const synthesisItems = filterSynthesisItems(filteredItems);

  // Business logic: Sort items by Author Structure (Linear) then Chronological
  const sortedItems = useMemo(() => sortSynthesisItems(synthesisItems), [synthesisItems]);

  return (
    <div className="p-4 space-y-4">
      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        onClear={() => onSearchChange('')}
        activeFilter={filterType}
        onFilterChange={onFilterChange}
        resultCount={sortedItems.length}
        hideFilters={true}
        placeholder="Buscar sínteses..."
        actionButton={
          <button
            onClick={onCreateSynthesis}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            title="Adicionar Síntese"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </button>
        }
      />
      
      <div className="space-y-3">
        {sortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
            <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-medium text-gray-500">Nenhuma síntese criada</p>
            <p className="text-xs text-gray-400 mt-1">Combine suas anotações em uma visão estruturada</p>
          </div>
        ) : (
          sortedItems.map((item) => (
            <NoteCard 
              key={item.id} 
              item={item as SynthesisStreamItem} 
              currentPage={currentPage}
              sections={sections}
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
