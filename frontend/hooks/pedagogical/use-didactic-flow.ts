import { useState, useCallback, useMemo } from 'react';
import { useTelemetry } from '../telemetry/use-telemetry';

export type DidacticPhase = 'PRE' | 'READING' | 'POST';

interface UseDidacticFlowProps {
  contentId: string;
  enabled: boolean;
  onComplete: () => void;
}

/**
 * useDidacticFlow
 * 
 * Manages the multi-phase reading flow for DIDACTIC mode (G2.1-G2.4).
 */
export function useDidacticFlow({ contentId, enabled, onComplete }: UseDidacticFlowProps) {
  const { track } = useTelemetry(contentId);
  const [phase, setPhase] = useState<DidacticPhase>('PRE');
  const [isActivationComplete, setIsActivationComplete] = useState(false);

  // If not enabled (other mode), always stay in READING
  const effectivePhase = enabled ? phase : 'READING';

  const goToPhase = useCallback((newPhase: DidacticPhase) => {
    if (!enabled) return;
    
    setPhase(newPhase);
    
    // H1.11: Telemetry (Phase Transition)
    track('DIDACTIC_PHASE_TRANSITION', {
      from: phase,
      to: newPhase,
      timestamp: Date.now()
    });

    if (newPhase === 'POST') {
      onComplete();
    }
  }, [enabled, phase, track, onComplete]);

  const completeActivation = useCallback(() => {
    setIsActivationComplete(true);
    goToPhase('READING');
  }, [goToPhase]);

  return {
    phase: effectivePhase,
    isActivationComplete,
    goToPhase,
    completeActivation
  };
}
