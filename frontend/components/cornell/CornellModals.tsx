/**
 * Cornell Modals Component
 * 
 * Consolidates all modals used in the Cornell layout including:
 * - Create Highlight Modal
 * - Content Mode Selector
 * - Share Modal
 * - Glossary Popover
 * - Suggestions Panel
 * - Action Toolbar
 * - Premium Feature Block
 */

import type { SelectionAction } from '@/components/cornell/TextSelectionMenu';
import React from 'react';
import { CreateHighlightModal } from './CreateHighlightModal';
import { ContentModeSelector } from './ContentModeSelector';
import { ShareModal } from '../sharing/ShareModal';
import { GlossaryPopover } from '../glossary/GlossaryPopover';
import { SuggestionsPanel } from './SuggestionsPanel';
import { PremiumFeatureBlock } from '../billing/PremiumFeatureBlock';
import { ContentMode, ContentModeSource } from '@/lib/types/content-mode';
import { Definition } from '../glossary/GlossaryPopover';
import type { CornellType } from '@/lib/types/cornell';
import type { Suggestion } from '@/hooks/cornell/use-content-context';

export interface CornellModalsProps {
  // Create Highlight Modal
  isCreateModalOpen: boolean;
  onCreateModalClose: () => void;
  createModalType: CornellType;
  selectedColor: string;
  
  // Mode Selector
  isModeSelectorOpen: boolean;
  onModeSelectorClose: () => void;
  contentMode: ContentMode | null;
  inferredMode?: ContentMode | null;
  modeSource?: ContentModeSource;
  onModeChange: (mode: ContentMode, source: ContentModeSource) => void;
  contentId: string;
  targetType: any; 
  title: string;  // Added title
  
  // Share Modal
  isShareModalOpen: boolean;
  onShareModalClose: () => void;
  
  // Glossary Popover
  selectedTerm: string | null;
  glossaryDefinition: Definition | null;
  isGlossaryLoading: boolean;
  glossaryPosition: { x: number; y: number } | null;
  onGlossaryClose: () => void;
  
  // AI Suggestions Panel
  showSuggestions: boolean;
  suggestions: Suggestion[];
  onAcceptSuggestion: (id: string) => void;
  onDismissSuggestion: (id: string) => void;
  hasAIAssistant: boolean;
  
  // Premium Feature
  showPremiumBlock: boolean;
  featureName: string;
  onPremiumDismiss: () => void;
}

/**
 * Consolidated modals component for Cornell layout
 */
export function CornellModals({
  // Create Highlight Modal
  isCreateModalOpen,
  onCreateModalClose,
  createModalType,
  selectedColor,
  
  // Mode Selector
  isModeSelectorOpen,
  onModeSelectorClose,
  contentMode,
  inferredMode,
  modeSource,
  onModeChange,
  contentId,
  targetType,
  title, // Destructure title
  
  // Share Modal
  isShareModalOpen,
  onShareModalClose,
  
  // Glossary Popover
  selectedTerm,
  glossaryDefinition,
  isGlossaryLoading,
  glossaryPosition,
  onGlossaryClose,
  
  // Suggestions Panel
  showSuggestions,
  suggestions,
  onAcceptSuggestion,
  onDismissSuggestion,
  hasAIAssistant,
  
  // Premium Feature
  showPremiumBlock,
  featureName,
  onPremiumDismiss,
}: CornellModalsProps) {
  return (
    <>
      {/* Create Highlight Modal */}
      <CreateHighlightModal
        isOpen={isCreateModalOpen}
        onClose={onCreateModalClose}
        initialType={createModalType}
        contentId={contentId}
        targetType={targetType}
      />
      
      {/* Content Mode Selector Modal */}
      <ContentModeSelector
        isOpen={isModeSelectorOpen}
        onClose={onModeSelectorClose}
        currentMode={contentMode}
        inferredMode={inferredMode}
        modeSource={modeSource}
        onModeSelect={onModeChange}
        contentId={contentId}
      />
      
      {/* Share Modal */}
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={onShareModalClose} 
        contentId={contentId}
        title={title}
      />
      
      {/* Glossary Popover */}
      {selectedTerm && glossaryPosition && (
        <GlossaryPopover
          term={selectedTerm}
          definition={glossaryDefinition}
          isLoading={isGlossaryLoading}
          position={glossaryPosition}
          onClose={onGlossaryClose}
        />
      )}
      
      {/* AI Suggestions Panel */}
      {showSuggestions && hasAIAssistant && suggestions.length > 0 && (
        <SuggestionsPanel
          suggestions={suggestions}
          onAccept={onAcceptSuggestion}
          onDismiss={onDismissSuggestion}
        />
      )}
      
      {/* Premium Feature Block */}
      {showPremiumBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md">
            <button 
               onClick={onPremiumDismiss}
               className="absolute top-2 right-2 p-1 bg-white/50 rounded-full hover:bg-white transition-colors"
            >
              ✕
            </button>
            <PremiumFeatureBlock
              featureName={featureName}
              description="Atualize para o Premium para desbloquear este recurso exclusivo e potencialize seus estudos."
            />
          </div>
        </div>
      )}
    </>
  );
}
