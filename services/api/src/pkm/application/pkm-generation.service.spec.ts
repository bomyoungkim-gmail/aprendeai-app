import { Test, TestingModule } from '@nestjs/testing';
import { PkmGenerationService } from './pkm-generation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DecisionService } from '../../decision/application/decision.service';
import { IPkmNoteRepository } from '../domain/repositories/pkm-note.repository.interface';
import { PkmNoteStatus } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('PkmGenerationService', () => {
  let service: PkmGenerationService;
  let prisma: PrismaService;
  let decision: DecisionService;
  let repo: IPkmNoteRepository;

  const mockPrisma = {
    reading_sessions: {
      findUnique: jest.fn(),
    },
  };

  const mockDecision = {
    evaluateExtractionPolicy: jest.fn(),
  };

  const mockRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PkmGenerationService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: DecisionService,
          useValue: mockDecision,
        },
        {
          provide: IPkmNoteRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<PkmGenerationService>(PkmGenerationService);
    prisma = module.get<PrismaService>(PrismaService);
    decision = module.get<DecisionService>(DecisionService);
    repo = module.get<IPkmNoteRepository>(IPkmNoteRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateFromSession', () => {
    const userId = 'user-1';
    const sessionId = 'session-1';
    const contentId = 'content-1';

    it('should generate PKM note successfully from metadata', async () => {
      // Mock session data
      const mockSession = {
        id: sessionId,
        user_id: userId,
        content_id: contentId,
        // mission_id removed as it doesn't exist on reading_sessions model
        contents: {
          cornell_notes: [
            {
              id: 'cornell-1',
              summary_text: 'Summary First Line\nSummary definition paragraph.',
            },
          ],
          section_transfer_metadata: [
            {
              id: 'meta-1',
              concept_json: JSON.stringify({
                name: 'Photosynthesis',
                definition: 'Process by which plants use sunlight.',
                structure: 'A leads to B',
              }),
              analogies_json: JSON.stringify(['Like a solar panel']),
              domains_json: JSON.stringify({
                near: 'Botany',
                far: 'Energy Systems',
              }),
              tier2_json: JSON.stringify(['chlorophyll', 'energy']),
            },
          ],
        },
      };

      mockPrisma.reading_sessions.findUnique.mockResolvedValue(mockSession);
      mockRepo.create.mockImplementation((note) => Promise.resolve(note));

      const result = await service.generateFromSession(userId, sessionId);

      expect(mockPrisma.reading_sessions.findUnique).toHaveBeenCalledWith({
        where: { id: sessionId },
        include: expect.any(Object),
      });

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          title: 'Photosynthesis',
          status: 'GENERATED',
          backlinks: {
            nearDomain: 'Botany',
            farDomain: 'Energy Systems',
          },
        }),
      );

      // Verify body contains markdown sections
      expect(mockRepo.create.mock.calls[0][0].bodyMd).toContain('# Photosynthesis');
      expect(mockRepo.create.mock.calls[0][0].bodyMd).toContain('## Definition');
      expect(mockRepo.create.mock.calls[0][0].bodyMd).toContain('## Analogy');
      expect(mockRepo.create.mock.calls[0][0].bodyMd).toContain('Like a solar panel');
    });

    it('should fallback to cornell summary when metadata is missing', async () => {
      const mockSession = {
        id: sessionId,
        user_id: userId,
        content_id: contentId,
        contents: {
          cornell_notes: [
            {
              id: 'cornell-1',
              summary_text: 'Fallback Title\nFallback Definition paragraph.',
            },
          ],
          section_transfer_metadata: [
            {
              id: 'meta-1',
              // Empty metadata
            },
          ],
        },
      };

      mockPrisma.reading_sessions.findUnique.mockResolvedValue(mockSession);
      mockRepo.create.mockImplementation((note) => Promise.resolve(note));

      await service.generateFromSession(userId, sessionId);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Fallback Title',
        }),
      );
    });

    it('should throw NotFoundException if session not found', async () => {
      mockPrisma.reading_sessions.findUnique.mockResolvedValue(null);
      await expect(service.generateFromSession(userId, sessionId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('confirmSave', () => {
    it('should update status to SAVED', async () => {
      const noteId = 'note-1';
      const userId = 'user-1';
      const mockNote = { id: noteId, userId, status: 'GENERATED' };

      mockRepo.findById.mockResolvedValue(mockNote);
      mockRepo.updateStatus.mockResolvedValue({
        ...mockNote,
        status: 'SAVED',
      });

      const result = await service.confirmSave(noteId, userId);

      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        noteId,
        PkmNoteStatus.SAVED,
      );
      expect(result.status).toBe('SAVED');
    });
  });
});
