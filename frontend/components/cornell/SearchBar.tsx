import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import type { FilterType } from '@/lib/types/ui';
import { CORNELL_CONFIG } from '@/lib/cornell/unified-config';

// Re-export for backwards compatibility
export type { FilterType };

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  resultCount?: number;
  hideFilters?: boolean;
  actionButton?: React.ReactNode;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  onClear,
  activeFilter,
  onFilterChange,
  resultCount,
  hideFilters = false,
  actionButton,
  placeholder,
}: SearchBarProps) {
  const [showFilters, setShowFilters] = React.useState(false);

  // Derive filters from CORNELL_CONFIG to ensure consistency
  const filters: { type: FilterType; label: string; icon: React.ReactNode; colorClass: string; activeClass: string }[] = [
    { 
      type: 'all', 
      label: 'Todos', 
      icon: '📚', 
      colorClass: 'text-gray-700 dark:text-gray-300',
      activeClass: 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900',
    },
    { 
      type: 'evidence', 
      label: CORNELL_CONFIG.EVIDENCE.label, 
      icon: CORNELL_CONFIG.EVIDENCE.emoji,
      colorClass: 'text-yellow-600 dark:text-yellow-400',
      activeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
    },
    { 
      type: 'vocabulary', 
      label: CORNELL_CONFIG.VOCABULARY.label, 
      icon: CORNELL_CONFIG.VOCABULARY.emoji,
      colorClass: 'text-blue-600 dark:text-blue-400',
      activeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-200 dark:border-blue-800',
    },
    { 
      type: 'main-idea', 
      label: CORNELL_CONFIG.MAIN_IDEA.label, 
      icon: CORNELL_CONFIG.MAIN_IDEA.emoji,
      colorClass: 'text-green-600 dark:text-green-400',
      activeClass: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-200 dark:border-green-800',
    },
    { 
      type: 'doubt', 
      label: CORNELL_CONFIG.DOUBT.label, 
      icon: CORNELL_CONFIG.DOUBT.emoji,
      colorClass: 'text-red-600 dark:text-red-400',
      activeClass: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-200 dark:border-red-800',
    },
    { 
      type: 'synthesis', 
      label: CORNELL_CONFIG.SYNTHESIS.label, 
      icon: CORNELL_CONFIG.SYNTHESIS.emoji,
      colorClass: 'text-purple-600 dark:text-purple-400',
      activeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 border-purple-200 dark:border-purple-800',
    },
  ];

  return (
    <div className="space-y-2">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Buscar..."}
          className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
        {value && (
          <button
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </button>
        )}
      </div>

      {/* Filter Toggle & Results */}
      <div className="flex items-center justify-between">
        {resultCount !== undefined && (
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
          </span>
        )}
        
        <div className="flex items-center gap-2">
          {actionButton}
          {!hideFilters && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Filter className="h-3.5 w-3.5" />
              Filtros
            </button>
          )}
        </div>
      </div>

      {/* Filter Pills */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const isActive = activeFilter === filter.type;
            return (
              <button
                key={filter.type}
                onClick={() => onFilterChange(filter.type)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all border
                  ${isActive 
                    ? `${filter.activeClass} shadow-sm border-transparent`
                    : `bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${filter.colorClass} hover:bg-gray-100 dark:hover:bg-gray-700`
                  }
                `}
              >
                <span>{filter.icon}</span>
                <span>{filter.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  );
}
