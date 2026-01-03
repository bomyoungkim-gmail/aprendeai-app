import { useState } from 'react';

/**
 * usePDFUIState - Hook para gerenciar estado da UI do PDF
 * 
 * Responsabilidades:
 * - Estado do sidebar (thumbnails/bookmarks)
 * - Total de páginas do documento
 * 
 * @returns Estado e setters da UI
 */
export function usePDFUIState() {
  const [activeSidebar, setActiveSidebar] = useState<'thumbnails' | 'bookmarks' | null>(null);
  const [totalPages, setTotalPages] = useState(0);

  const toggleSidebar = (sidebar: 'thumbnails' | 'bookmarks') => {
    setActiveSidebar(activeSidebar === sidebar ? null : sidebar);
  };

  const closeSidebar = () => {
    setActiveSidebar(null);
  };

  return {
    activeSidebar,
    setActiveSidebar,
    toggleSidebar,
    closeSidebar,
    totalPages,
    setTotalPages,
  };
}
