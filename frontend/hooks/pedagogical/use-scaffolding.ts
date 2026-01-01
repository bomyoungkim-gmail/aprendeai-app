import { useState, useEffect, useCallback } from 'react';
import { PedagogicalConfig } from '@/lib/pedagogical/mode-configs';

interface UseScaffoldingProps {
  config: PedagogicalConfig;
  enabled: boolean;
}

/**
 * useScaffolding
 * 
 * G2.3: Manages dynamic scaffolding/fading based on user performance.
 * Adjusts UI auto-hide delay to provide more support when users struggle.
 */
export function useScaffolding({ config, enabled }: UseScaffoldingProps) {
  const [currentDelay, setCurrentDelay] = useState(config.defaultUiAutoHideDelayMs);
  const [lastScore, setLastScore] = useState<number | null>(null);

  const adjustScaffolding = useCallback((score: number) => {
    if (!enabled) return;

    setLastScore(score);

    // G2.3: Adaptive scaffolding based on performance
    if (score < 0.5) {
      // Struggling - increase UI persistence significantly
      setCurrentDelay(config.scaffoldingUiAutoHideDelayMs * 1.5);
    } else if (score < 0.7) {
      // Moderate difficulty - use standard scaffolding delay
      setCurrentDelay(config.scaffoldingUiAutoHideDelayMs);
    } else if (score >= 0.9) {
      // Mastery - fade UI faster to reduce cognitive load
      setCurrentDelay(config.defaultUiAutoHideDelayMs * 0.5);
    } else {
      // Good performance - use default delay
      setCurrentDelay(config.defaultUiAutoHideDelayMs);
    }
  }, [enabled, config]);

  // Reset to default when disabled
  useEffect(() => {
    if (!enabled) {
      setCurrentDelay(config.defaultUiAutoHideDelayMs);
    }
  }, [enabled, config.defaultUiAutoHideDelayMs]);

  return {
    currentDelay,
    lastScore,
    adjustScaffolding,
    isScaffolding: lastScore !== null && lastScore < 0.7
  };
}
