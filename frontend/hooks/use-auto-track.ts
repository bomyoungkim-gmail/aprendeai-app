'use client';

import { useEffect, useRef } from 'react';
import { useTrackActivity } from '@/hooks/use-activity';

/**
 * Auto-track reading activity
 * Tracks every 30 seconds while user is reading
 */
export function useAutoTrackReading(contentId: string) {
  const { mutate: trackActivity } = useTrackActivity();
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!contentId) return;

    // Track immediately on mount
    trackActivity({ type: 'read', minutes: 1 });

    // Track every 30 seconds
    intervalRef.current = setInterval(() => {
      trackActivity({ type: 'read', minutes: 1 });
    }, 30 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [contentId, trackActivity]);
}

/**
 * Auto-track video watch time
 */
export function useAutoTrackVideo(contentId: string, isPlaying: boolean) {
  const { mutate: trackActivity } = useTrackActivity();
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!contentId || !isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      return;
    }

    // Track every minute while playing
    intervalRef.current = setInterval(() => {
      trackActivity({ type: 'study', minutes: 1 });
    }, 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [contentId, isPlaying, trackActivity]);
}

/**
 * Auto-track annotation creation
 */
export function useAutoTrackAnnotation() {
  const { mutate: trackActivity } = useTrackActivity();

  const trackAnnotation = () => {
    trackActivity({ type: 'annotation', minutes: 1 });
  };

  return trackAnnotation;
}

/**
 * Auto-track study session
 */
export function useAutoTrackSession(sessionId: string | null, isActive: boolean) {
  const { mutate: trackActivity } = useTrackActivity();
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!sessionId || !isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      return;
    }

    // Track every 5 minutes during study session
    intervalRef.current = setInterval(() => {
      trackActivity({ type: 'session', minutes: 5 });
    }, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sessionId, isActive, trackActivity]);
}
