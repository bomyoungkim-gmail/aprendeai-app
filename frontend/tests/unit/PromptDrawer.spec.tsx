/**
 * Unit Tests - PromptDrawer Component
 * 
 * Tests drawer functionality:
 * - State transitions (collapsed/peek/expanded)
 * - Auto-minimize behavior
 * - Keyboard shortcuts
 * - Unread count badge
 * - State persistence
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PromptDrawer } from '@/components/reading/PromptDrawer';
import { SessionProvider } from '@/contexts/SessionContext';

// Mock SessionContext
const mockMessages = [
  { id: '1', role: 'user', text: 'Test message', timestamp: new Date().toISOString() },
  { id: '2', role: 'agent', text: 'Response', timestamp: new Date().toISOString() }
];

jest.mock('@/contexts/SessionContext', () => ({
  useSession: () => ({
    messages: mockMessages,
    quickReplies: [],
    sendPrompt: jest.fn(),
    isLoading: false
  })
}));

describe('PromptDrawer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should start in collapsed state by default', () => {
      const { container } = render(
        <PromptDrawer sessionId="test-123">
          <div>Content</div>
        </PromptDrawer>
      );

      expect(container.querySelector('.prompt-drawer-collapsed')).toBeInTheDocument();
      expect(screen.getByLabelText(/open chat/i)).toBeInTheDocument();
    });

    it('should show floating icon when collapsed', () => {
      render(
        <PromptDrawer sessionId="test-123">
          <div>Content</div>
        </PromptDrawer>
      );

      const floatingIcon = screen.getByLabelText(/open chat/i);
      expect(floatingIcon).toBeVisible();
      expect(floatingIcon).toHaveClass('prompt-drawer-floating-icon');
    });

    it('should load persisted state from localStorage', () => {
      localStorage.setItem('promptDrawerState', 'peek');

      const { container } = render(
        <PromptDrawer sessionId="test-123">
          <div>Content</div>
        </PromptDrawer>
      );

      expect(container.querySelector('.prompt-drawer-peek')).toBeInTheDocument();
    });
  });

  describe('State Transitions', () => {
    it('should expand when floating icon is clicked', async () => {
      const { container } = render(
        <PromptDrawer sessionId="test-123">
          <div>Content</div>
        </PromptDrawer>
      );

      const floatingIcon = screen.getByLabelText(/open chat/i);
      fireEvent.click(floatingIcon);

      await waitFor(() => {
        expect(container.querySelector('.prompt-drawer-expanded')).toBeInTheDocument();
      });
    });

    it('should show content when expanded', async () => {
      render(
        <PromptDrawer sessionId="test-123">
          <div data-testid="drawer-content">Test Content</div>
        </PromptDrawer>
      );

      fireEvent.click(screen.getByLabelText(/open chat/i));

      await waitFor(() => {
        expect(screen.getByTestId('drawer-content')).toBeVisible();
      });
    });

    it('should minimize when minimize button is clicked', async () => {
      const { container } = render(
        <PromptDrawer sessionId="test-123">
          <div>Content</div>
        </PromptDrawer>
      );

      // Expand first
      fireEvent.click(screen.getByLabelText(/open chat/i));

      await waitFor(() => {
        expect(container.querySelector('.prompt-drawer-expanded')).toBeInTheDocument();
      });

      // Then minimize
      const minimizeBtn = screen.getByLabelText(/minimize/i);
      fireEvent.click(minimizeBtn);

      await waitFor(() => {
        expect(container.querySelector('.prompt-drawer-peek')).toBeInTheDocument();
      });
    });

    it('should collapse when close button is clicked', async () => {
      const { container } = render(
        <PromptDrawer sessionId="test-123">
          <div>Content</div>
        </PromptDrawer>
      );

      // Expand first
      fireEvent.click(screen.getByLabelText(/open chat/i));

      await waitFor(() => {
        expect(container.querySelector('.prompt-drawer-expanded')).toBeInTheDocument();
      });

      // Then close
      const closeBtn = screen.getByLabelText(/close drawer/i);
      fireEvent.click(closeBtn);

      await waitFor(() => {
        expect(container.querySelector('.prompt-drawer-collapsed')).toBeInTheDocument();
      });
    });

    it('should expand from peek when peek area is clicked', async () => {
      const { container } = render(
        <PromptDrawer sessionId="test-123">
          <div>Content</div>
        </PromptDrawer>
      );

      // Set to peek state
      fireEvent.click(screen.getByLabelText(/open chat/i));
      await waitFor(() => expect(container.querySelector('.prompt-drawer-expanded')).toBeInTheDocument());

      fireEvent.click(screen.getByLabelText(/minimize/i));
      await waitFor(() => expect(container.querySelector('.prompt-drawer-peek')).toBeInTheDocument());

      // Click peek to expand
      const peekArea = container.querySelector('.prompt-drawer-peek');
      fireEvent.click(peekArea!);

      await waitFor(() => {
        expect(container.querySelector('.prompt-drawer-expanded')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should toggle drawer with Cmd/Ctrl+D', async () => {
      const { container } = render(
        <PromptDrawer sessionId="test-123">
          <div>Content</div>
        </PromptDrawer>
      );

      // Start collapsed
      expect(container.querySelector('.prompt-drawer-collapsed')).toBeInTheDocument();

      // Press Ctrl+D
      fireEvent.keyDown(window, { key: 'd', ctrlKey: true });

      await waitFor(() => {
        expect(container.querySelector('.prompt-drawer-expanded')).toBeInTheDocument();
      });
    });

    it('should minimize with Escape key when expanded', async () => {
      const { container } = render(
        <PromptDrawer sessionId="test-123">
          <div>Content</div>
        </PromptDrawer>
      );

      // Expand
      fireEvent.click(screen.getByLabelText(/open chat/i));
      await waitFor(() => expect(container.querySelector('.prompt-drawer-expanded')).toBeInTheDocument());

      // Press Escape
      fireEvent.keyDown(window, { key: 'Escape' });

      await waitFor(() => {
        expect(container.querySelector('.prompt-drawer-peek')).toBeInTheDocument();
      });
    });
  });

  describe('Auto-minimize', () => {
    it('should auto-minimize after 60 seconds of inactivity', async () => {
      jest.useFakeTimers();

      const { container } = render(
        <PromptDrawer sessionId="test-123">
          <div>Content</div>
        </PromptDrawer>
      );

      // Expand
      fireEvent.click(screen.getByLabelText(/open chat/i));
      await waitFor(() => expect(container.querySelector('.prompt-drawer-expanded')).toBeInTheDocument());

      // Fast-forward 60 seconds
      jest.advanceTimersByTime(60000);

      await waitFor(() => {
        expect(container.querySelector('.prompt-drawer-peek')).toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('should not auto-minimize if user is active', async () => {
      jest.useFakeTimers();

      const { container } = render(
        <PromptDrawer sessionId="test-123">
          <div>Content</div>
        </PromptDrawer>
      );

      // Expand
      fireEvent.click(screen.getByLabelText(/open chat/i));
      await waitFor(() => expect(container.querySelector('.prompt-drawer-expanded')).toBeInTheDocument());

      // Simulate activity after 30 seconds
      jest.advanceTimersByTime(30000);
      fireEvent.click(container.querySelector('.drawer-content')!);

      // Fast-forward another 30 seconds (total 60)
      jest.advanceTimersByTime(30000);

      // Should still be expanded (timer reset on activity)
      expect(container.querySelector('.prompt-drawer-expanded')).toBeInTheDocument();

      jest.useRealTimers();
    });
  });

  describe('Unread Count', () => {
    it('should show unread badge on floating icon', () => {
      // TODO: Mock messages with newer timestamps
      render(
        <PromptDrawer sessionId="test-123">
          <div>Content</div>
        </PromptDrawer>
      );

      const badge = screen.queryByClassName('unread-badge');
      // Badge should appear if there are unread messages
      // This requires proper message timestamp logic
    });

    it('should clear unread count when drawer is expanded', async () => {
      const { container } = render(
        <PromptDrawer sessionId="test-123">
          <div>Content</div>
        </PromptDrawer>
      );

      // Expand drawer
      fireEvent.click(screen.getByLabelText(/open chat/i));

      await waitFor(() => {
        const badge = container.querySelector('.unread-badge');
        expect(badge).not.toBeInTheDocument();
      });
    });
  });

  describe('State Persistence', () => {
    it('should persist state to localStorage on change', async () => {
      const { container } = render(
        <PromptDrawer sessionId="test-123">
          <div>Content</div>
        </PromptDrawer>
      );

      // Expand
      fireEvent.click(screen.getByLabelText(/open chat/i));

      await waitFor(() => {
        expect(localStorage.getItem('promptDrawerState')).toBe('expanded');
      });
    });

    it('should persist peek state', async () => {
      const { container } = render(
        <PromptDrawer sessionId="test-123">
          <div>Content</div>
        </PromptDrawer>
      );

      // Expand then minimize
      fireEvent.click(screen.getByLabelText(/open chat/i));
      await waitFor(() => expect(container.querySelector('.prompt-drawer-expanded')).toBeInTheDocument());

      fireEvent.click(screen.getByLabelText(/minimize/i));

      await waitFor(() => {
        expect(localStorage.getItem('promptDrawerState')).toBe('peek');
      });
    });
  });
});
