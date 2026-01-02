import { X } from 'lucide-react';

interface PDFSidebarProps {
  activeSidebar: 'thumbnails' | 'bookmarks' | null;
  onClose: () => void;
  ThumbnailsComponent: React.ComponentType;
  BookmarksComponent: React.ComponentType;
}

/**
 * PDFSidebar - Sidebar overlay para thumbnails e bookmarks
 * 
 * Features:
 * - Toggle entre thumbnails e bookmarks
 * - Overlay com animação
 * - Botão de fechar
 * - Scroll independente
 */
export function PDFSidebar({ 
  activeSidebar, 
  onClose, 
  ThumbnailsComponent, 
  BookmarksComponent 
}: PDFSidebarProps) {
  if (!activeSidebar) return null;

  return (
    <div className="absolute left-0 top-12 bottom-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-20 shadow-xl animate-in slide-in-from-left duration-200">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">
          {activeSidebar === 'thumbnails' ? 'Miniaturas' : 'Marcadores'}
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      <div className="overflow-auto h-[calc(100%-45px)] custom-scrollbar">
         {activeSidebar === 'thumbnails' ? <ThumbnailsComponent /> : <BookmarksComponent />}
      </div>
    </div>
  );
}
