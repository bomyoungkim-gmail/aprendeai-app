/**
 * Adapted Text Selection Hook for @react-pdf-viewer
 * Provides consistent API for text selection across different viewers
 */

import { useState, useEffect, useRef } from 'react';

export interface TextSelection {
  text: string;
  startOffset: number;
  endOffset: number;
  pageIndex?: number;
  boundingRect?: DOMRect | null;
  selectedText?: string;
}

interface UseTextSelectionReturn {
  selection: TextSelection | null;
  clearSelection: () => void;
  handleSelectionChange: (event: any) => void;
}

/**
 * Hook for handling text selection in PDF viewer
 * Compatible with both native browser selection and @react-pdf-viewer events
 */
export function useTextSelection(containerRef: HTMLElement | null): UseTextSelectionReturn {
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const selectionTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!containerRef) return;

    const handleSelection = () => {
      // Clear previous timeout
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }

      // Debounce selection change
      selectionTimeoutRef.current = setTimeout(() => {
        const browserSelection = window.getSelection();
        
        if (!browserSelection || browserSelection.isCollapsed) {
          setSelection(null);
          return;
        }

        const selectedText = browserSelection.toString().trim();
        
        if (!selectedText) {
          setSelection(null);
          return;
        }

        const range = browserSelection.getRangeAt(0);
        const boundingRect = range.getBoundingClientRect();

        setSelection({
          text: selectedText,
          selectedText,
          startOffset: range.startOffset,
          endOffset: range.endOffset,
          boundingRect: boundingRect as DOMRect,
          pageIndex: undefined, // Will be set by PDF viewer if available
        });
      }, 150); // Debounce delay
    };

    // Listen to selectionchange event
    document.addEventListener('selectionchange', handleSelection);

    return () => {
      document.removeEventListener('selectionchange', handleSelection);
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, [containerRef]);

  const clearSelection = () => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  /**
   * Handle selection from @react-pdf-viewer plugin
   * This provides more structured data than browser selection
   */
  const handleSelectionChange = (event: any) => {
    if (!event || !event.selectedText) {
      setSelection(null);
      return;
    }

    setSelection({
      text: event.selectedText,
      selectedText: event.selectedText,
      startOffset: event.startOffset || 0,
      endOffset: event.endOffset || event.selectedText.length,
      pageIndex: event.pageIndex,
      boundingRect: event.getBoundingClientRect ? event.getBoundingClientRect() : null,
    });
  };

  return {
    selection,
    clearSelection,
    handleSelectionChange,
  };
}

/**
 * Hook specifically for @react-pdf-viewer highlight plugin
 */
export function usePDFHighlight() {
  const [selectedArea, setSelectedArea] = useState<any>(null);

  const handleTextSelected = (event: any) => {
    if (!event) {
      setSelectedArea(null);
      return;
    }

    setSelectedArea({
      pageIndex: event.pageIndex,
      selectedText: event.selectedText,
      highlightAreas: event.highlightAreas || [],
      getCombinedRect: event.getCombinedRect,
    });
  };

  const clearSelection = () => {
    setSelectedArea(null);
  };

  return {
    selectedArea,
    handleTextSelected,
    clearSelection,
  };
}
