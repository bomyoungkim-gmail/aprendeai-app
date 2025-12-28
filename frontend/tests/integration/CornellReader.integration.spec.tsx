import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReaderPage from '../../app/reader/[contentId]/page';
import api from '@/lib/api';

// Mock API layer
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

jest.mock('@/hooks/ui/use-text-selection', () => ({
  useTextSelection: () => ({ selection: null, clearSelection: jest.fn() }),
}));

// We keep session mock as it is external to the "Reader" logic we are testing
jest.mock('@/hooks/sessions/reading', () => ({
  useStudySession: jest.fn(() => ({ groupId: null, isInSession: false })),
}));

// Mock Viewers to avoid canvas/complex rendering (UI Boundary)
jest.mock('@/components/cornell/viewers/PDFViewerNew', () => ({
  PDFViewer: () => <div data-testid="pdf-viewer">PDF Viewer</div>,
}));

jest.mock('@/components/cornell/viewers/ImageViewer', () => ({
  ImageViewer: () => <div data-testid="image-viewer">Image Viewer</div>,
}));

jest.mock('@/components/cornell/viewers/DocxViewer', () => ({
  DocxViewer: () => <div data-testid="docx-viewer">Docx Viewer</div>,
}));

// Mock Media Players
jest.mock('@/components/media/VideoPlayer', () => ({
  VideoPlayer: () => <div data-testid="video-player">Video Player</div>,
}));

jest.mock('@/components/media/AudioPlayer', () => ({
  AudioPlayer: () => <div data-testid="audio-player">Audio Player</div>,
}));

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

describe('Cornell Reader Page Integration', () => {
  const mockContent = {
    id: '123',
    title: 'Integration Test Doc',
    contentType: 'PDF',
    cornell: {
      summary: 'Test Summary'
    }
  };

  const mockCornell = {
    cuesJson: [{ id: 'c1', prompt: 'Test Cue', linkedHighlightIds: [] }],
    notesJson: [{ id: 'n1', body: 'Test Note', linkedHighlightIds: [] }],
    summary: 'Test Summary',
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup API Mocks
    (api.get as jest.Mock).mockImplementation((url: string) => {
      // Content Mock
      if (url === '/contents/123') {
        return Promise.resolve({ data: mockContent });
      }
      // Cornell Notes Mock
      if (url === '/contents/123/cornell') {
        return Promise.resolve({ data: mockCornell });
      }
      // Highlights Mock
      if (url === '/contents/123/highlights') {
        return Promise.resolve({ data: [] });
      }
      // Suggestions Mock (Context)
      if (url === '/cornell/contents/123/context') {
        return Promise.resolve({ data: { suggestions: [] } });
      }
      return Promise.reject(new Error(`Unknown URL: ${url}`));
    });

    (api.put as jest.Mock).mockResolvedValue({ data: {} });
  });

  it('should render loading state initially', async () => {
    // Delay resolution to show loading state
    (api.get as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolve

    render(<ReaderPage params={{ contentId: '123' }} />, { wrapper: createWrapper() });

    // Should show loading skeleton or text
    expect(screen.getByText(/Carregando Cornell Notes/i)).toBeInTheDocument();
  });
  it('should render content and cornell layout when data loads', async () => {
    render(<ReaderPage params={{ contentId: '123' }} />, { wrapper: createWrapper() });

    // Wait for Title (async load)
    expect(await screen.findByText('Integration Test Doc')).toBeInTheDocument();
    
    // Check Viewer (Dynamic import needs async find)
    expect(await screen.findByTestId('pdf-viewer')).toBeInTheDocument();

    // Check Cornell Data (Summary)
    // expect(await screen.findByDisplayValue('Test Summary')).toBeInTheDocument();

    // Check Stream (Notes - rendered in default tab) (Wait for it)
    expect(await screen.findByText('Test Note')).toBeInTheDocument();

    // Switch to Cues Tab to check Cues
    const cuesTab = screen.getByText('Importante & Dúvidas');
    fireEvent.click(cuesTab);
    expect(screen.getByText('Test Cue')).toBeInTheDocument();
  });

  it.skip('should handle autosave when data changes', async () => {
    jest.useFakeTimers();
    render(<ReaderPage params={{ contentId: '123' }} />, { wrapper: createWrapper() });

    // Wait for load
    const summaryInput = await screen.findByDisplayValue('Test Summary');
    fireEvent.change(summaryInput, { target: { value: 'Updated Summary' } });

    // Fast-forward debounce
    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      // Check if API was called
      expect(api.put).toHaveBeenCalledWith(
        '/contents/123/cornell',
        expect.objectContaining({
          summary: 'Updated Summary', // Verify payload
        })
      );
    });

    jest.useRealTimers();
  });

  it.skip('should toggle between modes', () => {
    render(<ReaderPage params={{ contentId: '123' }} />, { wrapper: createWrapper() });
    
    const toggleButton = screen.getByTitle(/click for/i);
    fireEvent.click(toggleButton);

    // Should switch to review mode
  });

  it('should show error state if content not found', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('Not Found'));

    render(<ReaderPage params={{ contentId: '123' }} />, { wrapper: createWrapper() });

    // Wait for error text
    expect(await screen.findByText(/Conteúdo não encontrado/i)).toBeInTheDocument();
  });
});
