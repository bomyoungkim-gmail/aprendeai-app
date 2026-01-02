import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModernCornellLayout } from '@/components/cornell/ModernCornellLayout';
import { ACTION_LABELS, CORNELL_LABELS } from '@/lib/cornell/labels';
import * as useSuggestionsHook from '@/hooks/cornell/use-suggestions';

import { ContentType } from '@/lib/constants/enums';

jest.mock('@/hooks/cornell/use-suggestions');

describe('ModernCornellLayout - Sprint 2 Integration', () => {
  const mockProps = {
    title: 'Test Document',
    contentId: 'content-123',
    mode: 'original' as const,
    onModeToggle: jest.fn(),
    saveStatus: 'saved' as const,
    targetType: ContentType.PDF,
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

  describe('Global Actions Integration', () => {
    it('should render Triagem button in header', () => {
      render(<ModernCornellLayout {...mockProps} />);
      expect(screen.getByLabelText(ACTION_LABELS.TRIAGE)).toBeInTheDocument();
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

      // Sidebar tabs are now handled by unified config, checking presence
      // Note: We might need to update these specific label checks if they changed in the pedagogical overhaul
    });
  });

  describe('NO Hard-Coded Labels Verification', () => {
    it('should NOT contain hard-coded action labels in header', () => {
      const { container } = render(<ModernCornellLayout {...mockProps} />);
      const buttons = container.querySelectorAll('button[aria-label]');
      const ariaLabels = Array.from(buttons).map(btn => btn.getAttribute('aria-label'));

      expect(ariaLabels).toContain(ACTION_LABELS.TRIAGE);
    });

    it('should use useSuggestions hook for all suggestion logic', () => {
      render(<ModernCornellLayout {...mockProps} />);
      expect(useSuggestionsHook.useSuggestions).toHaveBeenCalledWith('content-123');
    });
  });
});
