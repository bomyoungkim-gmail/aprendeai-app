import { useState, useCallback, useRef } from 'react';

/**
 * usePDFNavigation - Hook para gerenciar navegação no PDF
 * 
 * Responsabilidades:
 * - Controle de página atual
 * - Navegação (próxima/anterior)
 * - Jump to page
 * - Jump to highlight
 * 
 * @param totalPages - Total de páginas do documento
 * @returns Métodos e estado de navegação
 */
export function usePDFNavigation(totalPages: number) {
  const [currentPage, setCurrentPage] = useState(1);
  const viewerRef = useRef<any>(null);
  const jumpToHighlightAreaRef = useRef<((area: any) => void) | null>(null);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && viewerRef.current) {
      viewerRef.current.jumpToPage(page - 1); // 0-indexed
      setCurrentPage(page);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages && viewerRef.current) {
      const nextPageNum = currentPage + 1;
      viewerRef.current.jumpToPage(nextPageNum - 1); // 0-indexed
      setCurrentPage(nextPageNum);
    }
  }, [currentPage, totalPages]);

  const previousPage = useCallback(() => {
    if (currentPage > 1 && viewerRef.current) {
      const prevPageNum = currentPage - 1;
      viewerRef.current.jumpToPage(prevPageNum - 1); // 0-indexed
      setCurrentPage(prevPageNum);
    }
  }, [currentPage]);

  const jumpToHighlight = useCallback((highlightArea: any) => {
    if (jumpToHighlightAreaRef.current) {
      jumpToHighlightAreaRef.current(highlightArea);
    }
  }, []);

  const handlePageChange = useCallback((e: { currentPage: number }, onPageChangeProp?: (page: number) => void) => {
    const newPage = e.currentPage + 1; // Convert from 0-indexed
    setCurrentPage(newPage);
    onPageChangeProp?.(newPage);
  }, []);

  const handleDocumentLoad = useCallback((e: { doc: any }, setTotalPages: (pages: number) => void) => {
    setTotalPages(e.doc.numPages);
  }, []);

  return {
    currentPage,
    setCurrentPage,
    viewerRef,
    jumpToHighlightAreaRef,
    goToPage,
    nextPage,
    previousPage,
    jumpToHighlight,
    handlePageChange,
    handleDocumentLoad,
  };
}
