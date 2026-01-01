import { useState } from 'react';

/**
 * usePDFUIState - Hook para gerenciar estado da UI do PDF
 * 
 * Responsabilidades:
 * - Controle de zoom
 * - Estado do sidebar (thumbnails/bookmarks)
 * - Menu de IA
 * - Texto selecionado
 * 
 * @returns Estado e setters da UI
 */
export function usePDFUIState() {
  const [zoom, setZoom] = useState(1.0);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [selectedText, setSelectedText] = useState<string>('');
  const [activeSidebar, setActiveSidebar] = useState<'thumbnails' | 'bookmarks' | null>(null);
  const [totalPages, setTotalPages] = useState(0);

  const toggleSidebar = (sidebar: 'thumbnails' | 'bookmarks') => {
    setActiveSidebar(activeSidebar === sidebar ? null : sidebar);
  };

  const closeSidebar = () => {
    setActiveSidebar(null);
  };

  return {
    zoom,
    setZoom,
    showAIMenu,
    setShowAIMenu,
    selectedText,
    setSelectedText,
    activeSidebar,
    setActiveSidebar,
    toggleSidebar,
    closeSidebar,
    totalPages,
    setTotalPages,
  };
}
