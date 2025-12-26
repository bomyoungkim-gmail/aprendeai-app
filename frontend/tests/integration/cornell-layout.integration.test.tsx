import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModernCornellLayout } from '@/components/cornell/ModernCornellLayout';
import { ACTION_LABELS, CORNELL_LABELS } from '@/lib/cornell/labels';
import * as useSuggestionsHook from '@/hooks/cornell/use-suggestions';

jest.mock('@/hooks/cornell/use-suggestions');

describe('ModernCornellLayout - Sprint 2 Integration', () => {
  const mockProps = {
    title: 'Test Document',
    contentId: 'content-123',
    mode: 'view' as const,
    onModeToggle: jest.fn(),
    saveStatus: 'saved' as const,
    viewer: <div data-testid="mock-viewer">PDF Viewer</div>,
    streamItems: [],
    cues: [],
    onCuesChange: jest.fn(),
    summary: '',
    onSummaryChange: jest.fn(),
  };

  const mockUseSuggestions = {
    suggestions: [],
    acceptSuggestion: jest.fn(),
    dismissSuggestion: jest.fn(),
    dismissAll: jest.fn(),
    hasUnseenSuggestions: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSuggestionsHook.useSuggestions as jest.Mock).mockReturnValue(mockUseSuggestions);
  });

  describe('ActionToolbar Integration', () => {
    it('should render ActionToolbar in header', () => {
      render(<ModernCornellLayout {...mockProps} />);

      // Verify all toolbar buttons are present using centralized labels
      expect(screen.getByLabelText(ACTION_LABELS.TRIAGE)).toBeInTheDocument();
      expect(screen.getByLabelText(ACTION_LABELS.HIGHLIGHT)).toBeInTheDocument();
      expect(screen.getByLabelText(ACTION_LABELS.NOTE)).toBeInTheDocument();
      expect(screen.getByLabelText(ACTION_LABELS.QUESTION)).toBeInTheDocument();
      expect(screen.getByLabelText(ACTION_LABELS.AI)).toBeInTheDocument();
    });

    it('should toggle activeAction state when toolbar button is clicked', () => {
      render(<ModernCornellLayout {...mockProps} />);

      const highlightButton = screen.getByLabelText(ACTION_LABELS.HIGHLIGHT);

      // First click - activate
      fireEvent.click(highlightButton);
      expect(highlightButton.className).toContain('border-blue-500');

      // Second click - deactivate
      fireEvent.click(highlightButton);
      expect(highlightButton.className).toContain('border-transparent');
    });

    it('should pass hasUnseenSuggestions to ActionToolbar', () => {
      (useSuggestionsHook.useSuggestions as jest.Mock).mockReturnValue({
        ...mockUseSuggestions,
        hasUnseenSuggestions: true,
      });

      render(<ModernCornellLayout {...mockProps} />);

      // Should show badge on AI button
      expect(screen.getByLabelText('Novas sugestões disponíveis')).toBeInTheDocument();
    });
  });

  describe('SuggestionsPanel Integration', () => {
    it('should render SuggestionsPanel when suggestions exist', () => {
      const mockSuggestions = [
        {
          id: 'sug-1',
          type: 'vocabulary_triage' as const,
          icon: '💡' as const,
          title: 'Test Suggestion',
          description: 'Test description',
          actionLabel: 'Accept',
        },
      ];

      (useSuggestionsHook.useSuggestions as jest.Mock).mockReturnValue({
        ...mockUseSuggestions,
        suggestions: mockSuggestions,
        hasUnseenSuggestions: true,
      });

      render(<ModernCornellLayout {...mockProps} />);

      expect(screen.getByText('Sugestões do Educator')).toBeInTheDocument();
      expect(screen.getByText('Test Suggestion')).toBeInTheDocument();
    });

    it('should NOT render SuggestionsPanel when no suggestions', () => {
      render(<ModernCornellLayout {...mockProps} />);

      expect(screen.queryByText('Sugestões do Educator')).not.toBeInTheDocument();
    });

    it('should call acceptSuggestion from useSuggestions hook', () => {
      const mockSuggestions = [
        {
          id: 'sug-1',
          type: 'checkpoint_quiz' as const,
          icon: '🎯' as const,
          title: 'Quiz',
          description: 'Take quiz',
          actionLabel: 'Start Quiz',
        },
      ];

      (useSuggestionsHook.useSuggestions as jest.Mock).mockReturnValue({
        ...mockUseSuggestions,
        suggestions: mockSuggestions,
      });

      render(<ModernCornellLayout {...mockProps} />);

      fireEvent.click(screen.getByText('Start Quiz'));

      expect(mockUseSuggestions.acceptSuggestion).toHaveBeenCalledWith('sug-1');
    });
  });

  describe('Sidebar Labels with CORNELL_LABELS', () => {
    it('should display all sidebar tab labels from centralized constants', () => {
      render(<ModernCornellLayout {...mockProps} />);

      expect(screen.getByText(CORNELL_LABELS.HIGHLIGHTS_NOTES)).toBeInTheDocument();
      expect(screen.getByText(CORNELL_LABELS.IMPORTANT_QUESTIONS)).toBeInTheDocument();
    });

    it('should display summary label from centralized constant', () => {
      render(<ModernCornellLayout {...mockProps} />);

      expect(screen.getByText(CORNELL_LABELS.SYNTHESIS)).toBeInTheDocument();
    });
  });

  describe('NO Hard-Coded Labels Verification', () => {
    it('should NOT contain hard-coded action labels', () => {
      const { container } = render(<ModernCornellLayout {...mockProps} />);

      // All toolbar labels should come from ACTION_LABELS constant
      const buttons = container.querySelectorAll('button[aria-label]');
      const ariaLabels = Array.from(buttons).map(btn => btn.getAttribute('aria-label'));

      expect(ariaLabels).toContain(ACTION_LABELS.TRIAGE);
      expect(ariaLabels).toContain(ACTION_LABELS.HIGHLIGHT);
      expect(ariaLabels).toContain(ACTION_LABELS.NOTE);
    });

    it('should use useSuggestions hook for all suggestion logic', () => {
      render(<ModernCornellLayout {...mockProps} />);

      expect(useSuggestionsHook.useSuggestions).toHaveBeenCalledWith('content-123');
    });
  });

  describe('Keyboard Shortcuts End-to-End', () => {
    it('should activate highlight mode via keyboard shortcut H', async () => {
      render(<ModernCornellLayout {...mockProps} />);

      // Simulate H key press
      fireEvent.keyDown(document, { key: 'h' });

      await waitFor(() => {
        const highlightButton = screen.getByLabelText(ACTION_LABELS.HIGHLIGHT);
        expect(highlightButton.className).toContain('border-blue-500');
      });
    });

    it('should activate note mode via keyboard shortcut N', async () => {
      render(<ModernCornellLayout {...mockProps} />);

      fireEvent.keyDown(document, { key: 'n' });

      await waitFor(() => {
        const noteButton = screen.getByLabelText(ACTION_LABELS.NOTE);
        expect(noteButton.className).toContain('border-blue-500');
      });
    });
  });
});
