'use client';

import { useState } from 'react';
import { Search, Filter, Star, Download, X } from 'lucide-react';
import { useSearchAnnotations, useToggleFavorite } from '@/hooks/content/use-annotations';
export type AnnotationType = 'HIGHLIGHT' | 'NOTE' | 'COMMENT';

interface Filters {
  type?: AnnotationType;
  color?: string;
  isFavorite?: boolean;
  startDate?: string;
  endDate?: string;
}

export function AnnotationSearch() {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({});

  const { data: results, isLoading } = useSearchAnnotations({
    query,
    ...filters,
  });

  const clearFilters = () => {
    setFilters({});
    setQuery('');
  };

  const activeFilterCount = Object.keys(filters).length + (query ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search annotations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            data-testid="search-input"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
            showFilters ? 'bg-blue-50 border-blue-500' : 'border-gray-300'
          }`}
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={filters.type || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  type: e.target.value as AnnotationType | undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Types</option>
              <option value="HIGHLIGHT">Highlight</option>
              <option value="NOTE">Note</option>
              <option value="COMMENT">Comment</option>
            </select>
          </div>

          {/* Color Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <select
              value={filters.color || ''}
              onChange={(e) =>
                setFilters({ ...filters, color: e.target.value || undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Colors</option>
              <option value="yellow">Yellow</option>
              <option value="green">Green</option>
              <option value="blue">Blue</option>
              <option value="pink">Pink</option>
            </select>
          </div>

          {/* Favorites Only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Show
            </label>
            <select
              value={filters.isFavorite === true ? 'favorites' : 'all'}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  isFavorite: e.target.value === 'favorites' ? true : undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Annotations</option>
              <option value="favorites">Favorites Only</option>
            </select>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="space-y-2">
        {isLoading && (
          <div className="text-center py-8 text-gray-500">
            Searching...
          </div>
        )}

        {!isLoading && results && results.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No annotations found
          </div>
        )}

        {results?.map((annotation) => (
          <AnnotationCard key={annotation.id} annotation={annotation} />
        ))}
      </div>
    </div>
  );
}

// Annotation Card Component
function AnnotationCard({ annotation }: { annotation: any }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow" data-testid="annotation-item">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-1 bg-gray-100 rounded">
              {annotation.type}
            </span>
            {annotation.color && (
              <div
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: annotation.color }}
              />
            )}
            <span className="text-xs text-gray-500">
              {annotation.content.title}
            </span>
          </div>
          
          {annotation.selectedText && (
            <p className="text-sm text-gray-700 mb-2">
              "{annotation.selectedText}"
            </p>
          )}
          
          {annotation.text && (
            <p className="text-sm text-gray-900">{annotation.text}</p>
          )}
          
          <div className="mt-2 text-xs text-gray-500">
            Created {new Date(annotation.createdAt).toLocaleDateString()}
          </div>
        </div>
        
        <FavoriteButton
          annotationId={annotation.id}
          isFavorite={annotation.isFavorite}
        />
      </div>
    </div>
  );
}

// Favorite Button Component
function FavoriteButton({
  annotationId,
  isFavorite,
}: {
  annotationId: string;
  isFavorite: boolean;
}) {
  const { mutate: toggleFavorite } = useToggleFavorite();

  return (
    <button
      onClick={() => toggleFavorite(annotationId)}
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      data-testid="favorite-button"
    >
      <Star
        className={`h-5 w-5 ${
          isFavorite
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-400'
        }`}
      />
    </button>
  );
}
