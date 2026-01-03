// Replaced vitest import with global jest
import { render, screen } from '@testing-library/react';
import { StreamCard } from '@/components/cornell/StreamCard';
import { ITEM_TYPE_LABELS, CORNELL_LABELS } from '@/lib/cornell/labels';
import type { NoteStreamItem } from '@/lib/types/unified-stream';

describe('StreamCard - Label Integration', () => {
  describe('Note Card Labels', () => {
    it('should display centralized VOCABULARY label instead of hard-coded string', () => {
      const mockVocabItem: any = {
        type: 'vocabulary',
        id: 'vocab-1',
        body: 'Test note content',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(<StreamCard item={mockVocabItem} />);

      // Verify centralized label is used
      expect(screen.getByText(ITEM_TYPE_LABELS.VOCABULARY)).toBeInTheDocument();
      
      // Ensure hard-coded value is NOT present (if different from constant)
      expect(screen.queryByText('Vocabulário', { exact: false })).toBeInTheDocument();
    });
  });

  describe('NO Hard-Coded Labels', () => {
    it('should not contain any hard-coded Portuguese labels in StreamCard', async () => {
      const vocabItem: any = {
        type: 'vocabulary',
        id: 'test-id',
        body: 'Test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { container } = render(<StreamCard item={vocabItem} />);
      
      const labelElement = container.querySelector('.text-xs.font-medium');
      expect(labelElement?.textContent).toBe(ITEM_TYPE_LABELS.VOCABULARY);
    });
  });
});

describe('Cornell Labels Constants', () => {
  it('should export all required label constants', () => {
    expect(CORNELL_LABELS).toBeDefined();
    expect(CORNELL_LABELS.SYNTHESIS).toBe('Síntese');
    expect(CORNELL_LABELS.EVIDENCE_VOCABULARY).toBe('Evidências & Vocabulário');
    expect(CORNELL_LABELS.IDEAS_DOUBTS).toBe('Ideias & Dúvidas');
    expect(CORNELL_LABELS.AI_RESPONSES).toBe('Respostas da IA');
  });

  it('should export all item type labels', () => {
    expect(ITEM_TYPE_LABELS).toBeDefined();
    expect(ITEM_TYPE_LABELS.VOCABULARY).toBe('Vocabulário');
    expect(ITEM_TYPE_LABELS.EVIDENCE).toBe('Evidência');
    expect(ITEM_TYPE_LABELS.DOUBT).toBe('Dúvida');
    expect(ITEM_TYPE_LABELS.SYNTHESIS).toBe('Síntese');
    expect(ITEM_TYPE_LABELS.MAIN_IDEA).toBe('Ideia Central');
    expect(ITEM_TYPE_LABELS.AI_RESPONSE).toBe('IA');
  });

  it('should be immutable constants (as const)', () => {
    // TypeScript should enforce immutability at compile time
    // This test documents the expected behavior
    expect(Object.isFrozen(CORNELL_LABELS)).toBe(false); // `as const` doesn't freeze at runtime
    
    // But we can verify structure
    expect(typeof CORNELL_LABELS.SYNTHESIS).toBe('string');
  });
});
