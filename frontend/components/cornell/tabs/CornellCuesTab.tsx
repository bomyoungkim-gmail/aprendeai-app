/**
 * Cornell Cues Tab Component
 * 
 * Displays and manages study cues/questions.
 */

import React from 'react';
import { SearchBar, type FilterType } from '../SearchBar';
import type { CueItem } from '@/lib/types/cornell';

export interface CornellCuesTabProps {
  cues: CueItem[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCueClick?: (cue: CueItem) => void;
}

export function CornellCuesTab({
  cues,
  searchQuery,
  onSearchChange,
  onCueClick,
}: CornellCuesTabProps) {
  const filteredCues = cues.filter(c => 
    c.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 space-y-3">
      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        onClear={() => onSearchChange('')}
        activeFilter={'all' as FilterType}
        onFilterChange={() => {}}
        resultCount={filteredCues.length}
      />
      
      {filteredCues.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          {searchQuery 
            ? 'Nenhuma dúvida encontrada' 
            : 'Nenhum tópico ainda. Adicione perguntas para estudar.'}
        </p>
      ) : (
        filteredCues.map(cue => (
          <div 
            key={cue.id} 
            onClick={() => onCueClick?.(cue)}
            className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
          >
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {cue.prompt}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
