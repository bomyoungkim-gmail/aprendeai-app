import { Test, TestingModule } from '@nestjs/testing';
import { AnnotationService } from './annotation.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { StudyGroupsWebSocketGateway } from '../websocket/study-groups-ws.gateway';

describe('AnnotationService', () => {
  let service: AnnotationService;
  let prisma: any;
  let wsGateway: any;

  beforeEach(async () => {
    const mockPrisma = {
      annotation: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const mockWsGateway = {
      emitToGroup: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnotationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StudyGroupsWebSocketGateway, useValue: mockWsGateway },
      ],
    }).compile();

    service = module.get<AnnotationService>(AnnotationService);
    prisma = mockPrisma;
    wsGateway = mockWsGateway;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a highlight annotation', async () => {
      const dto = {
        type: 'HIGHLIGHT' as const,
        startOffset: 0,
        endOffset: 10,
        selectedText: 'test text',
        color: 'yellow',
        visibility: 'PRIVATE' as const,
      };

      const expected = {
        id: '1',
        ...dto,
        contentId: 'content-1',
        userId: 'user-1',
        user: { id: 'user-1', name: 'Test User' },
      };

      prisma.annotation.create.mockResolvedValue(expected);

      const result = await service.create('content-1', 'user-1', dto);

      expect(result).toEqual(expected);
      expect(prisma.annotation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contentId: 'content-1',
          userId: 'user-1',
          type: 'HIGHLIGHT',
        }),
        include: expect.any(Object),
      });
    });

    it('should broadcast to group when visibility is GROUP', async () => {
      const dto = {
        type: 'NOTE' as const,
        startOffset: 0,
        endOffset: 10,
        text: 'My note',
        visibility: 'GROUP' as const,
        groupId: 'group-1',
      };

      const expected = { id: '1', ...dto };
      prisma.annotation.create.mockResolvedValue(expected);

      await service.create('content-1', 'user-1', dto);

      expect(wsGateway.emitToGroup).toHaveBeenCalledWith(
        'group-1',
        'annotation:created',
        expect.any(Object),
      );
    });
  });

  describe('getByContent', () => {
    it('should return annotations for content with proper visibility', async () => {
      const annotations = [
        { id: '1', type: 'HIGHLIGHT', visibility: 'PRIVATE', userId: 'user-1' },
        { id: '2', type: 'NOTE', visibility: 'GROUP', groupId: 'group-1' },
      ];

      prisma.annotation.findMany.mockResolvedValue(annotations);

      const result = await service.getByContent('content-1', 'user-1', 'group-1');

      expect(result).toEqual(annotations);
      expect(prisma.annotation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            contentId: 'content-1',
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update annotation text', async () => {
      const annotation = {
        id: '1',
        userId: 'user-1',
        visibility: 'PRIVATE',
        groupId: null,
      };

      prisma.annotation.findUnique.mockResolvedValue(annotation);
      prisma.annotation.update.mockResolvedValue({
        ...annotation,
        text: 'Updated text',
      });

      const result = await service.update('1', 'user-1', { text: 'Updated text' });

      expect(result.text).toBe('Updated text');
    });

    it('should throw ForbiddenException if not owner', async () => {
      prisma.annotation.findUnique.mockResolvedValue({
        id: '1',
        userId: 'other-user',
      });

      await expect(
        service.update('1', 'user-1', { text: 'Updated' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if annotation not found', async () => {
      prisma.annotation.findUnique.mockResolvedValue(null);

      await expect(
        service.update('1', 'user-1', { text: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete annotation and broadcast', async () => {
      const annotation = {
        id: '1',
        userId: 'user-1',
        visibility: 'GROUP',
        groupId: 'group-1',
      };

      prisma.annotation.findUnique.mockResolvedValue(annotation);
      prisma.annotation.delete.mockResolvedValue(annotation);

      await service.delete('1', 'user-1');

      expect(prisma.annotation.delete).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(wsGateway.emitToGroup).toHaveBeenCalledWith(
        'group-1',
        'annotation:deleted',
        { id: '1' },
      );
    });

    it('should throw ForbiddenException if not owner', async () => {
      prisma.annotation.findUnique.mockResolvedValue({
        id: '1',
        userId: 'other-user',
      });

      await expect(service.delete('1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
