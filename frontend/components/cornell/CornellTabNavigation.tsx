/**
 * Cornell Tab Navigation Component
 * 
 * Navigation bar with 6 tabs for the Cornell sidebar.
 */

import React from 'react';
import { CORNELL_LABELS } from '@/lib/cornell/labels';

export type SidebarTab = 'toc' | 'stream' | 'analytics' | 'cues' | 'synthesis' | 'conversations';

export interface CornellTabNavigationProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
}

export function CornellTabNavigation({
  activeTab,
  onTabChange,
}: CornellTabNavigationProps) {
  const tabs: Array<{ id: SidebarTab; label: string; testId: string }> = [
    { id: 'toc', label: 'Sumário', testId: 'tab-toc' },
    { id: 'stream', label: CORNELL_LABELS.HIGHLIGHTS_NOTES, testId: 'tab-stream' },
    { id: 'cues', label: 'Favoritos', testId: 'tab-bookmarks' },
    { id: 'analytics', label: 'Analytics', testId: 'tab-analytics' },
    { id: 'synthesis', label: CORNELL_LABELS.SYNTHESIS, testId: 'tab-synthesis' },
    { id: 'conversations', label: 'Conversas', testId: 'tab-conversations' },
  ];

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          data-testid={tab.testId}
          className={`
            flex-1 px-4 py-3 text-sm font-medium transition-colors
            ${
              activeTab === tab.id
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
