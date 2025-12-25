import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Sparkles } from 'lucide-react';

interface PDFToolbarProps {
  currentPage: number;
  totalPages: number;
  zoom: number;
  onPageChange: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onAIAssist?: () => void;
}

export function PDFToolbar({
  currentPage,
  totalPages,
  zoom,
  onPageChange,
  onZoomIn,
  onZoomOut,
  onAIAssist,
}: PDFToolbarProps) {
  const [pageInput, setPageInput] = useState(String(currentPage));
  const [isVisible, setIsVisible] = useState(true);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = () => {
    const page = parseInt(pageInput, 10);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageInputSubmit();
    }
  };

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
      {/* Previous Page */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Página anterior"
      >
        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Page Input */}
      <div className="flex items-center gap-1 sm:gap-2">
        <input
          type="text"
          value={pageInput}
          onChange={handlePageInputChange}
          onBlur={handlePageInputSubmit}
          onKeyDown={handlePageInputKeyDown}
          className="w-10 sm:w-12 px-1.5 sm:px-2 py-1 text-center text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          / {totalPages}
        </span>
      </div>

      {/* Next Page */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Próxima página"
      >
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Divider */}
      <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>

      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hidden sm:block"
        title="Diminuir zoom"
      >
        <ZoomOut className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Zoom Level */}
      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block min-w-[3rem] text-center">
        {Math.round(zoom * 100)}%
      </span>

      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hidden sm:block"
        title="Aumentar zoom"
      >
        <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 dark:text-gray-300" />
      </button>

      {/* AI Assistant */}
      {onAIAssist && (
        <>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
          <button
            onClick={onAIAssist}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all"
            title="IA Assistente"
          >
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            <span className="text-xs sm:text-sm font-medium text-white hidden sm:inline">
              IA
            </span>
          </button>
        </>
      )}
    </div>
  );
}
