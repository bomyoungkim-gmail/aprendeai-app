import React, { useEffect, useState, useRef } from 'react';
import { CORNELL_CONFIG } from '@/lib/cornell/unified-config';
import { ACTION_LABELS } from '@/lib/cornell/labels';
import { 
  Sparkles, 
} from 'lucide-react';
import type { UnifiedStreamItemType } from '@/lib/types/unified-stream';

export type SelectionAction = UnifiedStreamItemType;

interface TextSelectionMenuProps {
  selectionInfo: {
    text: string;
    rect: DOMRect | null;
  } | null;
  onAction: (action: SelectionAction, text: string) => void;
}

export function TextSelectionMenu({ selectionInfo, onAction }: TextSelectionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (selectionInfo?.rect && selectionInfo.text) {
      const { rect } = selectionInfo;
      
      // Calculate position above the selection
      const top = rect.top + window.scrollY - 50; // 50px offset above
      const left = rect.left + window.scrollX + (rect.width / 2);
      
      setPosition({ top, left });
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [selectionInfo]);

  if (!visible || !selectionInfo) return null;

  const buttonClass = "flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors gap-1 min-w-[60px]";
  const iconClass = "h-4 w-4 text-gray-700 dark:text-gray-300";
  const labelClass = "text-[10px] font-medium text-gray-600 dark:text-gray-400";

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 flex items-center p-1 animate-in fade-in zoom-in-95 duration-200"
      style={{ 
        top: position.top, 
        left: position.left,
        transform: 'translateX(-50%)' 
      }}
      role="dialog"
      aria-label="Menu de seleção de texto"
    >
      {['EVIDENCE', 'VOCABULARY', 'MAIN_IDEA', 'DOUBT'].map((key) => {
        const config = CORNELL_CONFIG[key];
        const Icon = config.icon;
        const color = config.color;
        const shortcut = config.shortcut ? ` (Atalho: ${config.shortcut})` : '';

        // Explicit classes for JIT support
        const colorClasses: Record<string, string> = {
          yellow: 'text-yellow-500',
          blue: 'text-blue-500',
          green: 'text-green-500',
          red: 'text-red-500',
          purple: 'text-purple-500',
        };

        const fillClasses: Record<string, string> = {
          green: 'fill-green-500',
        };
        
        return (
          <button 
            key={key}
            onClick={() => onAction(config.id as SelectionAction, selectionInfo.text)}
            className={buttonClass}
            aria-label={config.label}
            title={`${config.label}${shortcut}`}
          >
            <Icon 
              className={`h-4 w-4 ${colorClasses[color] || 'text-gray-500'} ${key === 'MAIN_IDEA' ? (fillClasses[color] || '') : ''}`} 
            />
            <span className={labelClass}>{config.label}</span>
          </button>
        );
      })}

      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* AI - 🤖 (Animated) */}
      <button 
        onClick={() => onAction('ai', selectionInfo.text)}
        className={`${buttonClass} relative group`}
        aria-label={ACTION_LABELS.AI}
        title="Atalho: /"
      >
        <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />
        <span className={`${labelClass} text-purple-600 font-bold`}>{ACTION_LABELS.AI}</span>
      </button>

      {/* Triangle Arrow at bottom */}
      <div 
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700 transform rotate-45"
      />
    </div>
  );
}
