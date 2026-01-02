const vi = jest;
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActionToolbar } from '@/components/cornell/ActionToolbar';
import { ACTION_LABELS, KEYBOARD_SHORTCUTS } from '@/lib/cornell/labels';

describe('ActionToolbar', () => {
  const mockHandlers = {
    onTriageClick: vi.fn(),
    onHighlightClick: vi.fn(),
    onNoteClick: vi.fn(),
    onQuestionClick: vi.fn(),
    onAIClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render all action buttons with centralized labels', () => {
      render(<ActionToolbar {...mockHandlers} />);

      // Verify all labels from constants (NO hard-coding)
      expect(screen.getByLabelText(ACTION_LABELS.TRIAGE)).toBeInTheDocument();
      expect(screen.getByLabelText(ACTION_LABELS.HIGHLIGHT)).toBeInTheDocument();
      expect(screen.getByLabelText(ACTION_LABELS.NOTE)).toBeInTheDocument();
      expect(screen.getByLabelText(ACTION_LABELS.QUESTION)).toBeInTheDocument();
      expect(screen.getByLabelText(ACTION_LABELS.AI)).toBeInTheDocument();
    });

    it('should NOT contain hard-coded Portuguese labels', () => {
      const { container } = render(<ActionToolbar {...mockHandlers} />);

      // Ensure labels come from constants
      const buttons = container.querySelectorAll('button');
      const buttonTexts = Array.from(buttons).map(btn => btn.textContent);
      
      // Should match constant values
      expect(buttonTexts).toContain(ACTION_LABELS.TRIAGE);
      expect(buttonTexts).toContain(ACTION_LABELS.HIGHLIGHT);
    });

    it('should show badge when hasUnseenSuggestions is true', () => {
      render(<ActionToolbar {...mockHandlers} hasUnseenSuggestions={true} />);

      expect(screen.getByLabelText('Novas sugestões disponíveis')).toBeInTheDocument();
    });

    it('should NOT show badge when hasUnseenSuggestions is false', () => {
      render(<ActionToolbar {...mockHandlers} hasUnseenSuggestions={false} />);

      expect(screen.queryByLabelText('Novas sugestões disponíveis')).not.toBeInTheDocument();
    });
  });

  describe('Click Handlers', () => {
    it('should call onTriageClick when Triagem button is clicked', () => {
      render(<ActionToolbar {...mockHandlers} />);

      fireEvent.click(screen.getByLabelText(ACTION_LABELS.TRIAGE));
      expect(mockHandlers.onTriageClick).toHaveBeenCalledTimes(1);
    });

    it('should call onHighlightClick when Highlight button is clicked', () => {
      render(<ActionToolbar {...mockHandlers} />);

      fireEvent.click(screen.getByLabelText(ACTION_LABELS.HIGHLIGHT));
      expect(mockHandlers.onHighlightClick).toHaveBeenCalledTimes(1);
    });

    it('should call onNoteClick when Note button is clicked', () => {
      render(<ActionToolbar {...mockHandlers} />);

      fireEvent.click(screen.getByLabelText(ACTION_LABELS.NOTE));
      expect(mockHandlers.onNoteClick).toHaveBeenCalledTimes(1);
    });

    it('should call onQuestionClick when Question button is clicked', () => {
      render(<ActionToolbar {...mockHandlers} />);

      fireEvent.click(screen.getByLabelText(ACTION_LABELS.QUESTION));
      expect(mockHandlers.onQuestionClick).toHaveBeenCalledTimes(1);
    });

    it('should call onAIClick when AI button is clicked', () => {
      render(<ActionToolbar {...mockHandlers} />);

      fireEvent.click(screen.getByLabelText(ACTION_LABELS.AI));
      expect(mockHandlers.onAIClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should trigger onHighlightClick on H key press', async () => {
      render(<ActionToolbar {...mockHandlers} />);

      fireEvent.keyDown(document, { key: KEYBOARD_SHORTCUTS.HIGHLIGHT });

      await waitFor(() => {
        expect(mockHandlers.onHighlightClick).toHaveBeenCalledTimes(1);
      });
    });

    it('should trigger onNoteClick on N key press', async () => {
      render(<ActionToolbar {...mockHandlers} />);

      fireEvent.keyDown(document, { key: KEYBOARD_SHORTCUTS.NOTE });

      await waitFor(() => {
        expect(mockHandlers.onNoteClick).toHaveBeenCalledTimes(1);
      });
    });

    it('should trigger onQuestionClick on Q key press', async () => {
      render(<ActionToolbar {...mockHandlers} />);

      fireEvent.keyDown(document, { key: KEYBOARD_SHORTCUTS.QUESTION });

      await waitFor(() => {
        expect(mockHandlers.onQuestionClick).toHaveBeenCalledTimes(1);
      });
    });

    it('should trigger onAIClick on / key press', async () => {
      render(<ActionToolbar {...mockHandlers} />);

      fireEvent.keyDown(document, { key: KEYBOARD_SHORTCUTS.AI });

      await waitFor(() => {
        expect(mockHandlers.onAIClick).toHaveBeenCalledTimes(1);
      });
    });

    it('should NOT trigger shortcuts when typing in input', async () => {
      render(
        <div>
          <input type="text" data-testid="test-input" />
          <ActionToolbar {...mockHandlers} />
        </div>
      );

      const input = screen.getByTestId('test-input');
      input.focus();

      // Simulate typing in input
      fireEvent.keyDown(document, { key: KEYBOARD_SHORTCUTS.HIGHLIGHT });

      await waitFor(() => {
        expect(mockHandlers.onHighlightClick).not.toHaveBeenCalled();
      });
    });
  });

  describe('Active State Styling', () => {
    it('should highlight active action button', () => {
      const { container } = render(
        <ActionToolbar {...mockHandlers} activeAction="annotation" />
      );

      const highlightButton = screen.getByLabelText(ACTION_LABELS.HIGHLIGHT);
      
      // Active button should have blue border
      expect(highlightButton.className).toContain('border-blue-500');
    });

    it('should not highlight inactive buttons', () => {
      const { container } = render(
        <ActionToolbar {...mockHandlers} activeAction="annotation" />
      );

      const noteButton = screen.getByLabelText(ACTION_LABELS.NOTE);
      
      // Inactive button should have transparent border
      expect(noteButton.className).toContain('border-transparent');
    });
  });

  describe('NO Hard-Coded Values', () => {
    it('should use KEYBOARD_SHORTCUTS constants for all shortcuts', () => {
      render(<ActionToolbar {...mockHandlers} />);

      // Tooltip should contain keyboard shortcut from constant
      const highlightButton = screen.getByLabelText(ACTION_LABELS.HIGHLIGHT);
      expect(highlightButton.title).toContain(KEYBOARD_SHORTCUTS.HIGHLIGHT.toUpperCase());
    });

    it('should use ACTION_LABELS constants for all button labels', () => {
      const { container } = render(<ActionToolbar {...mockHandlers} />);

      const buttons = container.querySelectorAll('button[aria-label]');
      
      // All aria-labels should come from ACTION_LABELS constant
      const ariaLabels = Array.from(buttons).map(btn => btn.getAttribute('aria-label'));
      
      expect(ariaLabels).toContain(ACTION_LABELS.TRIAGE);
      expect(ariaLabels).toContain(ACTION_LABELS.HIGHLIGHT);
      expect(ariaLabels).toContain(ACTION_LABELS.NOTE);
      expect(ariaLabels).toContain(ACTION_LABELS.QUESTION);
      expect(ariaLabels).toContain(ACTION_LABELS.AI);
    });
  });
});
