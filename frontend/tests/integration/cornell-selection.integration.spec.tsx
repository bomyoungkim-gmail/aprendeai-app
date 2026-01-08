import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModernCornellLayout } from '@/components/cornell/ModernCornellLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContentType } from '@/lib/constants/enums';
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
    targetType: ContentType.PDF,
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

  // SCRIPT 01: RB-CHAT-ONLY Compliance Tests
  describe('RB-CHAT-ONLY - AI via Chat Only', () => {
    beforeEach(() => {
      // Mock fetch for chat endpoint
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should route AI action to chat sidebar (not direct API call)', async () => {
      render(<ModernCornellLayout {...mockProps} />, { wrapper: createWrapper() });

      // 1. Simulate text selection
      const selectedText = 'Texto selecionado para análise';
      const mockGetSelection = jest.fn().mockReturnValue({
        toString: () => selectedText,
        trim: () => selectedText,
        rangeCount: 1,
        getRangeAt: () => ({
          getBoundingClientRect: () => ({ top: 100, left: 100, width: 200, height: 20 }),
          commonAncestorContainer: screen.getByTestId('pdf-viewer'),
        }),
        removeAllRanges: jest.fn(),
      });
      Object.defineProperty(window, 'getSelection', { value: mockGetSelection });

      fireEvent.mouseUp(screen.getByTestId('pdf-viewer'));

      await waitFor(() => {
        expect(screen.getByLabelText('Menu de seleção de texto')).toBeInTheDocument();
      });

      // 2. Click AI button (Sparkles icon)
      const aiButton = screen.getByLabelText('IA');
      fireEvent.click(aiButton);

      // 3. Verify NO immediate API call (fetch should not be called yet)
      expect(global.fetch).not.toHaveBeenCalled();

      // 4. Verify sidebar opens and chat tab is active
      await waitFor(() => {
        // Sidebar should be visible (check for chat panel presence)
        expect(screen.getByText(/Educator/i)).toBeInTheDocument();
      });

      // 5. Verify chat input contains or references the selected text
      // The AIChatPanel should receive the selection as initialInput
      const chatInput = screen.getByPlaceholderText(/Digite sua mensagem/i);
      expect(chatInput).toBeInTheDocument();
      
      // The input should be pre-filled with context about the selection
      await waitFor(() => {
        expect(chatInput).toHaveValue(expect.stringContaining(selectedText));
      });
    });

    it('should NOT create modal or separate UI when AI is triggered', async () => {
      render(<ModernCornellLayout {...mockProps} />, { wrapper: createWrapper() });

      // Simulate selection and AI click
      const mockGetSelection = jest.fn().mockReturnValue({
        toString: () => 'Test text',
        trim: () => 'Test text',
        rangeCount: 1,
        getRangeAt: () => ({
          getBoundingClientRect: () => ({ top: 100, left: 100, width: 100, height: 20 }),
        }),
        removeAllRanges: jest.fn(),
      });
      Object.defineProperty(window, 'getSelection', { value: mockGetSelection });

      fireEvent.mouseUp(screen.getByTestId('pdf-viewer'));

      await waitFor(() => {
        expect(screen.getByLabelText('Menu de seleção de texto')).toBeInTheDocument();
      });

      const aiButton = screen.getByLabelText('IA');
      fireEvent.click(aiButton);

      // Verify no modal/dialog appears (only sidebar/chat)
      await waitFor(() => {
        // Should NOT have any role="dialog" except the selection menu itself
        const dialogs = screen.queryAllByRole('dialog');
        // Only the selection menu should exist, and it should close after click
        expect(dialogs.length).toBeLessThanOrEqual(1);
      });

      // Verify chat is the only AI interface
      expect(screen.getByText(/Educator/i)).toBeInTheDocument();
    });

    it('should send selection context via chat API when user submits', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: 'Resposta do assistente',
          quickReplies: [],
        }),
      });
      global.fetch = mockFetch;

      render(<ModernCornellLayout {...mockProps} />, { wrapper: createWrapper() });

      // Simulate selection and AI action
      const selectedText = 'Contexto importante';
      const mockGetSelection = jest.fn().mockReturnValue({
        toString: () => selectedText,
        trim: () => selectedText,
        rangeCount: 1,
        getRangeAt: () => ({
          getBoundingClientRect: () => ({ top: 100, left: 100, width: 150, height: 20 }),
        }),
        removeAllRanges: jest.fn(),
      });
      Object.defineProperty(window, 'getSelection', { value: mockGetSelection });

      fireEvent.mouseUp(screen.getByTestId('pdf-viewer'));
      
      await waitFor(() => {
        expect(screen.getByLabelText('IA')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('IA'));

      // Wait for chat to open
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Digite sua mensagem/i)).toBeInTheDocument();
      });

      // User types additional message and submits
      const chatInput = screen.getByPlaceholderText(/Digite sua mensagem/i);
      fireEvent.change(chatInput, { target: { value: 'Explique isso' } });
      
      const sendButton = screen.getByLabelText(/Enviar/i);
      fireEvent.click(sendButton);

      // Verify API call includes selection in context
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/chat'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('context'),
          })
        );
      });

      // Verify the payload structure includes selection
      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.context).toBeDefined();
      expect(requestBody.context.selection).toBe(selectedText);
    });
  });
});
