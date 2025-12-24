'use client';

import { useState } from 'react';
import { useSessionsHistory } from '@/hooks/use-sessions-history';
import { SessionCard } from '@/components/sessions/SessionCard';
import { SessionAnalytics } from '@/components/sessions/SessionAnalytics';
import { Loader2, Calendar, Filter, BarChart3 } from 'lucide-react';

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<'sessions' | 'analytics'>('sessions');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    phase: '',
    query: '',
    since: '',
    until: '',
  });

  const { data, isLoading, error } = useSessionsHistory({
    page,
    limit: 20,
    ...filters,
    phase: filters.phase as any,
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Session History</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 font-medium flex items-center gap-2 ${
            activeTab === 'sessions'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Sessions
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 font-medium flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Analytics
        </button>
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && <SessionAnalytics />}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="font-medium">Filters</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search in content..."
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            className="px-3 py-2 border rounded-md"
          />

          {/* Phase filter */}
          <select
            value={filters.phase}
            onChange={(e) => setFilters({ ...filters, phase: e.target.value })}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Phases</option>
            <option value="PRE">Pre-Reading</option>
            <option value="DURING">Active</option>
            <option value="POST">Completed</option>
          </select>

          {/* Date range */}
          <input
            type="date"
            placeholder="Since"
            value={filters.since}
            onChange={(e) => setFilters({ ...filters, since: e.target.value })}
            className="px-3 py-2 border rounded-md"
          />
          
          <input
            type="date"
            placeholder="Until"
            value={filters.until}
            onChange={(e) => setFilters({ ...filters, until: e.target.value })}
            className="px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 text-red-600 bg-red-50 rounded-lg">
          Error loading sessions. Please try again.
        </div>
      )}

      {/* Sessions List */}
      {data && (
        <>
          <div className="space-y-4 mb-6">
            {data.sessions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No sessions found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              data.sessions.map((session: any) => (
                <SessionCard key={session.id} session={session} />
              ))
            )}
          </div>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-600">
                Page {page} of {data.pagination.totalPages}
              </span>
              
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
      </>
      )}
    </div>
  );
}
