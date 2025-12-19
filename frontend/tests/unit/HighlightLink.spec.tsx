/**
 * Unit Tests - Highlight Link Component
 * 
 * Tests highlight creation and interaction:
 * - Click to create highlight
 * - Display existing highlights
 * - Delete highlights
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HighlightLink } from '@/components/cornell/HighlightLink';

const mockCreateHighlight = vi.fn();
const mockDeleteHighlight = vi.fn();

vi.mock('@/lib/api', () => ({
  createHighlight: (...args: any[]) => mockCreateHighlight(...args),
  deleteHighlight: (...args: any[]) => mockDeleteHighlight(...args),
}));

describe('HighlightLink Component', () => {
  const mockContentId = 'content-123';
  const mockHighlight = {
    id: 'highlight-1',
    highlightedText: 'important text',
    anchorJson: { pageNumber: 1, coords: [0, 0, 100, 20] },
    linkedNoteId: 'note-1',
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Highlight Creation', () => {
    it('should create highlight on text selection', async () => {
      mockCreateHighlight.mockResolvedValue(mockHighlight);
      
      render(<HighlightLink contentId={mockContentId} />);
      
      // Simulate text selection
      const textElement = screen.getByTestId('selectable-text');
      fireEvent.mouseUp(textElement, {
        target: { textContent: 'important text' },
      });
      
      // Should show create highlight button
      const createButton = await screen.findByRole('button', { name: /create highlight/i });
      expect(createButton).toBeInTheDocument();
      
      // Click to create
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(mockCreateHighlight).toHaveBeenCalledWith(
          mockContentId,
          expect.objectContaining({
            highlightedText: 'important text',
          })
        );
      });
    });
    
    it('should link highlight to note', async () => {
      mockCreateHighlight.mockResolvedValue(mockHighlight);
      
      render(<HighlightLink contentId={mockContentId} noteId="note-1" />);
      
      const textElement = screen.getByTestId('selectable-text');
      fireEvent.mouseUp(textElement);
      
      const createButton = await screen.findByRole('button', { name: /create highlight/i });
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(mockCreateHighlight).toHaveBeenCalledWith(
          mockContentId,
          expect.objectContaining({
            linkedNoteId: 'note-1',
          })
        );
      });
    });
  });
  
  describe('Highlight Display', () => {
    it('should display existing highlights', () => {
      render(
        <HighlightLink 
          contentId={mockContentId}
          highlights={[mockHighlight]}
        />
      );
      
      const highlighted = screen.getByText('important text');
      expect(highlighted).toHaveClass('highlight');
    });
    
    it('should show different colors for different types', () => {
      const highlights = [
        { ...mockHighlight, id: '1', type: 'DEFINITION', color: 'yellow' },
        { ...mockHighlight, id: '2', type: 'EXAMPLE', color: 'blue' },
        { ...mockHighlight, id: '3', type: 'IMPORTANT', color: 'red' },
      ];
      
      render(
        <HighlightLink 
          contentId={mockContentId}
          highlights={highlights}
        />
      );
      
      expect(screen.getByTestId('highlight-1')).toHaveStyle({ backgroundColor: 'yellow' });
      expect(screen.getByTestId('highlight-2')).toHaveStyle({ backgroundColor: 'blue' });
      expect(screen.getByTestId('highlight-3')).toHaveStyle({ backgroundColor: 'red' });
    });
  });
  
  describe('Highlight Interaction', () => {
    it('should show tooltip on hover', async () => {
      render(
        <HighlightLink 
          contentId={mockContentId}
          highlights={[mockHighlight]}
        />
      );
      
      const highlighted = screen.getByText('important text');
      fireEvent.mouseEnter(highlighted);
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });
    
    it('should navigate to linked note on click', async () => {
      const mockScrollTo = vi.fn();
      window.scrollTo = mockScrollTo;
      
      render(
        <HighlightLink 
          contentId={mockContentId}
          highlights={[mockHighlight]}
        />
      );
      
      const highlighted = screen.getByText('important text');
      fireEvent.click(highlighted);
      
      await waitFor(() => {
        expect(mockScrollTo).toHaveBeenCalled();
      });
    });
  });
  
  describe('Highlight Deletion', () => {
    it('should delete highlight on remove', async () => {
      mockDeleteHighlight.mockResolvedValue({ success: true });
      
      render(
        <HighlightLink 
          contentId={mockContentId}
          highlights={[mockHighlight]}
        />
      );
      
      const highlighted = screen.getByText('important text');
      fireEvent.contextMenu(highlighted);
      
      const deleteButton = await screen.findByRole('button', { name: /delete highlight/i });
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(mockDeleteHighlight).toHaveBeenCalledWith(mockHighlight.id);
      });
    });
  });
});
