import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ContentModeService } from '../content-mode.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ContentMode } from '@prisma/client';

/**
 * Unit tests for ContentModeService
 * 
 * Following best practices:
 * - Test business logic in isolation
 * - Mock external dependencies (PrismaService)
 * - Test all edge cases and error paths
 * - Clear test names describing behavior
 */
describe('ContentModeService', () => {
  let service: ContentModeService;
  let prismaService: jest.Mocked<PrismaService>;

  // Mock PrismaService
  const mockPrismaService = {
    contents: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentModeService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ContentModeService>(ContentModeService);
    prismaService = module.get(PrismaService);

    // Clear mocks before each test
    jest.clearAllMocks();
  });

  describe('getMode', () => {
    it('should return PRODUCER mode when source is PRODUCER', async () => {
      // Arrange
      const mockContent = {
        mode: ContentMode.DIDACTIC,
        mode_source: 'PRODUCER',
        title: 'Test Content',
        type: 'PDF',
      };
      mockPrismaService.contents.findUnique.mockResolvedValue(mockContent as any);

      // Act
      const result = await service.getMode('content-123');

      // Assert
      expect(result).toBe(ContentMode.DIDACTIC);
      expect(prismaService.contents.findUnique).toHaveBeenCalledWith({
        where: { id: 'content-123' },
        select: {
          mode: true,
          mode_source: true,
          title: true,
          type: true,
        },
      });
    });

    it('should return USER mode when source is USER', async () => {
      // Arrange
      const mockContent = {
        mode: ContentMode.TECHNICAL,
        mode_source: 'USER',
        title: 'Test Content',
        type: 'PDF',
      };
      mockPrismaService.contents.findUnique.mockResolvedValue(mockContent as any);

      // Act
      const result = await service.getMode('content-123');

      // Assert
      expect(result).toBe(ContentMode.TECHNICAL);
    });

    it('should infer mode when mode is null', async () => {
      // Arrange
      const mockContent = {
        mode: null,
        mode_source: null,
        title: 'Learn English Vocabulary',
        type: 'PDF',
      };
      mockPrismaService.contents.findUnique.mockResolvedValue(mockContent as any);

      // Act
      const result = await service.getMode('content-123');

      // Assert
      expect(result).toBe(ContentMode.LANGUAGE);
    });

    it('should throw NotFoundException when content does not exist', async () => {
      // Arrange
      mockPrismaService.contents.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getMode('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getMode('non-existent')).rejects.toThrow(
        'Content with ID non-existent not found',
      );
    });
  });

  describe('getModeInfo', () => {
    it('should return full mode information', async () => {
      // Arrange
      const mockContent = {
        mode: ContentMode.SCIENTIFIC,
        mode_source: 'USER',
        mode_set_by: 'user-123',
        mode_set_at: new Date('2025-01-01'),
        title: 'Research Paper',
        type: 'PDF',
      };
      mockPrismaService.contents.findUnique.mockResolvedValue(mockContent as any);

      // Act
      const result = await service.getModeInfo('content-123');

      // Assert
      expect(result).toEqual({
        mode: ContentMode.SCIENTIFIC,
        modeSource: 'USER',
        modeSetBy: 'user-123',
        modeSetAt: new Date('2025-01-01'),
        inferredMode: null,
      });
    });

    it('should include inferred mode when mode is null', async () => {
      // Arrange
      const mockContent = {
        mode: null,
        mode_source: null,
        mode_set_by: null,
        mode_set_at: null,
        title: 'Breaking News Article',
        type: 'WEB',
      };
      mockPrismaService.contents.findUnique.mockResolvedValue(mockContent as any);

      // Act
      const result = await service.getModeInfo('content-123');

      // Assert
      expect(result.mode).toBeNull();
      expect(result.inferredMode).toBe(ContentMode.NEWS);
    });
  });

  describe('setMode', () => {
    it('should update content mode successfully', async () => {
      // Arrange
      const mockContent = { id: 'content-123' };
      mockPrismaService.contents.findUnique.mockResolvedValue(mockContent as any);
      mockPrismaService.contents.update.mockResolvedValue({} as any);

      // Act
      await service.setMode('content-123', ContentMode.NARRATIVE, 'user-123', 'USER');

      // Assert
      expect(prismaService.contents.update).toHaveBeenCalledWith({
        where: { id: 'content-123' },
        data: {
          mode: ContentMode.NARRATIVE,
          mode_source: 'USER',
          mode_set_by: 'user-123',
          mode_set_at: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundException when content does not exist', async () => {
      // Arrange
      mockPrismaService.contents.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.setMode('non-existent', ContentMode.NARRATIVE, 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should default to USER source when not specified', async () => {
      // Arrange
      const mockContent = { id: 'content-123' };
      mockPrismaService.contents.findUnique.mockResolvedValue(mockContent as any);
      mockPrismaService.contents.update.mockResolvedValue({} as any);

      // Act
      await service.setMode('content-123', ContentMode.DIDACTIC, 'user-123');

      // Assert
      expect(prismaService.contents.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            mode_source: 'USER',
          }),
        }),
      );
    });
  });

  describe('inferMode (private method - tested via getMode)', () => {
    const testCases = [
      { title: 'Learn English Vocabulary', expected: ContentMode.LANGUAGE },
      { title: 'Breaking News Today', expected: ContentMode.NEWS },
      { title: 'Scientific Research Paper', expected: ContentMode.SCIENTIFIC },
      { title: 'Technical Documentation API', expected: ContentMode.TECHNICAL },
      { title: 'Aula de Matemática', expected: ContentMode.DIDACTIC },
      { title: 'The Great Gatsby Novel', expected: ContentMode.NARRATIVE },
    ];

    testCases.forEach(({ title, expected }) => {
      it(`should infer ${expected} for title: "${title}"`, async () => {
        // Arrange
        const mockContent = {
          mode: null,
          mode_source: null,
          title,
          type: 'PDF',
        };
        mockPrismaService.contents.findUnique.mockResolvedValue(mockContent as any);

        // Act
        const result = await service.getMode('content-123');

        // Assert
        expect(result).toBe(expected);
      });
    });
  });
});
