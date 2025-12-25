'use client';

import { useEffect, useRef, useState } from 'react';

export interface FocusMetrics {
  interruptions: number;
  netFocusMinutes: number;
  totalMinutes: number;
  focusScore: number;
}

/**
 * Hook to track user focus during study sessions
 * Monitors window blur, tab visibility, and idle time
 */
export function useFocusTracking(enabled: boolean = true) {
  const [metrics, setMetrics] = useState<FocusMetrics>({
    interruptions: 0,
    netFocusMinutes: 0,
    totalMinutes: 0,
    focusScore: 100,
  });

  const startTimeRef = useRef<number>(Date.now());
  const lastFocusTimeRef = useRef<number>(Date.now());
  const isFocusedRef = useRef<boolean>(true);
  const focusTimeAccumulatorRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    // Reset on mount
    startTimeRef.current = Date.now();
    lastFocusTimeRef.current = Date.now();
    focusTimeAccumulatorRef.current = 0;

    const handleBlur = () => {
      if (isFocusedRef.current) {
        // Accumulate focused time before blur
        const now = Date.now();
        focusTimeAccumulatorRef.current += (now - lastFocusTimeRef.current);
        
        isFocusedRef.current = false;
        setMetrics((prev) => ({
          ...prev,
          interruptions: prev.interruptions + 1,
        }));
      }
    };

    const handleFocus = () => {
      if (!isFocusedRef.current) {
        lastFocusTimeRef.current = Date.now();
        isFocusedRef.current = true;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleBlur();
      } else {
        handleFocus();
      }
    };

    // Update metrics every 10 seconds
    const interval = setInterval(() => {
      const now = Date.now();
      const totalElapsed = now - startTimeRef.current;
      
      // Add current focused period if still focused
      let currentFocusTime = focusTimeAccumulatorRef.current;
      if (isFocusedRef.current) {
        currentFocusTime += (now - lastFocusTimeRef.current);
      }

      const totalMinutes = Math.floor(totalElapsed / (1000 * 60));
      const netFocusMinutes = Math.floor(currentFocusTime / (1000 * 60));
      const focusScore = totalMinutes > 0 ? Math.round((netFocusMinutes / totalMinutes) * 100) : 100;

      setMetrics((prev) => ({
        ...prev,
        totalMinutes,
        netFocusMinutes,
        focusScore,
      }));
    }, 10000); // Update every 10s

    // Attach listeners
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [enabled]);

  const resetMetrics = () => {
    startTimeRef.current = Date.now();
    lastFocusTimeRef.current = Date.now();
    focusTimeAccumulatorRef.current = 0;
    isFocusedRef.current = true;
    setMetrics({
      interruptions: 0,
      netFocusMinutes: 0,
      totalMinutes: 0,
      focusScore: 100,
    });
  };

  const getFinalMetrics = (): FocusMetrics => {
    const now = Date.now();
    const totalElapsed = now - startTimeRef.current;
    
    let currentFocusTime = focusTimeAccumulatorRef.current;
    if (isFocusedRef.current) {
      currentFocusTime += (now - lastFocusTimeRef.current);
    }

    const totalMinutes = Math.floor(totalElapsed / (1000 * 60));
    const netFocusMinutes = Math.floor(currentFocusTime / (1000 * 60));
    const focusScore = totalMinutes > 0 ? Math.round((netFocusMinutes / totalMinutes) * 100) : 100;

    return {
      interruptions: metrics.interruptions,
      totalMinutes: Math.max(totalMinutes, 1), // Minimum 1 minute
      netFocusMinutes,
      focusScore,
    };
  };

  return {
    metrics,
    resetMetrics,
    getFinalMetrics,
  };
}
