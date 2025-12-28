'use client';

import { useState } from 'react';
import { Search, X, FileText, Calendar } from 'lucide-react';
import { useContentSearch } from '@/hooks/content/use-search';
import { useDebounce } from '@/hooks/ui/use-debounce';
import Link from 'next/link';

export function ContentSearch() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<{
    type?: 'PDF' | 'DOCX';
    language?: string;
  }>({});
  const [page, setPage] = useState(1);

  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading, error } = useContentSearch({
    q: debouncedQuery,
    ...filters,
    page,
    limit: 20,
  });

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1); // Reset to page 1 on new search
          }}
          placeholder="Buscar no seu conteúdo..."
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          data-testid="content-search-input"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setPage(1);
            }}
            className="absolute right-3 top-3 p-0.5 hover:bg-gray-100 rounded"
            aria-label="Clear search"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={filters.type || ''}
          onChange={(e) => {
            setFilters({ ...filters, type: e.target.value as any || undefined });
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os tipos</option>
          <option value="PDF">PDF</option>
          <option value="DOCX">DOCX</option>
        </select>
      </div>

      {/* Loading State */}
      {isLoading && query.length >= 2 && (
        <div className="text-center py-8 text-gray-500">
          Buscando...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Erro ao buscar. Tente novamente.
        </div>
      )}
      
      {/* Results */}
      {data && debouncedQuery.length >= 2 && (
        <>
          <div className="text-sm text-gray-600">
            {data.metadata.total === 0 ? (
              'Nenhum resultado encontrado'
            ) : (
              `${data.metadata.total} resultado${data.metadata.total !== 1 ? 's' : ''} encontrado${data.metadata.total !== 1 ? 's' : ''}`
            )}
          </div>
          
          <div className="space-y-3">
            {data.results.map((result: any) => (
              <Link
                key={result.id}
                href={`/cornell/${result.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex Items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">
                      {result.title}
                    </h3>
                    <div className="flex gap-2 text-sm text-gray-600 mb-2">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
                        {result.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(result.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {highlightText(result.excerpt, debouncedQuery)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {data.metadata.totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 pt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {page} de {data.metadata.totalPages}
              </span>
              <button
                disabled={!data.metadata.hasMore}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty State - No Query */}
      {!query && (
        <div className="text-center py-12 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>Digite para buscar em todos os seus conteúdos</p>
        </div>
      )}
    </div>
  );
}
