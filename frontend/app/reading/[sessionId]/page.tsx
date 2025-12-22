'use client';

import { SessionProvider } from '@/contexts/SessionContext';
import { CornellLayout } from '@/components/cornell/CornellLayout';
import { PromptConsole } from '@/components/reading/PromptConsole';
import { PromptDrawer } from '@/components/reading/PromptDrawer';
import '@/components/reading/prompt-drawer.css';

interface ReadingSessionPageProps {
  params: {
    sessionId: string;
  };
}

/**
 * Reading Session Page - Cornell-Centric Layout
 * 
 * Phase 3 Enhanced: Collapsible drawer for chat
 * - Cornell gets 65-100% width (vs 50% before)
 * - Chat accessible via drawer (collapsed/peek/expanded)
 * - Auto-minimizes after inactivity
 * - Keyboard shortcuts supported
 */
export default function ReadingSessionPage({ params }: ReadingSessionPageProps) {
  const { sessionId } = params;

  return (
    <SessionProvider sessionId={sessionId}>
      <div className="reading-session-container">
        {/* Main Content: Cornell Layout (takes all available space) */}
        <div className="cornell-container">
          <CornellLayout />
        </div>

        {/* Collapsible Drawer: Prompt Console */}
        <PromptDrawer sessionId={sessionId}>
          <PromptConsole sessionId={sessionId} />
        </PromptDrawer>
      </div>
    </SessionProvider>
  );
}
