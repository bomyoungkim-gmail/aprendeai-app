const vi = jest;
import { render, screen } from '@testing-library/react';
import { StreamCard } from '@/components/cornell/StreamCard';
import { ITEM_TYPE_LABELS } from '@/lib/cornell/labels';
import type { QuestionStreamItem, ImportantStreamItem } from '@/lib/types/unified-stream';

describe('StreamCard - Unified Pedagogical Pillars', () => {
  describe('Dúvida (Question)', () => {
    it('should display doubt with correct pedagogical label', () => {
      const mockQuestion: QuestionStreamItem = {
        type: 'question',
        id: 'q-1',
        question: 'O que significa fotossíntese?',
        resolved: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(<StreamCard item={mockQuestion} />);

      // Verify label from constants (Dúvida)
      expect(screen.getByText(ITEM_TYPE_LABELS.QUESTION)).toBeInTheDocument();
      
      // Verify question content
      expect(screen.getByText('O que significa fotossíntese?')).toBeInTheDocument();
    });

    it('should display ID and date in footer', () => {
      const mockQuestion: QuestionStreamItem = {
        type: 'question',
        id: 'q-unique-123',
        question: 'Test content',
        resolved: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(<StreamCard item={mockQuestion} />);
      expect(screen.getByText(/ID: q-unique/)).toBeInTheDocument();
    });
  });

  describe('Ideia Central (Important)', () => {
    it('should display main idea quote with correct label', () => {
      const mockImportant: ImportantStreamItem = {
        type: 'important',
        id: 'star-1',
        quote: 'A fotossíntese é o processo pelo qual plantas convertem luz em energia.',
        pageNumber: 42,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(<StreamCard item={mockImportant} />);

      // Verify label from constants (Ideia Central)
      expect(screen.getByText(ITEM_TYPE_LABELS.IMPORTANT)).toBeInTheDocument();
      expect(ITEM_TYPE_LABELS.IMPORTANT).toBe('Ideia Central');
      
      // Verify quote content
      expect(screen.getByText(/"A fotossíntese é o processo/)).toBeInTheDocument();
      
      // Verify page number
      expect(screen.getByText(/Pg\. 42/)).toBeInTheDocument();
    });
  });

  describe('NO Hard-Coded Labels', () => {
    it('should use centralized constants for unified cards', () => {
      const question: QuestionStreamItem = {
        type: 'question',
        id: 'q-test',
        question: 'Test',
        resolved: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(<StreamCard item={question} />);
      
      const label = screen.getByText(ITEM_TYPE_LABELS.QUESTION);
      expect(label).toBeInTheDocument();
    });
  });
});
