'use client';

import { useState, useEffect } from 'react';

interface TextSelection {
  text: string;
  startOffset: number;
  endOffset: number;
  rect: DOMRect;
  x: number;
  y: number;
}

export function useTextSelection(containerElement: HTMLElement | null) {
  const [selection, setSelection] = useState<TextSelection | null>(null);

  useEffect(() => {
    const handleSelection = () => {
      if (!containerElement) return;

      const sel = window.getSelection();
      const text = sel?.toString().trim();

      if (text && text.length > 0) {
        const range = sel!.getRangeAt(0);
        
        if (containerElement.contains(range.commonAncestorContainer)) {
          // Get position for toolbar
          const rect = range.getBoundingClientRect();
          
          // Calculate offsets
          const startOffset = getTextOffset(containerElement, range.startContainer, range.startOffset);
          const endOffset = getTextOffset(containerElement, range.endContainer, range.endOffset);
          
          setSelection({
            text,
            startOffset,
            endOffset,
            rect, // Return the rect
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
          });
        }
      } else {
        setSelection(null);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
    };
  }, [containerElement]);

  const clearSelection = () => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  return { selection, clearSelection };
}

// Calculate character offset from container start
function getTextOffset(container: Node, node: Node, offset: number): number {
  let charCount = 0;
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null
  );

  let currentNode: Node | null;
  while ((currentNode = walker.nextNode())) {
    if (currentNode === node) {
      return charCount + offset;
    }
    charCount += currentNode.textContent?.length || 0;
  }

  return charCount;
}
