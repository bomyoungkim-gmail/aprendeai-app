/**
 * Cornell Conversations Tab Component
 * 
 * Displays thread panel for conversations.
 */

import React, { useState } from 'react';
import { ThreadPanel } from '../../sharing/ThreadPanel';
import { AIChatPanel } from '../AIChatPanel';
import { ShareContextType } from '@/lib/types/sharing';
import { Bot, Users } from 'lucide-react';
import { useCornellLayout } from '@/contexts/CornellLayoutContext';



export interface CornellConversationsTabProps {
  contentId: string;
  threadContext: { type: ShareContextType; id: string };
}

type SubTab = 'AI' | 'GROUP';

export function CornellConversationsTab({
  contentId,
  threadContext,
}: CornellConversationsTabProps) {
  const { aiContext } = useCornellLayout();
  // Determine if we have a group context
  const hasGroupContext = threadContext.type === ShareContextType.FAMILY || 
                         threadContext.type === ShareContextType.CLASSROOM ||
                         threadContext.type === ShareContextType.STUDY_GROUP;

  // Default to AI always (user can toggle to Group if needed)
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('AI');

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Toggle Header (Only if Group Context exists) */}
      {hasGroupContext && (
        <div className="flex p-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex w-full bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveSubTab('AI')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeSubTab === 'AI' 
                  ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              Educator
            </button>
            <button
              onClick={() => setActiveSubTab('GROUP')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeSubTab === 'GROUP' 
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Grupo
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeSubTab === 'AI' ? (
          <AIChatPanel 
            className="absolute inset-0" 
            selection={aiContext}
            initialInput={''} // SCRIPT 07: Clear input, let quick replies drive interaction
            initialQuickReplies={aiContext ? ['Analisar oração/sentença'] : undefined} // SCRIPT 07: Suggest analysis when selection is active
          />
        ) : (
          <ThreadPanel
            query={{
              targetId: contentId,
              targetType: 'CONTENT' as any, // Pre-existing: ThreadPanel type needs extension for content targets
              contextId: threadContext.id,
              contextType: threadContext.type,
            }}
          />
        )}
      </div>
    </div>
  );
}
