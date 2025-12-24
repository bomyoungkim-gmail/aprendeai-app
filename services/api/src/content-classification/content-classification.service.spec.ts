import { Test, TestingModule } from '@nestjs/testing';
import { ContentClassificationService } from './content-classification.service';

describe('ContentClassificationService', () => {
  let service: ContentClassificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContentClassificationService],
    }).compile();

    service = module.get<ContentClassificationService>(ContentClassificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('classifyContent', () => {
    it('should return existing classification if provided', async () => {
      const existing = {
        ageMin: 10,
        ageMax: 14,
        contentRating: 'PG' as const,
        complexity: 'INTERMEDIATE' as const,
        topics: ['math'],
        confidence: 1,
      };

      const result = await service.classifyContent({
        title: 'Test',
        existingClassification: existing,
      });

      expect(result).toEqual(existing);
    });

    it('should classify basic content for young ages', async () => {
      const result = await service.classifyContent({
        title: 'Aprendendo ABC e números básicos',
        description: 'Formas e cores para crianças',
      });

      expect(result.ageMin).toBeLessThanOrEqual(8);
      expect(result.complexity).toBe('BASIC');
      expect(result.contentRating).toBe('G');
    });

    it('should classify intermediate content', async () => {
      const result = await service.classifyContent({
        title: 'Multiplicação e divisão',
        description: 'Frações e números decimais',
      });

      expect(result.complexity).toBe('INTERMEDIATE');
      expect(result.ageMin).toBeGreaterThanOrEqual(8);
      expect(result.ageMax).toBeLessThanOrEqual(12);
    });

    it('should classify advanced content for teens', async () => {
      const result = await service.classifyContent({
        title: 'Introdução à Álgebra',
        description: 'Equações e funções', 
      });

      expect(result.complexity).toBe('ADVANCED');
      expect(result.ageMin).toBeGreaterThanOrEqual(12);
      expect(result.contentRating).toMatch(/PG-13|TEEN/);
    });

    it('should provide confidence score', async () => {
      const result = await service.classifyContent({
        title: 'Test Content',
      });

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('filterContentByAge', () => {
    const mockContent = [
      { id: '1', title: 'Basic Math', ageMin: 4, ageMax: 8 },
      { id: '2', title: 'Intermediate Science', ageMin: 8, ageMax: 12 },
      { id: '3', title: 'Advanced Physics', ageMin: 12, ageMax: 18 },
      { id: '4', title: 'Unclassified' }, // No age limits
    ];

    it('should filter content within age range', () => {
      const filtered = service.filterContentByAge(mockContent, {
        minAge: 6,
        maxAge: 14,
      });

      expect(filtered).toContainEqual(mockContent[0]); // 4-8 within 6-14
      expect(filtered).toContainEqual(mockContent[1]); // 8-12 within 6-14
      expect(filtered).toContainEqual(mockContent[3]); // Unclassified passes
      expect(filtered).not.toContainEqual(mockContent[2]); // 12-18 exceeds max
    });

    it('should include unclassified content', () => {
      const filtered = service.filterContentByAge(mockContent, {
        minAge: 5,
        maxAge: 7,
      });

      expect(filtered).toContainEqual(mockContent[3]);
    });
  });

  describe('suggestClassification', () => {
    it('should suggest classification with confidence', async () => {
      const result = await service.suggestClassification(
        'content-123',
        'Divisão Simples',
        'Aprendendo divisão básica'
      );

      expect(result.contentId).toBe('content-123');
      expect(result.suggested).toBeDefined();
      expect(result.suggested.ageMin).toBeDefined();
      expect(result.message).toContain('AI suggests');
    });

    it('should flag low confidence for review', async () => {
      const result = await service.suggestClassification(
        'content-456',
        'Unknown Topic',
      );

      expect(result.needsReview).toBeDefined();
      expect(typeof result.needsReview).toBe('boolean');
    });
  });
});
