const vi = jest;
import { render, screen } from '@testing-library/react';
import { StreamCard } from '@/components/cornell/StreamCard';
import { ITEM_TYPE_LABELS } from '@/lib/cornell/labels';
import type { QuestionStreamItem, ImportantStreamItem } from '@/lib/types/unified-stream';

describe('StreamCard - Phase 2 New Types', () => {
  describe('QuestionCard', () => {
    it('should display question with QUESTION label from constants', () => {
      const mockQuestion: QuestionStreamItem = {
        type: 'question',
        id: 'q-1',
        question: 'O que significa fotossíntese?',
        resolved: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(<StreamCard item={mockQuestion} />);

      // Verify label from constants
      expect(screen.getByText(ITEM_TYPE_LABELS.QUESTION)).toBeInTheDocument();
      
      // Verify question content
      expect(screen.getByText('O que significa fotossíntese?')).toBeInTheDocument();
    });

    it('should show resolved status when question has AI response', () => {
      const mockResolvedQuestion: QuestionStreamItem = {
        type: 'question',
        id: 'q-2',
        question: 'Como funciona a mitocôndria?',
        resolved: true,
        aiResponseId: 'ai-resp-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(<StreamCard item={mockResolvedQuestion} />);

      // Should show AI response indicator using constant
      expect(screen.getByText(`${ITEM_TYPE_LABELS.AI_RESPONSE} respondeu`)).toBeInTheDocument();
    });

    it('should display section if provided', () => {
      const mockQuestion: QuestionStreamItem = {
        type: 'question',
        id: 'q-3',
        question: 'Test question',
        section: 'Capítulo 2',
        resolved: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(<StreamCard item={mockQuestion} />);

      expect(screen.getByText(/Capítulo 2/)).toBeInTheDocument();
    });
  });

  describe('ImportantCard', () => {
    it('should display important quote with IMPORTANT label from constants', () => {
      const mockImportant: ImportantStreamItem = {
        type: 'important',
        id: 'star-1',
        quote: 'A fotossíntese é o processo pelo qual plantas convertem luz em energia.',
        pageNumber: 42,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(<StreamCard item={mockImportant} />);

      // Verify label from constants
      expect(screen.getByText(ITEM_TYPE_LABELS.IMPORTANT)).toBeInTheDocument();
      expect(ITEM_TYPE_LABELS.IMPORTANT).toBe('Importante');
      
      // Verify quote content
      expect(screen.getByText(/"A fotossíntese é o processo/)).toBeInTheDocument();
      
      // Verify page number
      expect(screen.getByText(/Pg\. 42/)).toBeInTheDocument();
    });

    it('should display optional note if provided', () => {
      const mockImportant: ImportantStreamItem = {
        type: 'important',
        id: 'star-2',
        quote: 'Important concept',
        note: 'Cai na prova!',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(<StreamCard item={mockImportant} />);

      expect(screen.getByText('Cai na prova!')).toBeInTheDocument();
    });
  });

  describe('NO Hard-Coded Labels', () => {
    it('should use centralized constants for all new card types', () => {
      const question: QuestionStreamItem = {
        type: 'question',
        id: 'q-test',
        question: 'Test',
        resolved: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(<StreamCard item={question} />);
      
      // All labels should come from ITEM_TYPE_LABELS constant
      const label = screen.getByText(ITEM_TYPE_LABELS.QUESTION);
      expect(label).toBeInTheDocument();
    });
  });
});
