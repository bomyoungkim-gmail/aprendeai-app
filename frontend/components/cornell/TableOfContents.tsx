import React, { useState } from 'react';
import { ChevronRight, ChevronDown, List } from 'lucide-react';
import { TocItem, MOCK_TOC } from '@/lib/types/toc';
import { cn } from '@/lib/utils';
import { useTelemetry } from '@/hooks/telemetry/use-telemetry';

interface TableOfContentsProps {
  contentId: string;
  items?: TocItem[];
  currentPage?: number;
  onNavigate: (page: number, id: string) => void;
}

export function TableOfContents({ 
  contentId, 
  items = MOCK_TOC, 
  currentPage,
  onNavigate 
}: TableOfContentsProps) {
  const { track } = useTelemetry(contentId);

  const handleItemClick = (item: TocItem) => {
    track('NAVIGATE_TOC', { 
        targetId: item.id, 
        page: item.pageNumber, 
        level: item.level 
    });
    if (item.pageNumber) {
        onNavigate(item.pageNumber, item.id);
    }
  };

  const renderItem = (item: TocItem) => {
    const isActive = currentPage && item.pageNumber === currentPage;
    const hasChildren = item.children && item.children.length > 0;
    // Simple expanded state for MVP (always expanded or local state)
    // Let's default to expanded
    
    return (
      <div key={item.id} className="w-full">
        <button
          onClick={() => handleItemClick(item)}
          className={cn(
            "w-full text-left flex items-center py-2 px-3 text-sm transition-colors rounded-md",
            isActive 
              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 font-medium" 
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
            item.level > 0 && "pl-6" // Indentation
          )}
        >
          {/* Icon based on level or children? */}
          <span className="truncate flex-1">{item.title}</span>
          {item.pageNumber && (
            <span className="text-xs text-gray-400 ml-2">{item.pageNumber}</span>
          )}
        </button>
        
        {hasChildren && (
            <div className="ml-2 border-l border-gray-200 dark:border-gray-700">
                {item.children!.map(child => renderItem(child))}
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="py-2">
       <div className="px-4 pb-2 border-b border-gray-100 dark:border-gray-800 mb-2 flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <List className="w-4 h-4" />
          <span>Sumário</span>
       </div>
       <div className="space-y-0.5 px-2">
          {items.map(item => renderItem(item))}
       </div>
    </div>
  );
}
