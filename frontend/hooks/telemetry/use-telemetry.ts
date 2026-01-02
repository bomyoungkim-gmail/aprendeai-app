import { useCallback } from 'react';
import { telemetryClient } from '@/lib/telemetry/telemetry-client';
import { useAuthStore } from '@/stores/auth-store';
import { useContentMode } from '@/hooks/content/use-content-mode';
import { ContentMode } from '@/lib/types/content-mode';
import { v4 as uuidv4 } from 'uuid';

// Simple session ID persistence in memory (refresh page = new session/segment)
// Ideally this should be in a SessionContext or persisted in sessionStorage
let globalSessionId = '';
if (typeof window !== 'undefined') {
  globalSessionId = sessionStorage.getItem('telemetry_session_id') || uuidv4();
  sessionStorage.setItem('telemetry_session_id', globalSessionId);
}

export function useTelemetry(contentId?: string) {
  const user = useAuthStore((state) => state.user);
  const { mode: contentModeData } = useContentMode(contentId || '');

  const track = useCallback((
    eventType: string, 
    data: Record<string, any> = {}, 
    overrideContentId?: string
  ) => {
    if (!user) return; // Don't track anonymous users for now (or track with null user_id)

    const targetContentId = overrideContentId || contentId;
    if (!targetContentId && !data.contentId) {
      console.warn('[Telemetry] Tracking event without contentId currently requires one context');
      // We allow it, backend might validate.
    }

    telemetryClient.track({
      eventType,
      eventVersion: '1.0.0',
      uiPolicyVersion: '1.0.0',
      sessionId: globalSessionId,
      userId: user.id || undefined,
      contentId: targetContentId,
      mode: contentModeData || undefined, // Capture active mode if available
      data,
      timestamp: Date.now(),
    });
  }, [user, contentId, contentModeData]);

  return {
    track,
    sessionId: globalSessionId
  };
}
