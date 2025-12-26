import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SuggestionsPanel } from '@/components/cornell/SuggestionsPanel';
import type { Suggestion } from '@/hooks/cornell/useContentContext';

describe('SuggestionsPanel', () => {
  const mockSuggestions: Suggestion[] = [
    {
      id: 'sug-1',
      type: 'vocabulary_triage',
      icon: '💡',
      title: 'Triagem de Vocabulário',
      description: 'Este texto tem termos técnicos complexos.',
      actionLabel: 'Ver Triagem',
      dismissLabel: 'Ignorar',
    },
    {
      id: 'sug-2',
      type: 'checkpoint_quiz',
      icon: '🎯',
      title: 'Checkpoint',
      description: 'Você terminou a Seção 2.3!',
      actionLabel: 'Ver Perguntas',
    },
  ];

  const mockHandlers = {
    onAccept: vi.fn(),
    onDismiss: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render expanded panel with all suggestions', () => {
      render(<SuggestionsPanel suggestions={mockSuggestions} {...mockHandlers} />);

      expect(screen.getByText('Sugestões do Educator')).toBeInTheDocument();
      expect(screen.getByText('Triagem de Vocabulário')).toBeInTheDocument();
      expect(screen.getByText('Checkpoint')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Badge count
    });

    it('should NOT render when suggestions array is empty', () => {
      const { container } = render(<SuggestionsPanel suggestions={[]} {...mockHandlers} />);

      expect(container.firstChild).toBeNull();
    });

    it('should display suggestion icons', () => {
      render(<SuggestionsPanel suggestions={mockSuggestions} {...mockHandlers} />);

      // Icons should be present as text
      expect(screen.getByText('💡')).toBeInTheDocument();
      expect(screen.getByText('🎯')).toBeInTheDocument();
    });
  });

  describe('Minimize/Expand', () => {
    it('should minimize panel when chevron down is clicked', async () => {
      render(<SuggestionsPanel suggestions={mockSuggestions} {...mockHandlers} />);

      const minimizeButton = screen.getByLabelText('Minimizar');
      fireEvent.click(minimizeButton);

      // Should show minimized badge
      await waitFor(() => {
        expect(screen.getByLabelText('Abrir sugestões do Educator')).toBeInTheDocument();
      });

      // Full suggestions should not be visible
      expect(screen.queryByText('Triagem de Vocabulário')).not.toBeInTheDocument();
    });

    it('should expand panel when minimized badge is clicked', async () => {
      render(<SuggestionsPanel suggestions={mockSuggestions} {...mockHandlers} />);

      // First minimize
      fireEvent.click(screen.getByLabelText('Minimizar'));

      await waitFor(() => {
        expect(screen.getByLabelText('Abrir sugestões do Educator')).toBeInTheDocument();
      });

      // Then expand
      fireEvent.click(screen.getByLabelText('Abrir sugestões do Educator'));

      await waitFor(() => {
        expect(screen.getByText('Triagem de Vocabulário')).toBeInTheDocument();
      });
    });

    it('should show suggestion count in minimized state', async () => {
      render(<SuggestionsPanel suggestions={mockSuggestions} {...mockHandlers} />);

      fireEvent.click(screen.getByLabelText('Minimizar'));

      await waitFor(() => {
        const badge = screen.getByLabelText('Abrir sugestões do Educator');
        expect(badge.textContent).toContain('2');
      });
    });
  });

  describe('Accept/Dismiss Actions', () => {
    it('should call onAccept when action button is clicked', () => {
      render(<SuggestionsPanel suggestions={mockSuggestions} {...mockHandlers} />);

      const acceptButton = screen.getByText('Ver Triagem');
      fireEvent.click(acceptButton);

      expect(mockHandlers.onAccept).toHaveBeenCalledWith('sug-1');
    });

    it('should call onDismiss when dismiss button is clicked', async () => {
      render(<SuggestionsPanel suggestions={mockSuggestions} {...mockHandlers} />);

      const dismissButton = screen.getByText('Ignorar');
      fireEvent.click(dismissButton);

      // Should have animation delay
      await waitFor(() => {
        expect(mockHandlers.onDismiss).toHaveBeenCalledWith('sug-1');
      }, { timeout: 500 });
    });

    it('should call onDismiss when X button is clicked', async () => {
      render(<SuggestionsPanel suggestions={mockSuggestions} {...mockHandlers} />);

      const dismissButtons = screen.getAllByLabelText('Dispensar sugestão');
      fireEvent.click(dismissButtons[0]);

      await waitFor(() => {
        expect(mockHandlers.onDismiss).toHaveBeenCalledWith('sug-1');
      }, { timeout: 500 });
    });

    it('should show dismissing animation before calling onDismiss', () => {
      render(<SuggestionsPanel suggestions={mockSuggestions} {...mockHandlers} />);

      const dismissButton = screen.getByText('Ignorar');
      fireEvent.click(dismissButton);

      // onDismiss should not be called immediately
      expect(mockHandlers.onDismiss).not.toHaveBeenCalled();
    });
  });

  describe('Optional dismissLabel', () => {
    it('should show dismissLabel button when provided', () => {
      render(<SuggestionsPanel suggestions={mockSuggestions} {...mockHandlers} />);

      expect(screen.getByText('Ignorar')).toBeInTheDocument();
    });

    it('should NOT show dismissLabel button when not provided', () => {
      // sug-2 doesn't have dismissLabel
      render(<SuggestionsPanel suggestions={[mockSuggestions[1]]} {...mockHandlers} />);

      expect(screen.queryByText('Ignorar')).not.toBeInTheDocument();
    });
  });

  describe('NO Hard-Coded Labels', () => {
    it('should use dynamic suggestion data for all labels', () => {
      render(<SuggestionsPanel suggestions={mockSuggestions} {...mockHandlers} />);

      // All labels should come from suggestion objects, not hard-coded
      expect(screen.getByText(mockSuggestions[0].title)).toBeInTheDocument();
      expect(screen.getByText(mockSuggestions[0].description)).toBeInTheDocument();
      expect(screen.getByText(mockSuggestions[0].actionLabel)).toBeInTheDocument();
    });

    it('should use "Sugestões do Educator" header (acceptable hard-code for component title)', () => {
      render(<SuggestionsPanel suggestions={mockSuggestions} {...mockHandlers} />);

      // This is the component's title, not suggestion data
      expect(screen.getByText('Sugestões do Educator')).toBeInTheDocument();
    });
  });
});
