/**
 * Unit Tests - Cornell Layout Component
 * 
 * Tests Cornell layout functionality:
 * - Rendering all sections (cues, notes, summary, viewer)
 * - Mode toggle behavior (reading/editing)
 * - Save status display
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CornellLayout } from '@/components/cornell/CornellLayout';

describe('CornellLayout Component', () => {
  const mockCues = [
    { id: '1', prompt: 'What is this?', linkedHighlightIds: [] },
    { id: '2', prompt: 'Why important?', linkedHighlightIds: ['h1'] }
  ];

  const mockNotes = [
    { id: '1', body: 'Main idea here', linkedHighlightIds: [] },
    { id: '2', body: 'Supporting details', linkedHighlightIds: ['h2'] }
  ];

  const defaultProps = {
    title: 'Test Content',
    mode: 'original' as const,
    onModeToggle: jest.fn(),
    saveStatus: 'saved' as const,
    lastSaved: new Date(),
    cues: mockCues,
    onCuesChange: jest.fn(),
    notes: mockNotes,
    onNotesChange: jest.fn(),
    summary: 'Test summary',
    onSummaryChange: jest.fn(),
    viewer: <div data-testid="viewer">Viewer Content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all three main sections', () => {
      render(<CornellLayout {...defaultProps} />);

      expect(screen.getByTestId('viewer')).toBeInTheDocument();
      // Look for textarea values
      expect(screen.getByDisplayValue('What is this?')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Main idea here')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test summary')).toBeInTheDocument();
    });

    it('should display title in top bar', () => {
      render(<CornellLayout {...defaultProps} />);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should show save status', () => {
      const { rerender } = render(<CornellLayout {...defaultProps} saveStatus="saving" />);
      expect(screen.getByText(/Salvando/i)).toBeInTheDocument();

      rerender(<CornellLayout {...defaultProps} saveStatus="saved" />);
      expect(screen.getByText(/Salvo/i)).toBeInTheDocument();
    });
  });

  describe('Mode Toggle', () => {
    it('should call onModeToggle when toggle button is clicked', () => {
      render(<CornellLayout {...defaultProps} />);
      // Selector based on the button title which contains "Click for"
      const toggleButton = screen.getByTitle(/click for/i);
      
      fireEvent.click(toggleButton);
      expect(defaultProps.onModeToggle).toHaveBeenCalledTimes(1);
    });

    it('should reflect current mode', () => {
      const { rerender } = render(<CornellLayout {...defaultProps} mode="original" />);
      expect(screen.getByText(/original/i)).toBeInTheDocument();

      rerender(<CornellLayout {...defaultProps} mode="study" />);
      expect(screen.getByText(/study/i)).toBeInTheDocument();
    });
  });

  describe('Cornell Sections', () => {
    it('should render all cues', () => {
      render(<CornellLayout {...defaultProps} />);
      mockCues.forEach(cue => {
        expect(screen.getByDisplayValue(cue.prompt)).toBeInTheDocument();
      });
    });

    it('should render all notes', () => {
      render(<CornellLayout {...defaultProps} />);
      mockNotes.forEach(note => {
        expect(screen.getByDisplayValue(note.body)).toBeInTheDocument();
      });
    });

    it('should call onSummaryChange when summary is modified', () => {
      render(<CornellLayout {...defaultProps} />);
      const summaryInput = screen.getByDisplayValue('Test summary');
      
      fireEvent.change(summaryInput, { target: { value: 'Updated summary' } });
      
      expect(defaultProps.onSummaryChange).toHaveBeenCalled();
    });
  });

  describe('Viewer Integration', () => {
    it('should render custom viewer component', () => {
      render(<CornellLayout {...defaultProps} />);
      expect(screen.getByTestId('viewer')).toBeInTheDocument();
      expect(screen.getByText('Viewer Content')).toBeInTheDocument();
    });

    it('should handle different viewer types', () => {
      const pdfViewer = <div data-testid="pdf-viewer">PDF Content</div>;
      render(<CornellLayout {...defaultProps} viewer={pdfViewer} />);
      
      expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
    });
  });

  describe('Linked Highlights', () => {
    it('should show highlight count for cues', () => {
      render(<CornellLayout {...defaultProps} />);
      // Cue with id '2' has 1 linked highlight
      const cueWithHighlight = screen.getAllByText(/1/);
      expect(cueWithHighlight.length).toBeGreaterThan(0);
    });

    it('should handle cue click with linked highlights', () => {
      const onCueClick = jest.fn();
      render(<CornellLayout {...defaultProps} onCueClick={onCueClick} />);
      
      const cue = screen.getByText('Why important?');
      fireEvent.click(cue);
      
      expect(onCueClick).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: 'Why important?' })
      );
    });
  });
});
