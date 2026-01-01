/**
 * Cornell Sidebar Component
 * 
 * Orchestrates all sidebar tabs and content.
 */

import React from 'react';
import { Menu, X } from 'lucide-react';
import { CornellTabNavigation, type SidebarTab } from './CornellTabNavigation';
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
}: CornellSidebarProps) {
  return (
    <aside
      className={`
        fixed lg:relative inset-y-0 right-0 z-40
        w-full sm:w-96 lg:w-[30%] max-w-md
        bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        flex flex-col
      `}
    >
      {/* Mobile toggle button */}
      <div className="lg:hidden absolute top-4 left-4 z-50">
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Menu"
        >
          {isOpen ? (
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* Tab Navigation */}
      <CornellTabNavigation 
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
      
      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'toc' && <CornellTocTab {...tocProps} />}
        {activeTab === 'analytics' && <CornellAnalyticsTab {...analyticsProps} />}
        {activeTab === 'cues' && <CornellBookmarksTab {...bookmarksProps} />}
        {activeTab === 'stream' && <CornellStreamTab {...streamProps} />}
        {activeTab === 'synthesis' && <CornellSynthesisTab {...synthesisProps} />}
        {activeTab === 'conversations' && <CornellConversationsTab {...conversationsProps} />}
      </div>
    </aside>
  );
}
