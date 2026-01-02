import { useEffect, useRef, useState } from 'react';
import { useTelemetry } from './use-telemetry';

interface ScrollTrackingOptions {
  thresholds?: number[]; // e.g. [25, 50, 75, 90, 100]
  throttleMs?: number;
}

export function useScrollTracking(contentId?: string, options: ScrollTrackingOptions = {}) {
  const { track } = useTelemetry(contentId);
  const { thresholds = [25, 50, 75, 90, 100], throttleMs = 200 } = options;
  
  // Keep track of max depth reached to avoid duplicate events and track progress
  const maxDepthRef = useRef(0);
  const trackedThresholdsRef = useRef<Set<number>>(new Set());
  const tickRef = useRef<boolean>(false);

  useEffect(() => {
    // Reset tracking when content changes
    maxDepthRef.current = 0;
    trackedThresholdsRef.current.clear();
  }, [contentId]);

  useEffect(() => {
    if (!contentId) return;

    const handleScroll = () => {
      if (tickRef.current) return;

      tickRef.current = true;
      setTimeout(() => {
        // Calculate scroll percentage
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const winHeight = document.documentElement.clientHeight;
        
        if (docHeight <= 0) {
            tickRef.current = false;
            return;
        }

        const rawPercent = (scrollTop / docHeight) * 100;
        const percent = Math.min(100, Math.max(0, rawPercent));

        // Update max depth
        if (percent > maxDepthRef.current) {
          maxDepthRef.current = percent;
        }

        // Check thresholds
        thresholds.forEach(threshold => {
          if (percent >= threshold && !trackedThresholdsRef.current.has(threshold)) {
            trackedThresholdsRef.current.add(threshold);
            track('SCROLL_DEPTH', {
              depth: threshold,
              actualPercent: Math.round(percent),
              maxDepth: Math.round(maxDepthRef.current)
            });
          }
        });

        tickRef.current = false;
      }, throttleMs);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Cleanup: Track final max depth on unmount/change
    return () => {
      window.removeEventListener('scroll', handleScroll);
      // Optional: Track exit depth? 
      // track('SCROLL_EXIT', { maxDepth: Math.round(maxDepthRef.current) }); 
      // Often better handled by session_end summary logic, but useful here too.
    };
  }, [contentId, thresholds, throttleMs, track]);

  return { maxDepth: maxDepthRef.current };
}
