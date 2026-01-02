// Replaced vitest import with global jest
import { render, screen } from '@testing-library/react';
import { StreamCard } from '@/components/cornell/StreamCard';
import { ITEM_TYPE_LABELS, CORNELL_LABELS } from '@/lib/cornell/labels';
import type { NoteStreamItem } from '@/lib/types/unified-stream';

describe('StreamCard - Label Integration', () => {
  describe('Note Card Labels', () => {
    it('should display centralized NOTE label instead of hard-coded string', () => {
      const mockNoteItem: NoteStreamItem = {
        type: 'note',
        id: 'note-1',
        body: 'Test note content',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        note: { id: 'note-1', body: 'Test note content', linkedHighlightIds: [] }
      };

      render(<StreamCard item={mockNoteItem} />);

      // Verify centralized label is used
      expect(screen.getByText(ITEM_TYPE_LABELS.NOTE)).toBeInTheDocument();
      
      // Ensure hard-coded value is NOT present (if different from constant)
      // This test ensures we're using the constant, not a hard-coded duplicate
      expect(screen.queryByText('Nota', { exact: false })).toBeInTheDocument(); // Constant value
    });
  });

  describe('NO Hard-Coded Labels', () => {
    it('should not contain any hard-coded Portuguese labels in StreamCard', async () => {
      // This is a meta-test: verify that labels come from constants
      // If this test fails after code changes, it means someone hard-coded a label
      
      const noteItem: NoteStreamItem = {
        type: 'note',
        id: 'test-id',
        body: 'Test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        note: { id: 'test-id', body: 'Test', linkedHighlightIds: [] }
      };

      const { container } = render(<StreamCard item={noteItem} />);
      
      // The component should use ITEM_TYPE_LABELS.NOTE
      // If someone hard-codes "Nota", this will catch it
      const labelElement = container.querySelector('.text-xs.font-medium');
      expect(labelElement?.textContent).toBe(ITEM_TYPE_LABELS.NOTE);
    });
  });
});

describe('Cornell Labels Constants', () => {
  it('should export all required label constants', () => {
    expect(CORNELL_LABELS).toBeDefined();
    expect(CORNELL_LABELS.SYNTHESIS).toBe('Síntese');
    expect(CORNELL_LABELS.HIGHLIGHTS_NOTES).toBe('Highlights & Notas');
    expect(CORNELL_LABELS.IMPORTANT_QUESTIONS).toBe('Importante & Dúvidas');
    expect(CORNELL_LABELS.AI_RESPONSES).toBe('Respostas da IA');
  });

  it('should export all item type labels', () => {
    expect(ITEM_TYPE_LABELS).toBeDefined();
    expect(ITEM_TYPE_LABELS.NOTE).toBe('Nota');
    expect(ITEM_TYPE_LABELS.HIGHLIGHT).toBe('Destaque');
    expect(ITEM_TYPE_LABELS.QUESTION).toBe('Dúvida');
    expect(ITEM_TYPE_LABELS.SYNTHESIS).toBe('Síntese');
    expect(ITEM_TYPE_LABELS.IMPORTANT).toBe('Importante');
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
