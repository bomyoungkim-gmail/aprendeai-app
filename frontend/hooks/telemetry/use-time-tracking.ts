import { useEffect, useRef, useState } from 'react';
import { useTelemetry } from './use-telemetry';

interface TimeTrackingOptions {
  heartbeatIntervalMs?: number; // Send ping every X ms (default 30s)
  inactivityThresholdMs?: number; // Stop counting after X ms of no interaction (default 60s)
}

export function useTimeTracking(contentId?: string, options: TimeTrackingOptions = {}) {
  const { track } = useTelemetry(contentId);
  const { 
    heartbeatIntervalMs = 30000, 
    inactivityThresholdMs = 60000 
  } = options;

  const totalTimeRef = useRef(0);
  const activeSegmentRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  const isActiveRef = useRef(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset on content change
    totalTimeRef.current = 0;
    activeSegmentRef.current = 0;
    lastActivityRef.current = Date.now();
    isActiveRef.current = true;
  }, [contentId]);

  useEffect(() => {
    if (!contentId) return;

    // Activity tracking loop (1s resolution)
    timerRef.current = setInterval(() => {
      const now = Date.now();
      
      // Check inactivity
      if (document.hidden) {
        isActiveRef.current = false;
      } else if (now - lastActivityRef.current > inactivityThresholdMs) {
        isActiveRef.current = false;
      } else {
        isActiveRef.current = true;
      }

      if (isActiveRef.current) {
        totalTimeRef.current += 1000;
        activeSegmentRef.current += 1000;
      }
    }, 1000);

    // Heartbeat loop - send partial updates
    heartbeatRef.current = setInterval(() => {
      if (activeSegmentRef.current > 0) {
        track('TIME_HEARTBEAT', {
          durationMs: activeSegmentRef.current,
          totalDurationMs: totalTimeRef.current,
          isActive: isActiveRef.current
        });
        activeSegmentRef.current = 0; // Reset segment accumulator
      }
    }, heartbeatIntervalMs);

    // User interaction listeners to reset activity timer
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      if (!isActiveRef.current) {
          // If waking up from inactivity, we could log a resume event
          isActiveRef.current = true;
      }
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }));
    document.addEventListener('visibilitychange', handleActivity); // Check visibility state explicitly too

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      
      activityEvents.forEach(evt => window.removeEventListener(evt, handleActivity));
      document.removeEventListener('visibilitychange', handleActivity);

      // Send final time on unmount
      if (activeSegmentRef.current > 0) {
        track('TIME_SPENT', {
            durationMs: activeSegmentRef.current,
            totalDurationMs: totalTimeRef.current,
            isFinal: true
        });
      }
    };
  }, [contentId, heartbeatIntervalMs, inactivityThresholdMs, track]);

  return { totalTimeMs: totalTimeRef.current };
}
