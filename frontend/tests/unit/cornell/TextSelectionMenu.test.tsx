import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextSelectionMenu, SelectionAction } from '@/components/cornell/TextSelectionMenu';
import { ACTION_LABELS } from '@/lib/cornell/labels';

describe('TextSelectionMenu', () => {
  const mockSelectionInfo = {
    text: 'Texto selecionado de exemplo',
    rect: {
      top: 100,
      left: 100,
      width: 200,
      height: 20,
      bottom: 120,
      right: 300,
    } as DOMRect,
  };

  const mockOnAction = vi.fn();

  it('should render correctly when visible', () => {
    render(
      <TextSelectionMenu 
        selectionInfo={mockSelectionInfo} 
        onAction={mockOnAction} 
      />
    );

    // Check for all action buttons using labels
    expect(screen.getByLabelText(ACTION_LABELS.HIGHLIGHT)).toBeInTheDocument();
    expect(screen.getByLabelText(ACTION_LABELS.NOTE)).toBeInTheDocument();
    expect(screen.getByLabelText(ACTION_LABELS.QUESTION)).toBeInTheDocument();
    expect(screen.getByLabelText(ACTION_LABELS.STAR)).toBeInTheDocument();
    expect(screen.getByLabelText(ACTION_LABELS.AI)).toBeInTheDocument();
  });

  it('should NOT render when selectionInfo is null', () => {
    const { container } = render(
      <TextSelectionMenu 
        selectionInfo={null} 
        onAction={mockOnAction} 
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should call onAction with "highlight" when Highlight button clicked', () => {
    render(
      <TextSelectionMenu 
        selectionInfo={mockSelectionInfo} 
        onAction={mockOnAction} 
      />
    );

    fireEvent.click(screen.getByLabelText(ACTION_LABELS.HIGHLIGHT));
    expect(mockOnAction).toHaveBeenCalledWith('highlight', mockSelectionInfo.text);
  });

  it('should call onAction with "note" when Note button clicked', () => {
    render(
      <TextSelectionMenu 
        selectionInfo={mockSelectionInfo} 
        onAction={mockOnAction} 
      />
    );

    fireEvent.click(screen.getByLabelText(ACTION_LABELS.NOTE));
    expect(mockOnAction).toHaveBeenCalledWith('note', mockSelectionInfo.text);
  });

  it('should call onAction with "star" when Star button clicked', () => {
    render(
      <TextSelectionMenu 
        selectionInfo={mockSelectionInfo} 
        onAction={mockOnAction} 
      />
    );

    fireEvent.click(screen.getByLabelText(ACTION_LABELS.STAR));
    expect(mockOnAction).toHaveBeenCalledWith('star', mockSelectionInfo.text);
  });

  it('should call onAction with "ai" when AI button clicked', () => {
    render(
      <TextSelectionMenu 
        selectionInfo={mockSelectionInfo} 
        onAction={mockOnAction} 
      />
    );

    fireEvent.click(screen.getByLabelText(ACTION_LABELS.AI));
    expect(mockOnAction).toHaveBeenCalledWith('ai', mockSelectionInfo.text);
  });
});
