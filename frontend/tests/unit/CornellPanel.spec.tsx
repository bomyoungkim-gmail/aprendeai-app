/**
 * Unit Tests - Cornell Panel Component
 * 
 * Tests Cornell panel functionality:
 * - Rendering sections (notes, cue, summary)
 * - Toggle mode behavior
 * - Autosave functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CornellPanel } from '@/components/cornell/CornellPanel';

// Mock API calls
const mockSaveCornell = vi.fn();
const mockGetCornell = vi.fn();

vi.mock('@/lib/api', () => ({
  saveCornell: (...args: any[]) => mockSaveCornell(...args),
  getCornell: (...args: any[]) => mockGetCornell(...args),
}));

describe('CornellPanel Component', () => {
  const mockContentId = 'content-123';
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCornell.mockResolvedValue({
      mainNotes: {},
      cueColumn: '',
      summaryText: '',
    });
  });
  
  describe('Rendering', () => {
    it('should render all three sections', () => {
      render(<CornellPanel contentId={mockContentId} />);
      
      expect(screen.getByText(/main notes/i)).toBeInTheDocument();
      expect(screen.getByText(/cue column/i)).toBeInTheDocument();
      expect(screen.getByText(/summary/i)).toBeInTheDocument();
    });
    
    it('should render in reading mode by default', () => {
      render(<CornellPanel contentId={mockContentId} />);
      
      // In reading mode, sections should be read-only or display mode
      const readingModeIndicator = screen.queryByTestId('reading-mode');
      expect(readingModeIndicator).toBeInTheDocument();
    });
  });
  
  describe('Toggle Mode', () => {
    it('should toggle between reading and editing mode', async () => {
      render(<CornellPanel contentId={mockContentId} />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle.*mode/i });
      
      // Initially in reading mode
      expect(screen.queryByTestId('reading-mode')).toBeInTheDocument();
      
      // Click to switch to editing
      fireEvent.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('editing-mode')).toBeInTheDocument();
      });
      
      // Click again to switch back
      fireEvent.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('reading-mode')).toBeInTheDocument();
      });
    });
  });
  
  describe('Autosave Functionality', () => {
    it('should autosave cue column after delay', async () => {
      vi.useFakeTimers();
      
      render(<CornellPanel contentId={mockContentId} />);
      
      // Switch to editing mode
      const toggleButton = screen.getByRole('button', { name: /toggle.*mode/i });
      fireEvent.click(toggleButton);
      
      // Type in cue column
      const cueInput = screen.getByPlaceholderText(/cue column/i);
      fireEvent.change(cueInput, { target: { value: 'New cue text' } });
      
      // Wait for autosave delay (usually 1-2 seconds)
      vi.advanceTimersByTime(2000);
      
      await waitFor(() => {
        expect(mockSaveCornell).toHaveBeenCalledWith(
          mockContentId,
          expect.objectContaining({
            cueColumn: 'New cue text',
          })
        );
      });
      
      vi.useRealTimers();
    });
    
    it('should autosave summary after typing', async () => {
      vi.useFakeTimers();
      
      render(<CornellPanel contentId={mockContentId} />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle.*mode/i });
      fireEvent.click(toggleButton);
      
      const summaryInput = screen.getByPlaceholderText(/summary/i);
      fireEvent.change(summaryInput, { 
        target: { value: 'This is my comprehensive summary' }
      });
      
      vi.advanceTimersByTime(2000);
      
      await waitFor(() => {
        expect(mockSaveCornell).toHaveBeenCalledWith(
          mockContentId,
          expect.objectContaining({
            summaryText: 'This is my comprehensive summary',
          })
        );
      });
      
      vi.useRealTimers();
    });
    
    it('should debounce multiple rapid changes', async () => {
      vi.useFakeTimers();
      
      render(<CornellPanel contentId={mockContentId} />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle.*mode/i });
      fireEvent.click(toggleButton);
      
      const cueInput = screen.getByPlaceholderText(/cue column/i);
      
      // Type multiple times rapidly
      fireEvent.change(cueInput, { target: { value: 'A' } });
      vi.advanceTimersByTime(500);
      
      fireEvent.change(cueInput, { target: { value: 'AB' } });
      vi.advanceTimersByTime(500);
      
      fireEvent.change(cueInput, { target: { value: 'ABC' } });
      vi.advanceTimersByTime(2000);
      
      // Should only save once with final value
      await waitFor(() => {
        expect(mockSaveCornell).toHaveBeenCalledTimes(1);
        expect(mockSaveCornell).toHaveBeenCalledWith(
          mockContentId,
          expect.objectContaining({
            cueColumn: 'ABC',
          })
        );
      });
      
      vi.useRealTimers();
    });
  });
  
  describe('Data Persistence', () => {
    it('should load existing cornell notes on mount', async () => {
      mockGetCornell.mockResolvedValue({
        mainNotes: { '1': 'Existing note' },
        cueColumn: 'Existing cue',
        summaryText: 'Existing summary',
      });
      
      render(<CornellPanel contentId={mockContentId} />);
      
      await waitFor(() => {
        expect(mockGetCornell).toHaveBeenCalledWith(mockContentId);
      });
      
      // Should display loaded data
      expect(screen.getByText(/existing note/i)).toBeInTheDocument();
      expect(screen.getByText(/existing cue/i)).toBeInTheDocument();
      expect(screen.getByText(/existing summary/i)).toBeInTheDocument();
    });
    
    it('should handle empty cornell notes', async () => {
      mockGetCornell.mockResolvedValue({
        mainNotes: {},
        cueColumn: '',
        summaryText: '',
      });
      
      render(<CornellPanel contentId={mockContentId} />);
      
      await waitFor(() => {
        expect(screen.getByText(/no notes yet/i)).toBeInTheDocument();
      });
    });
  });
  
  describe('Error Handling', () => {
    it('should show error message when save fails', async () => {
      mockSaveCornell.mockRejectedValue(new Error('Save failed'));
      
      vi.useFakeTimers();
      
      render(<CornellPanel contentId={mockContentId} />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle.*mode/i });
      fireEvent.click(toggleButton);
      
      const cueInput = screen.getByPlaceholderText(/cue column/i);
      fireEvent.change(cueInput, { target: { value: 'Test' } });
      
      vi.advanceTimersByTime(2000);
      
      await waitFor(() => {
        expect(screen.getByText(/error.*save/i)).toBeInTheDocument();
      });
      
      vi.useRealTimers();
    });
  });
});
