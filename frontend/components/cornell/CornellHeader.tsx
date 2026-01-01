/**
 * Cornell Header Component
 * 
 * Top navigation bar for Cornell reading layout.
 * Includes: back button, mode indicator, color picker, actions, session controls.
 */

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Share2, Check as CheckIcon } from 'lucide-react';
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
  activeAction: 'ai' | 'question' | null;
  
  // Session
  sessionId?: string;
  onFinishSession?: () => void;
  isFinishing: boolean;
  
  // Layout
  onLayoutChange?: () => void;
  
  // Flow state
  isInFlow: boolean;
  
  // UI visibility
  isVisible: boolean;
  
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
  onLayoutChange,
  isInFlow,
  isVisible,
  onTrack,
}: CornellHeaderProps) {
  return (
    <header 
      className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 md:px-4 py-2 md:py-3 flex items-center justify-between gap-2 md:gap-4 flex-shrink-0 fixed top-0 w-full z-50 transition-transform duration-300 ${
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
      <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar">
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

        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 shrink-0 hidden sm:block"></div>

        {/* Color Picker */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-full p-1 shrink-0">
          {getDefaultPalette().map((color) => (
            <button
              key={color}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                selectedColor === color 
                  ? 'border-gray-800 dark:border-gray-100 scale-110 shadow-sm' 
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: getColorForKey(color) }}
              onClick={() => onColorChange?.(color)}
              title={color.charAt(0).toUpperCase() + color.slice(1)}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>

        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 shrink-0"></div>

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

          {/* Layout Switch - Sprint 6 */}
          {onLayoutChange && (
            <button 
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
              onClick={onLayoutChange}
              title="Alternar para visualização clássica"
            >
              <span className="text-lg">🏛️</span>
              <span className="hidden sm:inline">Clássico</span>
            </button>
          )}

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
              ${activeAction === 'ai'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 ring-2 ring-purple-500'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50'
              }`}
            onClick={onAIClick}
            title="IA Assistente"
          >
            <span className="text-lg">✨</span>
            <span className="hidden md:inline">IA</span>
          </button>

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

      {/* Right: Placeholder for future menu */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        {/* Menu button will be added in sidebar component */}
      </div>
    </header>
  );
}
