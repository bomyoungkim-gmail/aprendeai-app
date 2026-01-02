/**
 * Cornell Tab Navigation Component
 * 
 * Navigation bar with 5 tabs for the Cornell sidebar (SIMPLIFIED).
 */

import React from 'react';
import { SIDEBAR_TABS_CONFIG } from '@/lib/cornell/unified-config';

export type SidebarTab = 'toc' | 'stream' | 'synthesis' | 'analytics' | 'chat';

export interface CornellTabNavigationProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
}

export function CornellTabNavigation({
  activeTab,
  onTabChange,
}: CornellTabNavigationProps) {
  const tabs = Object.values(SIDEBAR_TABS_CONFIG).map(config => ({
    id: config.id as SidebarTab,
    label: config.label,
    icon: config.icon,
    testId: config.testId,
  }));

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0 overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            data-testid={tab.testId}
            className={`
              flex-1 flex flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-medium transition-colors min-w-[50px] whitespace-nowrap
              ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }
            `}
            title={tab.label}
          >
            <Icon className="w-4 h-4" />
            <span className="text-[10px]">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
