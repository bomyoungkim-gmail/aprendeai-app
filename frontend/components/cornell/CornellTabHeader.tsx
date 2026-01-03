import React from 'react';
import { SearchBar, type FilterType } from './SearchBar';

interface CornellTabHeaderProps {
  title: string;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  resultCount: number;
  hideFilters?: boolean;
  hideTitle?: boolean;
  actionButton?: React.ReactNode;
  
  // Search props
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function CornellTabHeader({
  title,
  activeFilter,
  onFilterChange,
  resultCount,
  hideFilters = false,
  hideTitle = false,
  actionButton,
  searchQuery,
  onSearchChange,
}: CornellTabHeaderProps) {
  return (
    <div className={`flex flex-col gap-4 ${!hideTitle ? 'border-b border-gray-100 dark:border-gray-800 pb-4' : ''}`}>
      {!hideTitle && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {title} <span className="text-gray-400 font-normal text-sm ml-1">({resultCount})</span>
          </h2>
          {actionButton}
        </div>
      )}

      {onSearchChange && (
        <SearchBar
          value={searchQuery || ''}
          onChange={onSearchChange}
          onClear={() => onSearchChange('')}
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          resultCount={resultCount}
          hideFilters={hideFilters}
          actionButton={hideTitle ? actionButton : undefined}
        />
      )}
    </div>
  );
}
