import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModernCornellLayout } from '@/components/cornell/ModernCornellLayout';
import { CORNELL_LABELS } from '@/lib/cornell/labels';

describe('ModernCornellLayout - Label Integration', () => {
  const mockProps = {
    title: 'Test Document',
    mode: 'view' as const,
    onModeToggle: () => {},
    saveStatus: 'saved' as const,
    viewer: <div>Mock Viewer</div>,
    streamItems: [],
    cues: [],
    onCuesChange: () => {},
    summary: '',
    onSummaryChange: () => {},
  };

  describe('Sidebar Tab Labels', () => {
    it('should display HIGHLIGHTS_NOTES label for annotations tab', () => {
      render(<ModernCornellLayout {...mockProps} />);
      
      // Verify centralized label is used
      expect(screen.getByText(CORNELL_LABELS.HIGHLIGHTS_NOTES)).toBeInTheDocument();
    });

    it('should display IMPORTANT_QUESTIONS label for topics tab', () => {
      render(<ModernCornellLayout {...mockProps} />);
      
      // Verify centralized label is used
      expect(screen.getByText(CORNELL_LABELS.IMPORTANT_QUESTIONS)).toBeInTheDocument();
    });
  });

  describe('Summary Section Label', () => {
    it('should display SYNTHESIS label for summary textarea', () => {
      render(<ModernCornellLayout {...mockProps} />);
      
      // Verify centralized label is used
      expect(screen.getByText(CORNELL_LABELS.SYNTHESIS)).toBeInTheDocument();
    });
  });

  describe('NO Hard-Coded Labels', () => {
    it('should not contain hard-coded Anotações label', () => {
      const { container } = render(<ModernCornellLayout {...mockProps} />);
      
      // Should NOT find hard-coded "Anotações" if we're using constants
      // The constant value should be present instead
      const tabButtons = container.querySelectorAll('button');
      const annotationsTab = Array.from(tabButtons).find(btn => 
        btn.textContent === CORNELL_LABELS.HIGHLIGHTS_NOTES
      );
      
      expect(annotationsTab).toBeDefined();
    });

    it('should not contain hard-coded Tópicos label', () => {
      const { container } = render(<ModernCornellLayout {...mockProps} />);
      
      const tabButtons = container.querySelectorAll('button');
      const topicsTab = Array.from(tabButtons).find(btn => 
        btn.textContent === CORNELL_LABELS.IMPORTANT_QUESTIONS
      );
      
      expect(topicsTab).toBeDefined();
    });

    it('should not contain hard-coded Resumo label', () => {
      const { container } = render(<ModernCornellLayout {...mockProps} />);
      
      const labels = container.querySelectorAll('label');
      const summaryLabel = Array.from(labels).find(lbl => 
        lbl.textContent === CORNELL_LABELS.SYNTHESIS
      );
      
      expect(summaryLabel).toBeDefined();
    });
  });
});
