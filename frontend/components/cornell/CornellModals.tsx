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

import React from 'react';
import { CreateHighlightModal } from './CreateHighlightModal';
import { ContentModeSelector } from './ContentModeSelector';
import { ShareModal } from '../sharing/ShareModal';
import { GlossaryPopover } from './GlossaryPopover';
import { SuggestionsPanel } from './SuggestionsPanel';
import { ActionToolbar } from './ActionToolbar';
import { PremiumFeatureBlock } from '../billing/PremiumFeatureBlock';
import { ContentMode } from '@/lib/types/content-mode';
import type { CornellType } from '@/hooks/domain/use-cornell-layout';
import type { Suggestion } from '@/hooks/domain/use-cornell-pedagogical';

export interface CornellModalsProps {
  // Create Highlight Modal
  isCreateModalOpen: boolean;
  onCreateModalClose: () => void;
  createModalType: CornellType;
  onCreateHighlight: (data: any) => void;
  selectedColor: string;
  
  // Mode Selector
  isModeSelectorOpen: boolean;
  onModeSelectorClose: () => void;
  contentMode: ContentMode | null;
  inferredMode?: ContentMode | null;
  modeSource?: 'USER' | 'INFERRED' | 'DEFAULT';
  onModeChange: (mode: ContentMode, source: 'USER' | 'INFERRED') => void;
  contentId: string;
  
  // Share Modal
  isShareModalOpen: boolean;
  onShareModalClose: () => void;
  
  // Glossary Popover
  selectedTerm: string | null;
  glossaryDefinition: string | null;
  isGlossaryLoading: boolean;
  glossaryPosition: { x: number; y: number } | null;
  onGlossaryClose: () => void;
  
  // Suggestions Panel
  showSuggestions: boolean;
  suggestions: Suggestion[];
  onAcceptSuggestion: (id: string) => void;
  onDismissSuggestion: (id: string) => void;
  hasAIAssistant: boolean;
  
  // Action Toolbar
  showActionToolbar: boolean;
  activeAction: 'ai' | 'question' | null;
  onActionChange: (action: 'ai' | 'question' | null) => void;
  chatInitialInput: string;
  onChatInputChange: (input: string) => void;
  
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
  onCreateHighlight,
  selectedColor,
  
  // Mode Selector
  isModeSelectorOpen,
  onModeSelectorClose,
  contentMode,
  inferredMode,
  modeSource,
  onModeChange,
  contentId,
  
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
  
  // Action Toolbar
  showActionToolbar,
  activeAction,
  onActionChange,
  chatInitialInput,
  onChatInputChange,
  
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
        onSubmit={onCreateHighlight}
        selectedColor={selectedColor}
        initialType={createModalType}
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
        targetId={contentId}
        targetType="CONTENT"
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
      
      {/* Action Toolbar (AI/Question) */}
      {showActionToolbar && (
        <ActionToolbar
          activeAction={activeAction}
          onActionChange={onActionChange}
          chatInitialInput={chatInitialInput}
          onChatInputChange={onChatInputChange}
        />
      )}
      
      {/* Premium Feature Block */}
      {showPremiumBlock && (
        <PremiumFeatureBlock
          featureName={featureName}
          onDismiss={onPremiumDismiss}
        />
      )}
    </>
  );
}
