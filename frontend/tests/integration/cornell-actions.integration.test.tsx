import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModernCornellLayout } from '@/components/cornell/ModernCornellLayout';
import * as useSuggestionsHook from '@/hooks/cornell/useSuggestions';

vi.mock('@/hooks/cornell/useSuggestions');

describe('ModernCornellLayout - Action Integration', () => {
  const mockCreateStreamItem = vi.fn();
  
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
    onCreateStreamItem: mockCreateStreamItem,
  };

  const mockUseSuggestions = {
    suggestions: [],
    acceptSuggestion: vi.fn(),
    dismissSuggestion: vi.fn(),
    hasUnseenSuggestions: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSuggestionsHook.useSuggestions).mockReturnValue(mockUseSuggestions);

    // Mock Selection
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
  });

  const triggerSelectionMenu = async () => {
    render(<ModernCornellLayout {...mockProps} />);
    fireEvent.mouseUp(screen.getByTestId('pdf-viewer'));
    await waitFor(() => {
      expect(screen.getByLabelText('Menu de seleção de texto')).toBeInTheDocument();
    });
  };

  it('should call onCreateStreamItem with "annotation" when Highlight is clicked', async () => {
    await triggerSelectionMenu();
    fireEvent.click(screen.getByLabelText('Highlight'));
    
    expect(mockCreateStreamItem).toHaveBeenCalledWith('annotation', 'Selected Text');
  });

  it('should call onCreateStreamItem with "star" when Star is clicked', async () => {
    await triggerSelectionMenu();
    fireEvent.click(screen.getByLabelText('Destaque')); // Updated label
    
    expect(mockCreateStreamItem).toHaveBeenCalledWith('star', 'Selected Text');
  });

  it('should call onCreateStreamItem with "question" when Question is clicked', async () => {
    await triggerSelectionMenu();
    fireEvent.click(screen.getByLabelText('Dúvida'));
    
    expect(mockCreateStreamItem).toHaveBeenCalledWith('question', 'Selected Text');
  });

  it('should open AI Chat with pre-filled text when AI is clicked', async () => {
    await triggerSelectionMenu();
    fireEvent.click(screen.getByLabelText('IA'));
    
    // Check if AIChatPanel is visible (Assistente de Leitura is the title)
    expect(screen.getByText('Assistente de Leitura')).toBeInTheDocument();
    // Check input value
    expect(screen.getByDisplayValue('Sobre "Selected Text": ')).toBeInTheDocument();
  });
});
