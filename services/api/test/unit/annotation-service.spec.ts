import { Test, TestingModule } from '@nestjs/testing';
import { AnnotationService } from '../../src/annotations/annotation.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { StudyGroupsWebSocketGateway } from '../../src/websocket/study-groups-ws.gateway';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('AnnotationService - Sprint 3: Audit Trail', () => {
  let service: AnnotationService;
  let prisma: PrismaService;

  const mockPrismaService = {
    annotation: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    sessionEvent: {
      create: jest.fn(),
    },
  };

  const mockWebSocketGateway = {
    emitToGroup: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnotationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: StudyGroupsWebSocketGateway,
          useValue: mockWebSocketGateway,
        },
      ],
    }).compile();

    service = module.get<AnnotationService>(AnnotationService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('toggleFavorite', () => {
    const mockAnnotation = {
      id: 'annotation-123',
      userId: 'user-123',
      contentId: 'content-123',
      type: 'HIGHLIGHT',
      startOffset: 0,
      endOffset: 10,
      text: 'Test highlight',
      color: '#FFFF00',
      visibility: 'PRIVATE',
      isFavorite: false,
      groupId: null,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should toggle favorite and create SessionEvent', async () => {
      // Mock findUnique to return annotation
      mockPrismaService.annotation.findUnique.mockResolvedValue(mockAnnotation);

      // Mock update to return toggled annotation
      const toggledAnnotation = { ...mockAnnotation, isFavorite: true };
      mockPrismaService.annotation.update.mockResolvedValue({
        ...toggledAnnotation,
        user: { id: 'user-123', name: 'Test User' },
      });

      // Mock SessionEvent creation
      mockPrismaService.sessionEvent.create.mockResolvedValue({
        id: 'event-123',
        eventType: 'ANNOTATION_FAVORITE_TOGGLED',
        payloadJson: {
          annotationId: 'annotation-123',
          favorite: true,
          userId: 'user-123',
        },
        createdAt: new Date(),
      });

      // Execute
      const result = await service.toggleFavorite('annotation-123', 'user-123');

      // Verify annotation update
      expect(mockPrismaService.annotation.update).toHaveBeenCalledWith({
        where: { id: 'annotation-123' },
        data: { isFavorite: true },
        include: { user: { select: { id: true, name: true } } },
      });

      // Verify SessionEvent creation
      expect(mockPrismaService.sessionEvent.create).toHaveBeenCalledWith({
        data: {
          eventType: 'ANNOTATION_FAVORITE_TOGGLED',
          payloadJson: {
            annotationId: 'annotation-123',
            favorite: true,
            userId: 'user-123',
          },
        },
      });

      // Verify result
      expect(result.isFavorite).toBe(true);
    });

    it('should throw NotFoundException if annotation does not exist', async () => {
      mockPrismaService.annotation.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleFavorite('non-existent', 'user-123')
      ).rejects.toThrow(NotFoundException);

      // SessionEvent should not be created
      expect(mockPrismaService.sessionEvent.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockPrismaService.annotation.findUnique.mockResolvedValue(mockAnnotation);

      await expect(
        service.toggleFavorite('annotation-123', 'different-user')
      ).rejects.toThrow(ForbiddenException);

      // SessionEvent should not be created
      expect(mockPrismaService.sessionEvent.create).not.toHaveBeenCalled();
    });
  });

  describe('createReply', () => {
    const mockParentAnnotation = {
      id: 'parent-123',
      userId: 'user-123',
      contentId: 'content-123',
      type: 'COMMENT',
      startOffset: 5,
      endOffset: 15,
      text: 'Parent comment',
      color: '#00FF00',
      visibility: 'PRIVATE',
      isFavorite: false,
      groupId: null,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create reply and SessionEvent', async () => {
      // Mock parent annotation lookup
      mockPrismaService.annotation.findUnique.mockResolvedValue(mockParentAnnotation);

      // Mock reply creation
      const mockReply = {
        id: 'reply-123',
        userId: 'user-456',
        contentId: 'content-123',
        type: 'COMMENT',
        startOffset: 5,
        endOffset: 15,
        text: 'Reply text',
        color: '#00FF00',
        visibility: 'PRIVATE',
        parentId: 'parent-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 'user-456', name: 'Reply User' },
        parent: mockParentAnnotation,
      };
      mockPrismaService.annotation.create.mockResolvedValue(mockReply);

      // Mock SessionEvent creation
      mockPrismaService.sessionEvent.create.mockResolvedValue({
        id: 'event-456',
        eventType: 'ANNOTATION_REPLY_CREATED',
        payloadJson: {
          annotationId: 'parent-123',
          replyId: 'reply-123',
          userId: 'user-456',
        },
        createdAt: new Date(),
      });

      // Execute
      const result = await service.createReply('parent-123', 'user-456', {
        content: 'Reply text',
        color: '#00FF00',
      });

      // Verify reply creation
      expect(mockPrismaService.annotation.create).toHaveBeenCalledWith({
        data: {
          contentId: 'content-123',
          userId: 'user-456',
          type: 'COMMENT',
          startOffset: 5,
          endOffset: 15,
          text: 'Reply text',
          color: '#00FF00',
          visibility: 'PRIVATE',
          groupId: null,
          parentId: 'parent-123',
        },
        include: {
          user: { select: { id: true, name: true } },
          parent: true,
        },
      });

      // Verify SessionEvent creation
      expect(mockPrismaService.sessionEvent.create).toHaveBeenCalledWith({
        data: {
          eventType: 'ANNOTATION_REPLY_CREATED',
          payloadJson: {
            annotationId: 'parent-123',
            replyId: 'reply-123',
            userId: 'user-456',
          },
        },
      });

      // Verify result
      expect(result.id).toBe('reply-123');
      expect(result.parentId).toBe('parent-123');
    });

    it('should throw NotFoundException if parent does not exist', async () => {
      mockPrismaService.annotation.findUnique.mockResolvedValue(null);

      await expect(
        service.createReply('non-existent', 'user-123', {
          content: 'Reply',
          color: '#00FF00',
        })
      ).rejects.toThrow(NotFoundException);

      // No SessionEvent should be created
      expect(mockPrismaService.sessionEvent.create).not.toHaveBeenCalled();
    });

    it('should emit WebSocket event for GROUP visibility', async () => {
      const groupAnnotation = {
        ...mockParentAnnotation,
        visibility: 'GROUP',
        groupId: 'group-789',
      };

      mockPrismaService.annotation.findUnique.mockResolvedValue(groupAnnotation);
      mockPrismaService.annotation.create.mockResolvedValue({
        id: 'reply-123',
        parentId: 'parent-123',
        user: { id: 'user-456', name: 'User' },
        parent: groupAnnotation,
      });
      mockPrismaService.sessionEvent.create.mockResolvedValue({});

      await service.createReply('parent-123', 'user-456', {
        content: 'Group reply',
        color: '#00FF00',
      });

      // Verify WebSocket emission
      expect(mockWebSocketGateway.emitToGroup).toHaveBeenCalledWith(
        'group-789',
        'annotation:reply',
        expect.any(Object)
      );
    });
  });
});
