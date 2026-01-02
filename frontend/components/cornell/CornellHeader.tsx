/**
 * Cornell Header Component
 * 
 * Top navigation bar for Cornell reading layout.
 * Includes: back button, mode indicator, color picker, actions, session controls.
 */

import React from 'react';
import Link from 'next/link';
import type { SelectionAction } from '@/components/cornell/TextSelectionMenu';
import { ArrowLeft, Save, PanelBottom, ChevronDown, ChevronRight, Check as CheckIcon, Share2 } from 'lucide-react';
import { getColorForKey, getDefaultPalette } from '@/lib/constants/colors';
import { ContentModeIndicator } from './ContentModeIndicator';
import type { ViewMode } from '@/lib/types/cornell';
import type { ContentMode } from '@/lib/types/content-mode';

export interface CornellHeaderProps {
  // Content
  title: string;
  contentId: string;
  
  // Mode
  mode: ViewMode;
  contentMode: ContentMode | null;
  modeSource?: 'USER' | 'INFERRED' | 'DEFAULT';
  inferredMode?: ContentMode | null;
  isContentModeLoading: boolean;
  onModeClick: () => void;
  
  // Color Picker
  selectedColor: string;
  onColorChange?: (color: string) => void;
  
  // Actions
  onShareClick: () => void;
  onAIClick: () => void;
  onTriageClick: () => void;
  activeAction: SelectionAction | null;
  
  // Session
  sessionId?: string;
  onFinishSession?: () => void;
  isFinishing: boolean;
  
  // Flow state
  isInFlow: boolean;
  
  // UI visibility
  isVisible: boolean;
  
  // Sidebar
  isOpen?: boolean;
  onMenuClick?: () => void;
  
  // Telemetry
  onTrack: (event: string, data?: any) => void;
}

export function CornellHeader({
  title,
  contentId,
  mode,
  contentMode,
  modeSource,
  inferredMode,
  isContentModeLoading,
  onModeClick,
  selectedColor,
  onColorChange,
  onShareClick,
  onAIClick,
  onTriageClick,
  activeAction,
  sessionId,
  onFinishSession,
  isFinishing,
  isInFlow,
  isVisible,
  isOpen,
  onMenuClick,
  onTrack,
}: CornellHeaderProps) {
  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 md:px-4 py-2 md:py-3 flex items-center justify-between gap-2 md:gap-4 flex-shrink-0 transition-transform duration-300 shadow-sm ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {/* Left: Back button */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <Link 
          href="/dashboard" 
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
        >
          <ChevronRight className="w-5 h-5 rotate-180 text-gray-600 dark:text-gray-300" />
        </Link>
      </div>

      {/* Center: Color Picker & Actions */}
      <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar flex-1 justify-center">
        <ContentModeIndicator 
          mode={contentMode}
          source={modeSource}
          inferredMode={inferredMode}
          isLoading={isContentModeLoading}
          onClick={() => {
            onTrack('CLICK_MODE_INDICATOR');
            onModeClick();
          }}
          className={`hidden sm:flex transition-all duration-500 ${
            isInFlow ? 'ring-2 ring-purple-400 ring-offset-2 scale-105 shadow-purple-200/50 shadow-lg' : ''
          }`}
        />

        {isInFlow && (
          <span className="animate-pulse text-lg ml-[-12px] z-10" title="Estado de Flow Detectado">✨</span>
        )}



        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            onClick={onShareClick}
            title="Compartilhar"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Compartilhar</span>
          </button>

          {sessionId && (
            <button 
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
              onClick={onFinishSession}
              disabled={isFinishing}
            >
              <CheckIcon className="w-4 h-4" />
              <span>{isFinishing ? 'Finalizando...' : 'Entregar'}</span>
            </button>
          )}



          <button 
            className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
              ${activeAction === 'question'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 ring-2 ring-blue-500'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50'
              }`}
            onClick={onTriageClick}
            title="Triagem"
          >
            <span className="text-lg">📖</span>
            <span className="hidden md:inline">Triagem</span>
          </button>
        </div>
      </div>

  
    </header>
  );
}
