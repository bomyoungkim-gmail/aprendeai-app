import { ContentModeHelper } from './content-mode.helper';
import { ContentMode, ContentType } from '@prisma/client';

describe('ContentModeHelper', () => {
  describe('resolveMode - Priority Logic', () => {
    it('P1: should use DB mode when available (takes precedence)', () => {
      const content = {
        mode: 'NARRATIVE' as ContentMode,
        modeSource: 'PRODUCER',
        modeSetBy: 'user123',
        type: 'NEWS' as ContentType, // Different type to verify DB wins
        metadata: {},
      };

      const result = ContentModeHelper.resolveMode(content, 'TECHNICAL', 'user456');

      expect(result.mode).toBe('NARRATIVE');
      expect(result.source).toBe('PRODUCER');
      expect(result.setBy).toBe('user123');
      expect(result.isHeuristic).toBe(false);
    });

    it('P2: should use UI mode when DB is null', () => {
      const content = {
        mode: null,
        type: 'TEXT' as ContentType,
        metadata: {},
      };

      const result = ContentModeHelper.resolveMode(content, 'SCIENTIFIC', 'user789');

      expect(result.mode).toBe('SCIENTIFIC');
      expect(result.source).toBe('USER');
      expect(result.setBy).toBe('user789');
      expect(result.isHeuristic).toBe(false);
    });

    it('P3: should use heuristic when both DB and UI are null', () => {
      const content = {
        mode: null,
        type: 'ARXIV' as ContentType,
        metadata: {},
      };

      const result = ContentModeHelper.resolveMode(content);

      expect(result.mode).toBe('SCIENTIFIC');
      expect(result.source).toBe('HEURISTIC');
      expect(result.setBy).toBe('SYSTEM');
      expect(result.isHeuristic).toBe(true);
    });

    it('should ignore invalid UI mode and fall back to heuristic', () => {
      const content = {
        mode: null,
        type: 'NEWS' as ContentType,
        metadata: {},
      };

      const result = ContentModeHelper.resolveMode(content, 'INVALID_MODE');

      expect(result.mode).toBe('NEWS');
      expect(result.source).toBe('HEURISTIC');
      expect(result.isHeuristic).toBe(true);
    });
  });

  describe('inferFromType - Direct Mappings', () => {
    it('should map NEWS to NEWS', () => {
      const content = { type: 'NEWS' as ContentType, metadata: {} };
      expect(ContentModeHelper.inferFromType(content)).toBe('NEWS');
    });

    it('should map ARXIV to SCIENTIFIC', () => {
      const content = { type: 'ARXIV' as ContentType, metadata: {} };
      expect(ContentModeHelper.inferFromType(content)).toBe('SCIENTIFIC');
    });

    it('should map SCHOOL_MATERIAL to DIDACTIC', () => {
      const content = { type: 'SCHOOL_MATERIAL' as ContentType, metadata: {} };
      expect(ContentModeHelper.inferFromType(content)).toBe('DIDACTIC');
    });

    it('should map ARTICLE to TECHNICAL by default', () => {
      const content = { type: 'ARTICLE' as ContentType, metadata: {} };
      expect(ContentModeHelper.inferFromType(content)).toBe('TECHNICAL');
    });

    it('should map WEB_CLIP to TECHNICAL by default', () => {
      const content = { type: 'WEB_CLIP' as ContentType, metadata: {} };
      expect(ContentModeHelper.inferFromType(content)).toBe('TECHNICAL');
    });

    it('should map TEXT to TECHNICAL by default', () => {
      const content = { type: 'TEXT' as ContentType, metadata: {} };
      expect(ContentModeHelper.inferFromType(content)).toBe('TECHNICAL');
    });

    it('should map PDF to TECHNICAL (default case)', () => {
      const content = { type: 'PDF' as ContentType, metadata: {} };
      expect(ContentModeHelper.inferFromType(content)).toBe('TECHNICAL');
    });
  });

  describe('inferFromType - Narrative Detection', () => {
    it('should detect narrative from metadata genre (fiction)', () => {
      const content = {
        type: 'TEXT' as ContentType,
        metadata: { genre: 'fiction' },
      };
      expect(ContentModeHelper.inferFromType(content)).toBe('NARRATIVE');
    });

    it('should detect narrative from metadata genre (novel)', () => {
      const content = {
        type: 'ARTICLE' as ContentType,
        metadata: { genre: 'Novel' },
      };
      expect(ContentModeHelper.inferFromType(content)).toBe('NARRATIVE');
    });

    it('should detect narrative from metadata genre (ficção)', () => {
      const content = {
        type: 'TEXT' as ContentType,
        metadata: { genre: 'Ficção Científica' },
      };
      expect(ContentModeHelper.inferFromType(content)).toBe('NARRATIVE');
    });

    it('should detect narrative from high quotation mark density', () => {
      const content = {
        type: 'TEXT' as ContentType,
        metadata: {},
        rawText: '"Hello," she said. "How are you?" he replied. "Fine," she answered.',
      };
      expect(ContentModeHelper.inferFromType(content)).toBe('NARRATIVE');
    });

    it('should detect narrative from keywords (capítulo)', () => {
      const content = {
        type: 'TEXT' as ContentType,
        metadata: {},
        rawText: 'Capítulo 1: O início da jornada do protagonista',
      };
      expect(ContentModeHelper.inferFromType(content)).toBe('NARRATIVE');
    });

    it('should detect narrative from keywords (personagem)', () => {
      const content = {
        type: 'ARTICLE' as ContentType,
        metadata: {},
        rawText: 'O personagem principal enfrenta um dilema moral',
      };
      expect(ContentModeHelper.inferFromType(content)).toBe('NARRATIVE');
    });

    it('should not detect narrative for technical text', () => {
      const content = {
        type: 'TEXT' as ContentType,
        metadata: {},
        rawText: 'The algorithm complexity is O(n log n) for this implementation.',
      };
      expect(ContentModeHelper.inferFromType(content)).toBe('TECHNICAL');
    });
  });

  describe('inferFromType - VIDEO/AUDIO Inheritance', () => {
    it('should inherit mode from metadata.contentMode', () => {
      const content = {
        type: 'VIDEO' as ContentType,
        metadata: { contentMode: 'DIDACTIC' },
      };
      expect(ContentModeHelper.inferFromType(content)).toBe('DIDACTIC');
    });

    it('should inherit mode from metadata.mode', () => {
      const content = {
        type: 'AUDIO' as ContentType,
        metadata: { mode: 'SCIENTIFIC' },
      };
      expect(ContentModeHelper.inferFromType(content)).toBe('SCIENTIFIC');
    });

    it('should detect DIDACTIC from description (aula)', () => {
      const content = {
        type: 'VIDEO' as ContentType,
        metadata: { description: 'Aula de matemática sobre equações' },
      };
      expect(ContentModeHelper.inferFromType(content)).toBe('DIDACTIC');
    });

    it('should detect DIDACTIC from description (tutorial)', () => {
      const content = {
        type: 'VIDEO' as ContentType,
        metadata: { description: 'Tutorial completo de programação' },
      };
      expect(ContentModeHelper.inferFromType(content)).toBe('DIDACTIC');
    });

    it('should detect NEWS from description (notícia)', () => {
      const content = {
        type: 'AUDIO' as ContentType,
        metadata: { description: 'Notícia sobre economia global' },
      };
      expect(ContentModeHelper.inferFromType(content)).toBe('NEWS');
    });

    it('should detect NEWS from description (reportagem)', () => {
      const content = {
        type: 'VIDEO' as ContentType,
        metadata: { description: 'Reportagem especial sobre meio ambiente' },
      };
      expect(ContentModeHelper.inferFromType(content)).toBe('NEWS');
    });

    it('should detect SCIENTIFIC from description (pesquisa)', () => {
      const content = {
        type: 'VIDEO' as ContentType,
        metadata: { description: 'Pesquisa sobre mudanças climáticas' },
      };
      expect(ContentModeHelper.inferFromType(content)).toBe('SCIENTIFIC');
    });

    it('should detect SCIENTIFIC from transcript', () => {
      const content = {
        type: 'AUDIO' as ContentType,
        metadata: { transcript: 'Este estudo científico demonstra...' },
      };
      expect(ContentModeHelper.inferFromType(content)).toBe('SCIENTIFIC');
    });

    it('should default to TECHNICAL when no patterns match', () => {
      const content = {
        type: 'VIDEO' as ContentType,
        metadata: { description: 'Random video content' },
      };
      expect(ContentModeHelper.inferFromType(content)).toBe('TECHNICAL');
    });

    it('should default to TECHNICAL when no metadata', () => {
      const content = {
        type: 'AUDIO' as ContentType,
        metadata: {},
      };
      expect(ContentModeHelper.inferFromType(content)).toBe('TECHNICAL');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing metadata gracefully', () => {
      const content = {
        mode: null,
        type: 'TEXT' as ContentType,
      };

      const result = ContentModeHelper.resolveMode(content);

      expect(result.mode).toBe('TECHNICAL');
      expect(result.isHeuristic).toBe(true);
    });

    it('should handle empty rawText', () => {
      const content = {
        type: 'TEXT' as ContentType,
        metadata: {},
        rawText: '',
      };
      expect(ContentModeHelper.inferFromType(content)).toBe('TECHNICAL');
    });

    it('should handle very long rawText (skip heuristic)', () => {
      const content = {
        type: 'TEXT' as ContentType,
        metadata: {},
        rawText: 'a'.repeat(10000) + 'capítulo', // Too long, won't check keywords
      };
      expect(ContentModeHelper.inferFromType(content)).toBe('TECHNICAL');
    });

    it('should set userId when provided for UI override', () => {
      const content = {
        mode: null,
        type: 'TEXT' as ContentType,
        metadata: {},
      };

      const result = ContentModeHelper.resolveMode(content, 'NARRATIVE', 'user-abc-123');

      expect(result.setBy).toBe('user-abc-123');
    });

    it('should default to SYSTEM when userId not provided for UI override', () => {
      const content = {
        mode: null,
        type: 'TEXT' as ContentType,
        metadata: {},
      };

      const result = ContentModeHelper.resolveMode(content, 'NARRATIVE');

      expect(result.setBy).toBe('SYSTEM');
    });
  });
});
