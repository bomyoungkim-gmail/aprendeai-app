'use client';

import React, { useRef, useState, useLayoutEffect, forwardRef } from 'react';
import { Highlighter, MessageSquare, HelpCircle, Sparkles, Star, BookOpen } from 'lucide-react';
import type { RenderHighlightTargetProps } from '@react-pdf-viewer/highlight';
import { getColorForKey } from '@/lib/constants/colors';

interface PDFSelectionMenuProps {
  props: RenderHighlightTargetProps;
  handleHighlightCreation: (props: any) => void;
  onSelectionAction?: (action: 'note' | 'question' | 'ai' | 'star' | 'triage' | 'annotation', text: string, data?: any) => void;
  selectedColor: string;
}

/**
 * PDFSelectionMenu - Menu de seleção de texto no PDF
 * 
 * Exibe um menu flutuante quando o usuário seleciona texto no PDF,
 * oferecendo ações como: destacar, criar nota, marcar como importante,
 * fazer pergunta, usar IA, ou fazer triagem.
 * 
 * Features:
 * - Posicionamento automático no viewport
 * - Ajuste para evitar overflow
 * - 6 ações disponíveis
 * - Suporte a dark mode
 */
export const PDFSelectionMenu = forwardRef<HTMLDivElement, PDFSelectionMenuProps>(({ 
  props, 
  handleHighlightCreation, 
  onSelectionAction, 
  selectedColor,
}, ref) => {
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
        title="Destaque"
      >
        <Highlighter className="h-4 w-4" style={{ color: getColorForKey(selectedColor) }} />
        <span className={labelClass}>Destacar</span>
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
        title="Nota"
      >
        <MessageSquare className="h-4 w-4 text-blue-500" />
        <span className={labelClass}>Nota</span>
      </button>

      {/* Star - ⭐ */}
      <button 
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onSelectionAction?.('star', props.selectedText, props);
          props.toggle();
        }}
        className={buttonClass}
        title="Importante"
      >
        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
        <span className={labelClass}>Importante</span> 
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
        title="Dúvida"
      >
        <HelpCircle className="h-4 w-4 text-red-500" />
        <span className={labelClass}>Dúvida</span>
      </button>

      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* AI - 🤖 */}
      <button 
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onSelectionAction?.('ai', props.selectedText, props);
          props.toggle();
        }}
        className={`${buttonClass} relative group`}
        title="Assistente IA"
      >
        <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />
        <span className={`${labelClass} text-purple-600 font-bold`}>IA</span>
      </button>
      
      {/* Triage - 📖 */}
       <button 
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onSelectionAction?.('triage', props.selectedText, props);
          props.toggle();
        }}
        className={buttonClass}
        title="Triagem"
      >
        <BookOpen className="h-4 w-4 text-gray-500" />
        <span className={labelClass}>Triagem</span>
      </button>

      {/* Triangle Arrow */}
      <div 
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-gray-800 border-t border-l border-gray-200 dark:border-gray-700 transform rotate-45"
      />
    </div>
  );
});

PDFSelectionMenu.displayName = 'PDFSelectionMenu';
