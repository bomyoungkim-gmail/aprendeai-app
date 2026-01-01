import { useState, useMemo, useCallback, useEffect } from 'react';
import { InterventionManager, InterventionState, InterventionType } from '@/lib/pedagogical/intervention-manager';
import { MODE_PEDAGOGICAL_CONFIGS, ContentMode } from '@/lib/pedagogical/mode-configs';
import { useTelemetry } from '../telemetry/use-telemetry';

interface UseInterventionsProps {
  contentId: string;
  mode: ContentMode;
  isInFlow: boolean;
}

const STORAGE_KEY_PREFIX = 'pedagogical_interventions_';

/**
 * useInterventions
 * 
 * Hook to manage pedagogical interventions.
 * E1.1-E1.4: Orchestrates when to interrupt based on flow, cooldowns, and session limits.
 */
export function useInterventions({ contentId, mode, isInFlow }: UseInterventionsProps) {
  const { track } = useTelemetry(contentId);
  const config = useMemo(() => MODE_PEDAGOGICAL_CONFIGS[mode], [mode]);
  
  // Storage key for the current session and content
  const storageKey = useMemo(() => `${STORAGE_KEY_PREFIX}${contentId}`, [contentId]);

  // Load initial state from session storage
  const [state, setState] = useState<InterventionState>(() => {
    if (typeof window === 'undefined') return { lastInterventionTime: 0, interventionCount: 0, dismissalCount: 0, aggressivenessFactor: 1.0 };
    const saved = sessionStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : { lastInterventionTime: 0, interventionCount: 0, dismissalCount: 0, aggressivenessFactor: 1.0 };
  });

  // Persistent instance of the manager
  const manager = useMemo(() => new InterventionManager(config, state), [config, state]);

  // Save state to session storage whenever it changes
  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, storageKey]);

  /**
   * Checks if an intervention should be shown right now.
   */
  const shouldShow = useCallback(() => {
    return manager.shouldShowIntervention(isInFlow);
  }, [manager, isInFlow]);

  /**
   * Call this when an intervention is successfully displayed to the user.
   */
  const handleInterventionShown = useCallback((type: InterventionType) => {
    const newState = manager.recordIntervention();
    setState(newState);
    
    // H1.11: Telemetry (Intervention Shown)
    track('INTERVENTION_SHOWN', {
      type,
      mode,
      count: newState.interventionCount,
      aggressiveness: newState.aggressivenessFactor
    });
  }, [manager, mode, track]);

  /**
   * Call this when the user dismisses an intervention without acting on it.
   */
  const handleInterventionDismissed = useCallback((type: InterventionType) => {
    const newState = manager.recordDismissal();
    setState(newState);
    
    // H1.11: Telemetry (Intervention Dismissed)
    track('INTERVENTION_DISMISSED', {
      type,
      mode,
      dismissalCount: newState.dismissalCount,
      newAggressiveness: newState.aggressivenessFactor
    });
  }, [manager, mode, track]);

  /**
   * Call this when the user successfully engages with/completes an intervention.
   */
  const handleInterventionCompleted = useCallback((type: InterventionType, results?: any) => {
    const newState = manager.recordPositiveEngagement();
    setState(newState);
    
    // H1.11: Telemetry (Intervention Acted/Completed)
    track('INTERVENTION_ACTED', {
      type,
      mode,
      results
    });
  }, [manager, mode, track]);

  return {
    shouldShow,
    handleInterventionShown,
    handleInterventionDismissed,
    handleInterventionCompleted,
    interventionState: state,
    config
  };
}
