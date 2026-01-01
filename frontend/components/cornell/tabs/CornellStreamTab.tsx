/**
 * Cornell Stream Tab Component
 * 
 * Displays highlights and notes with search and filtering.
 */

import React from 'react';
import { SearchBar, type FilterType } from '../SearchBar';
import { StreamCard } from '../StreamCard';
import { SectionAnnotationsFilter } from '../../annotations/SectionAnnotationsFilter';
import type { UnifiedStreamItem } from '@/lib/types/unified-stream';
import type { Section } from '@/lib/content/section-detector';
import { ContentMode } from '@/lib/types/content-mode';

export interface CornellStreamTabProps {
  streamItems: UnifiedStreamItem[];
  filteredItems: UnifiedStreamItem[];
  searchQuery: string;
  filterType: FilterType;
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: FilterType) => void;
  filteredCount: number;
  hasActiveFilter: boolean;
  
  // Scientific mode
  contentMode: ContentMode;
  sections: Section[];
  selectedSectionId: string | null;
  onSectionSelect: (id: string | null) => void;
  annotationCounts: Record<string, number>;
  
  // Actions
  onItemClick?: (item: UnifiedStreamItem) => void;
  onItemEdit?: (item: UnifiedStreamItem) => void;
  onItemDelete?: (item: UnifiedStreamItem) => void;
  onItemSaveEdit?: (item: UnifiedStreamItem, updates: any) => void;
}

export function CornellStreamTab({
  streamItems,
  filteredItems,
  searchQuery,
  filterType,
  onSearchChange,
  onFilterChange,
  filteredCount,
  hasActiveFilter,
  contentMode,
  sections,
  selectedSectionId,
  onSectionSelect,
  annotationCounts,
  onItemClick,
  onItemEdit,
  onItemDelete,
  onItemSaveEdit,
}: CornellStreamTabProps) {
  const displayItems = filteredItems.filter(item => 
    !selectedSectionId || 
    (item as any).section === selectedSectionId || 
    selectedSectionId === 'abstract' // Soft match for MVP
  );

  return (
    <div className="p-4 space-y-4">
      {contentMode === ContentMode.SCIENTIFIC && sections.length > 0 && (
        <SectionAnnotationsFilter
          sections={sections}
          selectedSection={selectedSectionId}
          annotationCounts={annotationCounts}
          onSectionSelect={onSectionSelect}
        />
      )}
      
      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        onClear={() => onSearchChange('')}
        activeFilter={filterType}
        onFilterChange={onFilterChange}
        resultCount={filteredCount}
      />
      
      <div className="space-y-3">
        {displayItems.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            {hasActiveFilter 
              ? 'Nenhum resultado encontrado' 
              : 'Nenhuma anotação ainda. Destaque texto no PDF para começar.'}
          </p>
        ) : (
          displayItems.map(item => (
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
