/**
 * Cornell Conversations Tab Component
 * 
 * Displays thread panel for conversations.
 */

import React from 'react';
import { ThreadPanel } from '../../sharing/ThreadPanel';
import { ShareContextType } from '@/lib/types/sharing';

export interface CornellConversationsTabProps {
  contentId: string;
  threadContext: { type: ShareContextType; id: string };
}

export function CornellConversationsTab({
  contentId,
  threadContext,
}: CornellConversationsTabProps) {
  return (
    <ThreadPanel
      query={{
        targetId: contentId,
        targetType: 'CONTENT' as any,
        contextId: threadContext.id,
        contextType: threadContext.type,
      }}
    />
  );
}
