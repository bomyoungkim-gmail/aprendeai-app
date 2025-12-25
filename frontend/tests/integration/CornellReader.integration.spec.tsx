import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReaderPage from '../../app/reader/[contentId]/page';
import * as hooks from '@/hooks';
import { useStudySession } from '@/hooks/use-study-session';

// Mock hooks
jest.mock('@/hooks', () => ({
  ...jest.requireActual('@/hooks'),
  useContent: jest.fn(),
  useCornellNotes: jest.fn(),
  useHighlights: jest.fn(),
  useUpdateCornellNotes: jest.fn(),
  useCreateHighlight: jest.fn(),
  useCornellAutosave: jest.fn(),
  useSaveStatusWithOnline: jest.fn(),
}));

jest.mock('@/hooks/use-text-selection', () => ({
  useTextSelection: () => ({ selection: null, clearSelection: jest.fn() }),
}));

jest.mock('@/hooks/use-annotations', () => ({
  useCreateAnnotation: () => ({ mutateAsync: jest.fn() }),
  useAnnotations: jest.fn(() => ({ data: [], isLoading: false })),
  useDeleteAnnotation: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock('@/hooks/use-study-session', () => ({
  useStudySession: jest.fn(),
}));

// Mock UI components
jest.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ toast: null, show: jest.fn(), hide: jest.fn() }),
  Toast: () => null,
}));

// Mock Viewers to avoid canvas/complex rendering
jest.mock('@/components/cornell/viewers', () => ({
  PDFViewer: () => <div data-testid="pdf-viewer">PDF Viewer</div>,
  PDFViewerNew: () => <div data-testid="pdf-viewer">PDF Viewer</div>,
  ImageViewer: () => <div data-testid="image-viewer">Image Viewer</div>,
  DocxViewer: () => <div data-testid="docx-viewer">Docx Viewer</div>,
}));

// Mock Media Players to avoid react-player ESM issues
jest.mock('@/components/media/VideoPlayer', () => ({
  VideoPlayer: () => <div data-testid="video-player">Video Player</div>,
}));

jest.mock('@/components/media/AudioPlayer', () => ({
  AudioPlayer: () => <div data-testid="audio-player">Audio Player</div>,
}));

// Mock ReviewMode
jest.mock('@/components/cornell/review/ReviewMode', () => ({
  ReviewMode: () => <div data-testid="review-mode">Review Mode</div>,
}));

describe('Cornell Reader Page Integration', () => {
  const mockContent = {
    id: '123',
    title: 'Integration Test Doc',
    contentType: 'PDF',
  };

  const mockCornell = {
    cuesJson: [{ id: 'c1', prompt: 'Test Cue', linkedHighlightIds: [] }],
    notesJson: [{ id: 'n1', body: 'Test Note', linkedHighlightIds: [] }],
    summaryText: 'Test Summary',
  };

  const mockHooks = hooks as jest.Mocked<typeof hooks>;
  const mockUseStudySession = useStudySession as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockHooks.useContent.mockReturnValue({ data: mockContent, isLoading: false } as any);
    mockHooks.useCornellNotes.mockReturnValue({ data: mockCornell, isLoading: false } as any);
    mockHooks.useHighlights.mockReturnValue({ data: [] } as any);
    mockHooks.useUpdateCornellNotes.mockReturnValue({ mutateAsync: jest.fn() } as any);
    mockHooks.useCreateHighlight.mockReturnValue({ mutateAsync: jest.fn() } as any);
    
    // Autosave mock
    mockHooks.useCornellAutosave.mockReturnValue({
      save: jest.fn(),
      status: 'saved',
      lastSaved: new Date(),
    } as any);

    mockHooks.useSaveStatusWithOnline.mockReturnValue('saved');

    // Session mock
    mockUseStudySession.mockReturnValue({ groupId: null, isInSession: false });
  });

  it('should render loading state initially', () => {
    mockHooks.useContent.mockReturnValue({ data: null, isLoading: true } as any);
    mockHooks.useCornellNotes.mockReturnValue({ data: null, isLoading: true } as any);

    render(<ReaderPage params={{ contentId: '123' }} />);

    expect(screen.getByText(/Loading Cornell Reader/i)).toBeInTheDocument();
  });

  it('should render content and cornell layout when data loads', () => {
    render(<ReaderPage params={{ contentId: '123' }} />);

    // Check Title
    expect(screen.getByText('Integration Test Doc')).toBeInTheDocument();
    
    // Check Viewer
    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();

    // Check Cornell Data (Cues, Notes, Summary)
    expect(screen.getByDisplayValue('Test Cue')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Note')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Summary')).toBeInTheDocument();
  });

  it('should handle autosave when data changes', async () => {
    const saveMock = jest.fn();
    mockHooks.useCornellAutosave.mockReturnValue({
      save: saveMock,
      status: 'saved',
      lastSaved: new Date(),
    } as any);

    render(<ReaderPage params={{ contentId: '123' }} />);

    const noteInput = screen.getByDisplayValue('Test Note');
    fireEvent.change(noteInput, { target: { value: 'Updated Note' } });

    await waitFor(() => {
      // Logic in component calls save({ notesJson: ... })
      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          notesJson: expect.arrayContaining([
            expect.objectContaining({ body: 'Updated Note' })
          ])
        })
      );
    });
  });

  it('should toggle between modes', () => {
    render(<ReaderPage params={{ contentId: '123' }} />);
    
    // Initial: Study Mode (PDFViewer rendered with 'study' mode)
    // We can check if mode toggle button exists and click it
    const toggleButton = screen.getByTitle(/click for/i);
    fireEvent.click(toggleButton);

    // Should switch to review mode
    // ReviewMode component should be rendered
    expect(screen.getByTestId('review-mode')).toBeInTheDocument();
  });

  it('should show error state if content not found', () => {
    mockHooks.useContent.mockReturnValue({ data: null, isLoading: false } as any);
    mockHooks.useCornellNotes.mockReturnValue({ data: null, isLoading: false } as any);

    render(<ReaderPage params={{ contentId: '123' }} />);

    expect(screen.getByText(/Content Not Found/i)).toBeInTheDocument();
  });
});
