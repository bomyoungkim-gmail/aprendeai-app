import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModernCornellLayout } from '@/components/cornell/ModernCornellLayout';
import * as useSuggestionsHook from '@/hooks/cornell/use-suggestions';

jest.mock('@/hooks/cornell/use-suggestions');

describe('ModernCornellLayout - Action Integration', () => {
  const mockCreateStreamItem = jest.fn();
  
  const mockProps = {
    title: 'Test Document',
    contentId: 'content-123',
    mode: 'view' as const,
    onModeToggle: jest.fn(),
    saveStatus: 'saved' as const,
    viewer: <div data-testid="pdf-viewer">PDF Content with text to select</div>,
    streamItems: [],
    cues: [],
    onCuesChange: jest.fn(),
    summary: '',
    onSummaryChange: jest.fn(),
    onCreateStreamItem: mockCreateStreamItem,
  };

  const mockUseSuggestions = {
    suggestions: [],
    acceptSuggestion: jest.fn(),
    dismissSuggestion: jest.fn(),
    hasUnseenSuggestions: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSuggestionsHook.useSuggestions as jest.Mock).mockReturnValue(mockUseSuggestions);

    // Mock Selection
    const mockGetSelection = jest.fn().mockReturnValue({
      toString: () => 'Selected Text',
      trim: () => 'Selected Text',
      rangeCount: 1,
      getRangeAt: () => ({
        getBoundingClientRect: () => ({ top: 100, left: 100, width: 50, height: 20 }),
      }),
      removeAllRanges: jest.fn(),
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
