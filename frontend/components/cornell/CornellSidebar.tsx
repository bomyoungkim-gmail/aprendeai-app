/**
 * Cornell Sidebar Component
 * 
 * Orchestrates all sidebar tabs and content.
 */

import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { CornellTabNavigation, type SidebarTab } from './CornellTabNavigation';
import { SIDEBAR_TABS_CONFIG } from '@/lib/cornell/unified-config';
import { CornellTocTab, type CornellTocTabProps } from './tabs/CornellTocTab';
import { CornellAnalyticsTab, type CornellAnalyticsTabProps } from './tabs/CornellAnalyticsTab';
import { CornellBookmarksTab, type CornellBookmarksTabProps } from './tabs/CornellBookmarksTab';
import { CornellStreamTab, type CornellStreamTabProps } from './tabs/CornellStreamTab';
import { CornellCuesTab, type CornellCuesTabProps } from './tabs/CornellCuesTab';
import { CornellSynthesisTab, type CornellSynthesisTabProps } from './tabs/CornellSynthesisTab';
import { CornellConversationsTab, type CornellConversationsTabProps } from './tabs/CornellConversationsTab';

export interface CornellSidebarProps {
  // Sidebar state
  isOpen: boolean;
  onToggle: () => void;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  
  // Tab props
  tocProps: CornellTocTabProps;
  analyticsProps: CornellAnalyticsTabProps;
  bookmarksProps: CornellBookmarksTabProps;
  streamProps: CornellStreamTabProps;
  cuesProps: CornellCuesTabProps;
  synthesisProps: CornellSynthesisTabProps;
  conversationsProps: CornellConversationsTabProps;
  containerRef?: React.RefObject<HTMLElement>;
}

export function CornellSidebar({
  isOpen,
  onToggle,
  activeTab,
  onTabChange,
  tocProps,
  analyticsProps,
  bookmarksProps,
  streamProps,
  cuesProps,
  synthesisProps,
  conversationsProps,
  containerRef,
}: CornellSidebarProps) {
  return (
    <aside
      ref={containerRef}
      className={`
        border-gray-200 dark:border-gray-700
        bg-white dark:bg-gray-800
        flex flex-col overflow-hidden
        transition-all duration-300 ease-in-out
        z-50

        /* Mobile: Bottom Drawer (50% height) */
        fixed bottom-0 left-0 w-full h-[50vh]
        border-t rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)]
        ${isOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'}

        /* Desktop: Right Sidebar (Full height) */
        md:relative md:inset-auto md:h-full md:shadow-none
        md:border-t-0 md:border-l md:rounded-none
        md:translate-y-0 md:pointer-events-auto
        ${isOpen ? 'md:w-[380px]' : 'md:w-16'}
      `}
    >
      {/* Collapse/Expand Button */}
      <div className="flex justify-end p-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onToggle}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title={isOpen ? "Colapsar sidebar" : "Expandir sidebar"}
        >
          {isOpen ? (
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          )}
        </button>
      </div>

      {isOpen ? (
        <>
          {/* Tab Navigation */}
          <CornellTabNavigation 
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
          
          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'toc' && <CornellTocTab {...tocProps} />}
            {activeTab === 'stream' && <CornellStreamTab {...streamProps} />}
            {activeTab === 'synthesis' && <CornellSynthesisTab {...synthesisProps} />}
            {activeTab === 'analytics' && <CornellAnalyticsTab {...analyticsProps} />}
            {activeTab === 'chat' && <CornellConversationsTab {...conversationsProps} />}
          </div>
        </>
      ) : (
        /* Icon-only navigation when collapsed */
        <div className="flex flex-col items-center gap-4 py-4">
          {Object.values(SIDEBAR_TABS_CONFIG).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id as SidebarTab);
                  onToggle(); // Auto-expand when clicking icon
                }}
                className={`
                  p-2 rounded-lg transition-colors
                  ${activeTab === tab.id
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
                title={tab.label}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
