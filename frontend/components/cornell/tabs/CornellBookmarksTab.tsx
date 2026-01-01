/**
 * Cornell Bookmarks Tab Component
 * 
 * Displays and manages reading bookmarks.
 */

import React from 'react';
import { Plus, X } from 'lucide-react';
import { Bookmark as BookmarkIcon } from 'lucide-react';

export interface CornellBookmarksTabProps {
  bookmarks: any[];
  currentPage?: number;
  scrollPercentage: number;
  onCreateBookmark: (data: { page_number: number; scroll_pct: number }) => void;
  onDeleteBookmark: (id: string) => void;
  onNavigate?: (page: number, scrollPct?: number) => void;
}

export function CornellBookmarksTab({
  bookmarks,
  currentPage,
  scrollPercentage,
  onCreateBookmark,
  onDeleteBookmark,
  onNavigate,
}: CornellBookmarksTabProps) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
          Marcadores
        </h3>
        <button 
          onClick={() => onCreateBookmark({ 
            page_number: currentPage || 1, 
            scroll_pct: scrollPercentage 
          })}
          data-testid="add-bookmark-button"
          className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Novo
        </button>
      </div>
      
      {bookmarks?.length === 0 ? (
        <p className="text-sm text-gray-500 italic">
          Nenhum marcador salvo ainda.
        </p>
      ) : (
        <div className="space-y-2">
          {bookmarks?.map((b: any) => (
            <div 
              key={b.id} 
              className="group flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-purple-300 transition-all shadow-sm"
            >
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => onNavigate?.(b.page_number, b.scroll_pct)}
              >
                <div className="flex items-center gap-2">
                  <BookmarkIcon className="w-4 h-4 text-purple-500" />
                  <span className="font-medium text-sm">Página {b.page_number}</span>
                </div>
                {b.label && <p className="text-xs text-gray-500 mt-1">{b.label}</p>}
                <p className="text-[10px] text-gray-400 mt-1 italic">
                  Salvo em {new Date(b.created_at).toLocaleDateString()}
                </p>
              </div>
              <button 
                onClick={() => onDeleteBookmark(b.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
