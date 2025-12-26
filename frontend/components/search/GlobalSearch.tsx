'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, FileText, MessageSquare, StickyNote, Video, X } from 'lucide-react';
import { useSearch } from '@/hooks/shared/use-search';

const typeIcons = {
  content: FileText,
  annotation: MessageSquare,
  note: StickyNote,
  transcript: Video,
};

const typeColors = {
  content: 'text-blue-600 bg-blue-50',
  annotation: 'text-green-600 bg-green-50',
  note: 'text-purple-600 bg-purple-50',
  transcript: 'text-orange-600 bg-orange-50',
};

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<any>({});

  const { data: results, isLoading } = useSearch({ query, ...filters });

  const handleClear = () => {
    setQuery('');
    setFilters({});
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search across all content, annotations, notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-24 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute right-2 top-2 flex gap-2">
            {query && (
              <button
                onClick={handleClear}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Keyboard Shortcut Hint */}
        <div className="absolute right-4 -bottom-6 text-xs text-gray-400">
          Press <kbd className="px-2 py-0.5 bg-gray-100 rounded border">⌘K</kbd> to search
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search In
            </label>
            <select
              value={filters.searchIn || ''}
              onChange={(e) =>
                setFilters({ ...filters, searchIn: e.target.value || undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All</option>
              <option value="content">Content Only</option>
              <option value="transcript">Transcripts Only</option>
              <option value="annotation">Annotations Only</option>
              <option value="note">Notes Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content Type
            </label>
            <select
              value={filters.contentType || ''}
              onChange={(e) =>
                setFilters({ ...filters, contentType: e.target.value || undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Types</option>
              <option value="PDF">PDF</option>
              <option value="DOCX">DOCX</option>
              <option value="VIDEO">Video</option>
              <option value="AUDIO">Audio</option>
              <option value="IMAGE">Image</option>
            </select>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="mt-6 space-y-3">
        {isLoading && query && (
          <div className="text-center py-8 text-gray-500">
            Searching...
          </div>
        )}

        {!isLoading && results && results.length === 0 && query && (
          <div className="text-center py-8 text-gray-500">
            No results found for "{query}"
          </div>
        )}

        {results?.map((result) => (
          <SearchResultCard key={`${result.type}-${result.id}`} result={result} query={query} />
        ))}
      </div>
    </div>
  );
}

function SearchResultCard({ result, query }: { result: any; query: string }) {
  const Icon = typeIcons[result.type as keyof typeof typeIcons];
  const colorClass = typeColors[result.type as keyof typeof typeColors];

  const getLink = () => {
    switch (result.type) {
      case 'content':
      case 'transcript':
        return `/reader/${result.id}`;
      case 'annotation':
        return `/reader/${result.metadata.contentId}`;
      case 'note':
        return `/reader/${result.metadata.contentId}`;
      default:
        return '#';
    }
  };

  const highlightText = (text: string) => {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.split(regex).map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <Link
      href={getLink()}
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-500 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-gray-900">
              {highlightText(result.title)}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded ${colorClass}`}>
              {result.type}
            </span>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2">
            {highlightText(result.snippet)}
          </p>

          <div className="mt-2 text-xs text-gray-400">
            {new Date(result.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </Link>
  );
}
