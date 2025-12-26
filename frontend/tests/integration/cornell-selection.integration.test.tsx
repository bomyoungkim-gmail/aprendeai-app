import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModernCornellLayout } from '@/components/cornell/ModernCornellLayout';
import * as useSuggestionsHook from '@/hooks/cornell/useSuggestions';

vi.mock('@/hooks/cornell/useSuggestions');

describe('ModernCornellLayout - Text Selection Integration', () => {
  const mockProps = {
    title: 'Test Document',
    contentId: 'content-123',
    mode: 'view' as const,
    onModeToggle: vi.fn(),
    saveStatus: 'saved' as const,
    viewer: <div data-testid="pdf-viewer">PDF Content with text to select</div>,
    streamItems: [],
    cues: [],
    onCuesChange: vi.fn(),
    summary: '',
    onSummaryChange: vi.fn(),
  };

  const mockUseSuggestions = {
    suggestions: [],
    acceptSuggestion: vi.fn(),
    dismissSuggestion: vi.fn(),
    dismissAll: vi.fn(),
    hasUnseenSuggestions: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSuggestionsHook.useSuggestions).mockReturnValue(mockUseSuggestions);
  });

  it('should show TextSelectionMenu when text is selected', async () => {
    render(<ModernCornellLayout {...mockProps} />);

    // Mock window.getSelection
    const mockGetSelection = vi.fn().mockReturnValue({
      toString: () => 'Selected Text',
      trim: () => 'Selected Text',
      rangeCount: 1,
      getRangeAt: () => ({
        getBoundingClientRect: () => ({ top: 100, left: 100, width: 50, height: 20 }),
      }),
      removeAllRanges: vi.fn(),
    });
    Object.defineProperty(window, 'getSelection', { value: mockGetSelection });

    // Simulate mouse up to trigger selection handler
    fireEvent.mouseUp(screen.getByTestId('pdf-viewer'));

    await waitFor(() => {
      // Menu should appear
      expect(screen.getByLabelText('Menu de seleção de texto')).toBeInTheDocument();
    });
  });

  it('should hide TextSelectionMenu when selection is cleared', async () => {
    render(<ModernCornellLayout {...mockProps} />);

    // Mock empty selection
    const mockGetSelection = vi.fn().mockReturnValue({
      toString: () => '',
      trim: () => '',
      removeAllRanges: vi.fn(),
    });
    Object.defineProperty(window, 'getSelection', { value: mockGetSelection });

    fireEvent.mouseUp(screen.getByTestId('pdf-viewer'));

    await waitFor(() => {
      // Menu should NOT be present
      expect(screen.queryByLabelText('Menu de seleção de texto')).not.toBeInTheDocument();
    });
  });

  it('should call handleSelectionAction when menu item is clicked', async () => {
    render(<ModernCornellLayout {...mockProps} />);

    // 1. Trigger selection
    const mockGetSelection = vi.fn().mockReturnValue({
      toString: () => 'Text',
      trim: () => 'Text',
      rangeCount: 1,
      getRangeAt: () => ({
        getBoundingClientRect: () => ({ top: 100, left: 100, width: 50, height: 20 }),
      }),
      removeAllRanges: vi.fn(),
    });
    Object.defineProperty(window, 'getSelection', { value: mockGetSelection });

    fireEvent.mouseUp(screen.getByTestId('pdf-viewer'));

    await waitFor(() => {
      expect(screen.getByLabelText('Menu de seleção de texto')).toBeInTheDocument();
    });

    // 2. Click a menu action (e.g., Highlight)
    // We can't easily spy on internal component methods, but we can verify side effects 
    // or that the menu closes. For now, testing that the button is clickable validation.
    const highlightBtn = screen.getByLabelText('Highlight');
    fireEvent.click(highlightBtn);

    // 3. Selection should clear after action
    await waitFor(() => {
        expect(mockGetSelection().removeAllRanges).toHaveBeenCalled();
    });
  });
});
