import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, BookmarkIcon, ImageIcon } from 'lucide-react';

interface PDFToolbarProps {
  activeSidebar: 'thumbnails' | 'bookmarks' | null;
  onToggleSidebar: (tab: 'thumbnails' | 'bookmarks') => void;
  currentPage: number;
  totalPages: number;
  // React-pdf-viewer zoom components
  ZoomOutComponent: React.ComponentType<any>;
  ZoomComponent: React.ComponentType<any>;
  ZoomInComponent: React.ComponentType<any>;
}

export function PDFToolbar({
  activeSidebar,
  onToggleSidebar,
  currentPage,
  totalPages,
  ZoomOutComponent,
  ZoomComponent,
  ZoomInComponent,
}: PDFToolbarProps) {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-2 sm:gap-3
        bg-white dark:bg-gray-800 
        border border-gray-200 dark:border-gray-700
        rounded-full shadow-lg
        px-3 sm:px-4 py-2 sm:py-2.5
        transition-all duration-300
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      onMouseEnter={() => setIsVisible(true)}
    >
      {/* Sidebar Toggles */}
      <button
        onClick={() => onToggleSidebar('thumbnails')}
        className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
          activeSidebar === 'thumbnails'
            ? 'bg-blue-100 dark:bg-blue-900'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        title="Miniaturas"
      >
        <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 dark:text-gray-300" />
      </button>

      <button
        onClick={() => onToggleSidebar('bookmarks')}
        className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
          activeSidebar === 'bookmarks'
            ? 'bg-blue-100 dark:bg-blue-900'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        title="Marcadores"
      >
        <BookmarkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Divider */}
      <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

      {/* Page Navigation */}
      <div className="flex items-center gap-1 sm:gap-2">
        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Página {currentPage} / {totalPages}
        </span>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>

      {/* Zoom Controls - Using react-pdf-viewer components */}
      <div className="hidden sm:flex items-center gap-1">
        <ZoomOutComponent />
        <ZoomComponent />
        <ZoomInComponent />
      </div>
    </div>
  );
}
