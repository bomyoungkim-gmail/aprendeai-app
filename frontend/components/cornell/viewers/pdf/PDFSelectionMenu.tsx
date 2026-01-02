'use client';

import React, { useRef, useState, useLayoutEffect, forwardRef } from 'react';
import { Highlighter, MessageSquare, HelpCircle, Sparkles, Star, BookOpen } from 'lucide-react';
import type { RenderHighlightTargetProps } from '@react-pdf-viewer/highlight';
import { getColorForKey } from '@/lib/constants/colors';
import { ACTION_LABELS } from '@/lib/cornell/labels';

import { useCornellLayout } from '@/contexts/CornellLayoutContext';

interface PDFSelectionMenuProps {
  props: RenderHighlightTargetProps;
  handleHighlightCreation: (props: any) => void;
  onSelectionAction?: (action: 'note' | 'question' | 'ai' | 'important' | 'triage' | 'annotation', text: string, data?: any) => void;
  selectedColor: string;
}

/**
 * PDFSelectionMenu - Menu de seleção de texto no PDF
 */
export const PDFSelectionMenu = forwardRef<HTMLDivElement, PDFSelectionMenuProps>(({ 
  props, 
  handleHighlightCreation, 
  onSelectionAction, 
  selectedColor,
}, ref) => {
  const layout = useCornellLayout();
  const internalRef = useRef<HTMLDivElement>(null);
  const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({
    position: 'absolute',
    left: `${props.selectionRegion.left}%`,
    top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
    transform: 'translate(-50%, 8px)',
    zIndex: 999,
  });

  // Adjust position to keep menu in viewport
  useLayoutEffect(() => {
    if (internalRef.current) {
      const rect = internalRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      let newTransform = 'translate(-50%, 8px)';
      
      // Check left overflow
      if (rect.left < 10) {
        const overflow = 10 - rect.left;
        newTransform = `translate(calc(-50% + ${overflow}px), 8px)`;
      } else if (rect.right > viewportWidth - 10) {
         const overflow = rect.right - (viewportWidth - 10);
         newTransform = `translate(calc(-50% - ${overflow}px), 8px)`;
      }

      setPositionStyle(prev => ({
        ...prev,
        transform: newTransform
      }));
    }
  }, [props.selectionRegion]);

  const buttonClass = "flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors gap-1 min-w-[60px]";
  const labelClass = "text-[10px] font-medium text-gray-600 dark:text-gray-400";

  return (
    <div
      ref={(node) => {
        // Handle both refs: internal for logic, forwarded for parent
        (internalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      }}
      style={positionStyle}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 flex items-center p-1 animate-in fade-in zoom-in-95 duration-200"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Highlight - 🎨 */}
      <button 
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          handleHighlightCreation(props); 
          props.toggle();
        }}
        className={buttonClass}
        title={ACTION_LABELS.HIGHLIGHT}
      >
        <Highlighter className="h-4 w-4" style={{ color: getColorForKey(selectedColor) }} />
        <span className={labelClass}>{ACTION_LABELS.HIGHLIGHT}</span>
      </button>

      {/* Note - 💬 */}
      <button 
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onSelectionAction?.('note', props.selectedText, props);
          props.toggle();
        }}
        className={buttonClass}
        title={ACTION_LABELS.NOTE}
      >
        <BookOpen className="h-4 w-4 text-blue-500" />
        <span className={labelClass}>{ACTION_LABELS.NOTE}</span>
      </button>

      {/* Star - ⭐ */}
      <button 
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onSelectionAction?.('important', props.selectedText, props);
          props.toggle();
        }}
        className={buttonClass}
        title={ACTION_LABELS.IMPORTANT}
      >
        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
        <span className={labelClass}>{ACTION_LABELS.IMPORTANT}</span> 
      </button>

      {/* Question - ❓ */}
      <button 
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onSelectionAction?.('question', props.selectedText, props);
          props.toggle();
        }}
        className={buttonClass}
        title={ACTION_LABELS.QUESTION}
      >
        <HelpCircle className="h-4 w-4 text-red-500" />
        <span className={labelClass}>{ACTION_LABELS.QUESTION}</span>
      </button>

      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* AI - 🤖 */}
      <button 
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          layout.handleAISelection(props.selectedText);
          props.toggle();
        }}
        className={`${buttonClass} relative group`}
        title="Assistente IA"
      >
        <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />
        <span className={`${labelClass} text-purple-600 font-bold`}>IA</span>
      </button>

      {/* Triangle Arrow */}
      <div 
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-gray-800 border-t border-l border-gray-200 dark:border-gray-700 transform rotate-45"
      />
    </div>
  );
});

PDFSelectionMenu.displayName = 'PDFSelectionMenu';
