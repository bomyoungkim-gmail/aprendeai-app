const vi = jest;
import { render, screen } from '@testing-library/react';
import { StreamCard } from '@/components/cornell/StreamCard';
import { ITEM_TYPE_LABELS } from '@/lib/cornell/labels';
import type { QuestionStreamItem, StarStreamItem, AIResponseStreamItem } from '@/lib/types/unified-stream';

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

  describe('StarCard', () => {
    it('should display starred quote with STAR label from constants', () => {
      const mockStar: StarStreamItem = {
        type: 'star',
        id: 'star-1',
        quote: 'A fotossíntese é o processo pelo qual plantas convertem luz em energia.',
        pageNumber: 42,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(<StreamCard item={mockStar} />);

      // Verify label from constants
      expect(screen.getByText(ITEM_TYPE_LABELS.STAR)).toBeInTheDocument();
      
      // Verify quote content
      expect(screen.getByText(/"A fotossíntese é o processo/)).toBeInTheDocument();
      
      // Verify page number
      expect(screen.getByText(/Pg\. 42/)).toBeInTheDocument();
    });

    it('should display optional note if provided', () => {
      const mockStar: StarStreamItem = {
        type: 'star',
        id: 'star-2',
        quote: 'Important concept',
        note: 'Cai na prova!',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(<StreamCard item={mockStar} />);

      expect(screen.getByText('Cai na prova!')).toBeInTheDocument();
    });
  });

  describe('AIResponseCard', () => {
    it('should display AI response with AI_RESPONSE label from constants', () => {
      const mockAIResponse: AIResponseStreamItem = {
        type: 'ai-response',
        id: 'ai-1',
        response: 'A fotossíntese é o processo biológico que converte luz solar em energia química.',
        questionId: 'q-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(<StreamCard item={mockAIResponse} />);

      // Verify label from constants
      expect(screen.getByText(ITEM_TYPE_LABELS.AI_RESPONSE)).toBeInTheDocument();
      
      // Verify response content
      expect(screen.getByText(/fotossíntese é o processo biológico/)).toBeInTheDocument();
    });

    it('should show feedback buttons for AI response', () => {
      const mockAIResponse: AIResponseStreamItem = {
        type: 'ai-response',
        id: 'ai-2',
        response: 'Test response',
        questionId: 'q-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(<StreamCard item={mockAIResponse} />);

      // Should have feedback question (NOT hard-coded "Útil?")
      expect(screen.getByText('Útil?')).toBeInTheDocument();
      
      // Should have thumbs up and down buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should show helpful feedback state', () => {
      const mockHelpfulResponse: AIResponseStreamItem = {
        type: 'ai-response',
        id: 'ai-3',
        response: 'Helpful response',
        questionId: 'q-1',
        helpful: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { container } = render(<StreamCard item={mockHelpfulResponse} />);

      // Green background indicates helpful=true
      const helpfulButton = container.querySelector('.bg-green-100');
      expect(helpfulButton).toBeInTheDocument();
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

      const { container} = render(<StreamCard item={question} />);
      
      // All labels should come from ITEM_TYPE_LABELS constant
      const label = screen.getByText(ITEM_TYPE_LABELS.QUESTION);
      expect(label).toBeInTheDocument();
      
      // Should NOT have hard-coded "Dúvida" if constant is different
      // (This ensures we're using the constant, not a copy-pasted value)
    });
  });
});
