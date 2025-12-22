'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/contexts/SessionContext';

export type DrawerState = 'collapsed' | 'peek' | 'expanded';

interface PromptDrawerProps {
  children: React.ReactNode;
  sessionId: string;
}

/**
 * PromptDrawer - Collapsible drawer for PromptConsole
 * 
 * States:
 * - collapsed: Hidden (Cornell 100%)
 * - peek: Shows icon + unread count (Cornell 93%)
 * - expanded: Full chat interface (Cornell 65%)
 * 
 * Features:
 * - Auto-minimize after 60s inactivity
 * - Keyboard shortcuts (Cmd/Ctrl + D)
 * - State persistence (localStorage)
 * - Unread message count
 */
export function PromptDrawer({ children, sessionId }: PromptDrawerProps) {
  const { messages } = useSession();
  
  // Load persisted state or default to collapsed
  const [drawerState, setDrawerState] = useState<DrawerState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('promptDrawerState');
      return (saved as DrawerState) || 'collapsed';
    }
    return 'collapsed';
  });
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastInteraction, setLastInteraction] = useState(Date.now());

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('promptDrawerState', drawerState);
  }, [drawerState]);

  // Count unread messages (agent messages when drawer is collapsed/peek)
  useEffect(() => {
    if (drawerState !== 'expanded') {
      const agentMessages = messages.filter(m => m.role === 'agent');
      const newMessages = agentMessages.filter(m => 
        new Date(m.timestamp).getTime() > lastInteraction
      );
      setUnreadCount(newMessages.length);
    } else {
      setUnreadCount(0);
    }
  }, [messages, drawerState, lastInteraction]);

  // Auto-minimize after 60 seconds of inactivity
  useEffect(() => {
    if (drawerState === 'expanded') {
      const timer = setTimeout(() => {
        setDrawerState('peek');
      }, 60000); // 60 seconds

      return () => clearTimeout(timer);
    }
  }, [drawerState, lastInteraction]);

  // Keyboard shortcut: Cmd/Ctrl + D to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        handleToggle();
      }
      
      // Escape to collapse
      if (e.key === 'Escape' && drawerState === 'expanded') {
        setDrawerState('peek');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerState]);

  const handleToggle = useCallback(() => {
    setLastInteraction(Date.now());
    
    if (drawerState === 'collapsed') {
      setDrawerState('expanded');
    } else if (drawerState === 'peek') {
      setDrawerState('expanded');
    } else {
      setDrawerState('peek');
    }
  }, [drawerState]);

  const handleExpand = useCallback(() => {
    setLastInteraction(Date.now());
    setDrawerState('expanded');
    setUnreadCount(0);
  }, []);

  const handleCollapse = useCallback(() => {
    setLastInteraction(Date.now());
    setDrawerState('collapsed');
  }, []);

  const handlePeek = useCallback(() => {
    setLastInteraction(Date.now());
    setDrawerState('peek');
  }, []);

  // Update interaction time on any activity in drawer
  const handleActivity = useCallback(() => {
    setLastInteraction(Date.now());
  }, []);

  return (
    <>
      {/* Floating Icon (when collapsed) */}
      {drawerState === 'collapsed' && (
        <button
          onClick={handleExpand}
          className="prompt-drawer-floating-icon"
          aria-label="Open chat with educator"
        >
          <span className="icon">💬</span>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </button>
      )}

      {/* Drawer Container */}
      <div
        className={`prompt-drawer prompt-drawer-${drawerState}`}
        onClick={handleActivity}
        onKeyDown={handleActivity}
      >
        {/* Peek View (icon + unread) */}
        {drawerState === 'peek' && (
          <div className="prompt-drawer-peek" onClick={handleExpand}>
            <div className="peek-icon">💬</div>
            {unreadCount > 0 && (
              <div className="peek-unread">
                <span className="peek-count">{unreadCount}</span>
              </div>
            )}
            <div className="peek-hint">
              <span>Click to expand</span>
            </div>
          </div>
        )}

        {/* Expanded View (full chat) */}
        {drawerState === 'expanded' && (
          <div className="prompt-drawer-expanded">
            <div className="drawer-header">
              <h3>Chat com Educador</h3>
              <div className="drawer-actions">
                <button
                  onClick={handlePeek}
                  className="drawer-minimize"
                  aria-label="Minimize drawer"
                  title="Minimize (keeps peeking)"
                >
                  <span>−</span>
                </button>
                <button
                  onClick={handleCollapse}
                  className="drawer-close"
                  aria-label="Close drawer"
                  title="Close completely"
                >
                  <span>✕</span>
                </button>
              </div>
            </div>
            
            <div className="drawer-content">
              {children}
            </div>
            
            <div className="drawer-hint">
              <kbd>Cmd/Ctrl + D</kbd> to toggle • <kbd>Esc</kbd> to minimize
            </div>
          </div>
        )}
      </div>

      {/* Overlay (for mobile, click outside to close) */}
      {drawerState === 'expanded' && (
        <div
          className="prompt-drawer-overlay"
          onClick={handlePeek}
          aria-hidden="true"
        />
      )}
    </>
  );
}
