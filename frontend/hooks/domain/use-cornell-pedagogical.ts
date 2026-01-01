/**
 * Cornell Pedagogical Domain Hook
 * 
 * Manages pedagogical state including flow detection, confusion detection,
 * interventions, scaffolding, and didactic flow phases.
 * 
 * This hook extracts pedagogical logic from ModernCornellLayout.
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useFlowDetection } from '@/hooks/heuristics/use-flow-detection';
import { useInterventions } from '@/hooks/pedagogical/use-interventions';
import { useDidacticFlow } from '@/hooks/pedagogical/use-didactic-flow';
import { useScaffolding } from '@/hooks/pedagogical/use-scaffolding';
import { useSuggestions } from '@/hooks/cornell/use-suggestions';
import { MODE_CONFIGS } from '@/lib/config/mode-config';
import { MODE_PEDAGOGICAL_CONFIGS } from '@/lib/pedagogical/mode-configs';
import { ContentMode } from '@/lib/types/content-mode';

export interface Suggestion {
  id: string;
  type: string;
  message: string;
  action?: () => void;
}

export interface Checkpoint {
  type: 'CHECKPOINT' | 'SCAFFOLDING';
  isBlocking: boolean;
}

export interface UseCornellPedagogicalReturn {
  // Flow State
  isInFlow: boolean;
  
  // Interventions
  shouldShowIntervention: () => boolean;
  handleInterventionShown: (type: string) => void;
  handleInterventionDismissed: (type: string) => void;
  handleInterventionCompleted: (type: string) => void;
  
  // Didactic Flow
  didacticPhase: 'PRE' | 'DURING' | 'POST' | null;
  completeActivation: () => void;
  
  // Scaffolding
  currentDelay: number | null;
  adjustScaffolding: (success: boolean) => void;
  isScaffolding: boolean;
  
  // Checkpoints
  activeCheckpoint: Checkpoint | null;
  setActiveCheckpoint: (checkpoint: Checkpoint | null) => void;
  
  // Suggestions
  suggestions: Suggestion[];
  acceptSuggestion: (id: string) => void;
  dismissSuggestion: (id: string) => void;
}

/**
 * Hook for managing Cornell pedagogical state
 */
export function useCornellPedagogical(
  contentId: string,
  contentMode: ContentMode,
  currentPage: number = 1,
  isUiVisible: boolean = true,
  onTrack?: (event: string, data?: any) => void
): UseCornellPedagogicalReturn {
  // Flow detection
  const { isInFlow } = useFlowDetection({
    contentId,
    modeConfig: MODE_CONFIGS[contentMode],
    currentPage,
    isUiVisible,
  });
  
  // Interventions
  const {
    shouldShow,
    handleInterventionShown,
    handleInterventionDismissed,
    handleInterventionCompleted,
    config: pedagogicalConfig
  } = useInterventions({
    contentId,
    mode: contentMode,
    isInFlow
  });
  
  // Didactic flow
  const { phase, completeActivation } = useDidacticFlow({
    contentId,
    enabled: contentMode === ContentMode.DIDACTIC,
    onComplete: () => {
      toast.success('Você concluiu o fluxo didático desta leitura!');
    }
  });
  
  // Scaffolding
  const { currentDelay, adjustScaffolding, isScaffolding } = useScaffolding({
    config: pedagogicalConfig || MODE_PEDAGOGICAL_CONFIGS[ContentMode.NARRATIVE],
    enabled: contentMode === ContentMode.DIDACTIC
  });
  
  // Active checkpoint state
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null);
  
  // Auto-trigger interventions
  useEffect(() => {
    if (activeCheckpoint) return; // Don't trigger if one is already active
    
    const interval = setInterval(() => {
      if (shouldShow()) {
        const isDidactic = contentMode === ContentMode.DIDACTIC;
        setActiveCheckpoint({
          type: 'CHECKPOINT',
          isBlocking: isDidactic // Only block in Didactic/Scientific
        });
        handleInterventionShown('CHECKPOINT');
      }
    }, 10000); // Check every 10s
    
    return () => clearInterval(interval);
  }, [shouldShow, activeCheckpoint, contentMode, handleInterventionShown]);
  
  // Pre-reading activation phase
  useEffect(() => {
    if (contentMode === ContentMode.DIDACTIC && phase === 'PRE' && !activeCheckpoint) {
      setActiveCheckpoint({
        type: 'CHECKPOINT',
        isBlocking: true
      });
      handleInterventionShown('CHECKPOINT');
    }
  }, [contentMode, phase, activeCheckpoint, handleInterventionShown]);
  
  // Scaffolding tracking
  useEffect(() => {
    if (pedagogicalConfig && currentDelay) {
      if (isScaffolding) {
        onTrack?.('SCAFFOLDING_ACTIVE', { 
          delay: currentDelay,
          mode: contentMode 
        });
      }
    }
  }, [currentDelay, isScaffolding, pedagogicalConfig, contentMode, onTrack]);
  
  // AI Suggestions
  const { suggestions, acceptSuggestion, dismissSuggestion } = useSuggestions(contentId);
  
  return {
    // Flow State
    isInFlow,
    
    // Interventions
    shouldShowIntervention: shouldShow,
    handleInterventionShown,
    handleInterventionDismissed,
    handleInterventionCompleted,
    
    // Didactic Flow
    didacticPhase: phase,
    completeActivation,
    
    // Scaffolding
    currentDelay,
    adjustScaffolding,
    isScaffolding,
    
    // Checkpoints
    activeCheckpoint,
    setActiveCheckpoint,
    
    // Suggestions
    suggestions: suggestions || [],
    acceptSuggestion,
    dismissSuggestion,
  };
}
