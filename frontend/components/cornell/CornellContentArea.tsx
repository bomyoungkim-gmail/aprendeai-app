/**
 * Cornell Content Area Component
 * 
 * Wrapper for the PDF viewer with text selection and glossary support.
 */

import React from 'react';
import { TextSelectionMenu, type SelectionAction } from './TextSelectionMenu';
import type { ContentMode } from '@/lib/types/content-mode';

export interface CornellContentAreaProps {
  // Viewer
  viewer: React.ReactNode;
  
  // Selection
  selection: any; // SelectionInfo from useTextSelection
  onSelectionAction: (action: SelectionAction, text: string) => void;
  disableSelectionMenu: boolean;
  
  // Glossary (Scientific mode)
  contentMode: ContentMode;
  onTermClick: (term: string, event: React.MouseEvent) => void;
  
  // UI Toggle
  onContentClick: () => void;
  
  // Ref callback
  onContentElementReady: (element: HTMLDivElement | null) => void;
  
  // UI visibility
  isVisible: boolean;
}

export function CornellContentArea({
  viewer,
  selection,
  onSelectionAction,
  disableSelectionMenu,
  contentMode,
  onTermClick,
  onContentClick,
  onContentElementReady,
  isVisible,
}: CornellContentAreaProps) {
  return (
    <div 
      className={`flex-1 overflow-hidden bg-gray-100 dark:bg-gray-950 transition-[padding] duration-300 ${
        isVisible ? 'pt-16' : 'pt-0'
      }`}
      ref={onContentElementReady}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        const text = window.getSelection()?.toString().trim();
        
        // SCIENTIFIC mode Glossary Trigger
        if (contentMode === 'SCIENTIFIC' && !text) {
          const clickedText = target.innerText;
          if (clickedText && clickedText.length > 3) {
            // List of scientific terms that trigger glossary
            const scientificTerms = ['mitochondria', 'photosynthesis', 'enzyme'];
            const lowerText = clickedText.toLowerCase();
            
            for (const term of scientificTerms) {
              if (lowerText.includes(term)) {
                onTermClick(term, e);
                return;
              }
            }
          }
        }

        if (text) return;
        onContentClick();
      }}
    >
      {!disableSelectionMenu && (
        <TextSelectionMenu 
          selectionInfo={selection} 
          onAction={onSelectionAction} 
        />
      )}
      
      {viewer}
    </div>
  );
}
