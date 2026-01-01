import { useState, useEffect, useCallback, useRef } from 'react';
import { ModeConfig } from '@/lib/config/mode-config';
import { useTelemetry } from '../telemetry/use-telemetry';

interface UseUiBehaviorProps {
  modeConfig: ModeConfig | null;
  contentId: string;
}

export function useUiBehavior({ modeConfig, contentId }: UseUiBehaviorProps) {
  const [isVisible, setIsVisible] = useState(true); // Default visible
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { track } = useTelemetry(contentId);

  const showUi = useCallback((trigger: string) => {
    setIsVisible(true);
    if (!isVisible) {
       track('UI_VISIBILITY_CHANGE', { visible: true, trigger });
    }
  }, [isVisible, track]);

  const hideUi = useCallback((trigger: string) => {
    setIsVisible(false);
    if (isVisible) {
       track('UI_VISIBILITY_CHANGE', { visible: false, trigger });
    }
  }, [isVisible, track]);

  const resetTimeout = useCallback(() => {
    if (!modeConfig) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only auto-hide if delay > 0
    if (modeConfig.uiAutoHideDelay > 0) {
      timeoutRef.current = setTimeout(() => {
        hideUi('AUTO_HIDE');
      }, modeConfig.uiAutoHideDelay);
    }
  }, [modeConfig, hideUi]);

  // Handle User Activity
  useEffect(() => {
    if (!modeConfig) return;

    const handleActivity = () => {
      if (!isVisible) {
         // Optionally show on activity? 
         // Most immersive readers DON'T show on simple mouse move, 
         // only on specific gestures (top hover, click).
         // But for now, let's keep it simple: Activity keeps it visible IF it is visible.
      }
      resetTimeout();
    };

    // If UI is visible, specific events reset the timer
    if (isVisible) {
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('touchstart', handleActivity);
        window.addEventListener('scroll', handleActivity);
    }

    return () => {
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        window.removeEventListener('touchstart', handleActivity);
        window.removeEventListener('scroll', handleActivity);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isVisible, modeConfig, resetTimeout]);

  // Initial setup when mode loads
  useEffect(() => {
    if (modeConfig) {
        resetTimeout();
    }
  }, [modeConfig, resetTimeout]);

  const toggleUi = () => {
    if (isVisible) hideUi('MANUAL_TOGGLE');
    else showUi('MANUAL_TOGGLE');
  };

  return { 
    isVisible, 
    showUi, 
    hideUi, 
    toggleUi,
    resetAutoHider: resetTimeout 
  };
}
