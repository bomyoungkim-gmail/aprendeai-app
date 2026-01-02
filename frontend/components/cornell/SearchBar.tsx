import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import type { FilterType } from '@/lib/types/ui';

// Re-export for backwards compatibility
export type { FilterType };

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  resultCount?: number;
}

export function SearchBar({
  value,
  onChange,
  onClear,
  activeFilter,
  onFilterChange,
  resultCount,
}: SearchBarProps) {
  const [showFilters, setShowFilters] = React.useState(false);

  const filters: { type: FilterType; label: string; icon: string }[] = [
    { type: 'all', label: 'Todos', icon: '📚' },
    { type: 'annotation', label: 'Destaques', icon: '🖍️' },
    { type: 'note', label: 'Notas', icon: '📝' },
    { type: 'important', label: 'Importantes', icon: '⭐' },
    { type: 'question', label: 'Dúvidas', icon: '❓' },
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
          placeholder="Buscar anotações..."
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

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Filter className="h-3.5 w-3.5" />
          Filtros
        </button>
        {resultCount !== undefined && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
          </span>
        )}
      </div>

      {/* Filter Pills */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.type}
              onClick={() => onFilterChange(filter.type)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all
                ${
                  activeFilter === filter.type
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
            >
              <span>{filter.icon}</span>
              <span>{filter.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
