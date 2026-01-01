import { Grid, Bookmark } from 'lucide-react';

interface PDFToolbarProps {
  activeSidebar: 'thumbnails' | 'bookmarks' | null;
  onToggleSidebar: (sidebar: 'thumbnails' | 'bookmarks') => void;
  currentPage: number;
  totalPages: number;
  ZoomOutComponent: React.ComponentType;
  ZoomComponent: React.ComponentType;
  ZoomInComponent: React.ComponentType;
}

/**
 * PDFToolbar - Barra de ferramentas customizada do PDF
 * 
 * Features:
 * - Toggles para sidebar (thumbnails/bookmarks)
 * - Controles de zoom
 * - Contador de páginas
 * - Suporte a dark mode
 */
export function PDFToolbar({
  activeSidebar,
  onToggleSidebar,
  currentPage,
  totalPages,
  ZoomOutComponent,
  ZoomComponent,
  ZoomInComponent,
}: PDFToolbarProps) {
  return (
    <div className="flex items-center justify-between w-full p-2 text-gray-700 dark:text-gray-200 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm z-10 transition-colors duration-200">
      {/* Left: Custom Sidebar Toggles */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => onToggleSidebar('thumbnails')}
          className={`p-1.5 rounded-lg transition-colors ${
            activeSidebar === 'thumbnails' 
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Miniaturas"
        >
          <Grid className="w-5 h-5" />
        </button>
        <button
          onClick={() => onToggleSidebar('bookmarks')}
          className={`p-1.5 rounded-lg transition-colors ${
            activeSidebar === 'bookmarks' 
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Marcadores"
        >
          <Bookmark className="w-5 h-5" />
        </button>
      </div>

      {/* Center: Zoom Controls */}
      <div className="flex items-center gap-2">
        <ZoomOutComponent />
        <div className="transform scale-90">
          <ZoomComponent />
        </div>
        <ZoomInComponent />
      </div>

      {/* Right: Page Counter */}
      <div className="flex items-center gap-2 text-sm font-medium">
        {totalPages > 0 && (
          <span className="text-gray-700 dark:text-gray-300">
            Página {currentPage} de {totalPages}
          </span>
        )}
      </div>
    </div>
  );
}
