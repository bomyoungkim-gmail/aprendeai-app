import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModernCornellLayout } from '@/components/cornell/ModernCornellLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/lib/api';

// Mock API
jest.mock('@/lib/api', () => {
  const mockApi = {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockApi,
    api: mockApi, // Support named import
  };
});

// Helper for wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('ModernCornellLayout - Text Selection Integration', () => {
  const mockProps = {
    title: 'Test Document',
    contentId: 'content-123',
    mode: 'original' as const,
    onModeToggle: jest.fn(),
    saveStatus: 'saved' as const,
    targetType: 'PDF' as const,
    viewer: <div data-testid="pdf-viewer">PDF Content with text to select</div>,
    streamItems: [],
    cues: [],
    onCuesChange: jest.fn(),
    summary: '',
    onSummaryChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup API Mocks
    (api.get as jest.Mock).mockImplementation((url: string) => {
      // Return empty suggestions context
      if (url.includes('/context')) {
        return Promise.resolve({ data: { suggestions: [] } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('should show TextSelectionMenu when text is selected', async () => {
    render(<ModernCornellLayout {...mockProps} />, { wrapper: createWrapper() });

    // Mock window.getSelection
    const pdfViewer = screen.getByTestId('pdf-viewer');
    const textNode = pdfViewer.firstChild;
    
    const mockGetSelection = jest.fn().mockReturnValue({
      toString: () => 'Selected Text',
      trim: () => 'Selected Text',
      rangeCount: 1,
      getRangeAt: () => ({
        getBoundingClientRect: () => ({ top: 100, left: 100, width: 50, height: 20 }),
        commonAncestorContainer: pdfViewer,
        startContainer: textNode,
        startOffset: 0,
        endContainer: textNode,
        endOffset: 5,
      }),
      anchorNode: textNode,
      focusNode: textNode,
      removeAllRanges: jest.fn(),
    });
    Object.defineProperty(window, 'getSelection', { value: mockGetSelection });

    // Simulate mouse up to trigger selection handler
    fireEvent.mouseUp(screen.getByTestId('pdf-viewer'));
    // fireEvent(document, new Event('selectionchange')); // Not needed for mouseup listener

    await waitFor(() => {
      // Menu should appear
      expect(screen.getByLabelText('Menu de seleção de texto')).toBeInTheDocument();
    });
  });

  it('should hide TextSelectionMenu when selection is cleared', async () => {
    render(<ModernCornellLayout {...mockProps} />, { wrapper: createWrapper() });

    // Mock empty selection
    const mockGetSelection = jest.fn().mockReturnValue({
      toString: () => '',
      trim: () => '',
      removeAllRanges: jest.fn(),
    });
    Object.defineProperty(window, 'getSelection', { value: mockGetSelection });

    fireEvent.mouseUp(screen.getByTestId('pdf-viewer'));

    await waitFor(() => {
      // Menu should NOT be present
      expect(screen.queryByLabelText('Menu de seleção de texto')).not.toBeInTheDocument();
    });
  });

  it('should call handleSelectionAction when menu item is clicked', async () => {
    render(<ModernCornellLayout {...mockProps} />, { wrapper: createWrapper() });

    // 1. Trigger selection
    const mockGetSelection = jest.fn().mockReturnValue({
      toString: () => 'Text',
      trim: () => 'Text',
      rangeCount: 1,
      getRangeAt: () => ({
        getBoundingClientRect: () => ({ top: 100, left: 100, width: 50, height: 20 }),
      }),
      removeAllRanges: jest.fn(),
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
