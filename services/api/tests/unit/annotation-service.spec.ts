import { Test, TestingModule } from "@nestjs/testing";
import { AnnotationService } from "../../src/annotations/annotation.service";
import { PrismaService } from "../../src/prisma/prisma.service";
import { StudyGroupsWebSocketGateway } from "../../src/websocket/study-groups-ws.gateway";
import { NotFoundException, ForbiddenException } from "@nestjs/common";

describe("AnnotationService - Sprint 3: Audit Trail", () => {
  let service: AnnotationService;
  let prisma: PrismaService;

  const mockPrismaService = {
    annotations: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    session_events: {
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

  describe("toggleFavorite", () => {
    const mockAnnotation = {
      id: "annotation-123",
      user_id: "user-123",
      content_id: "content-123",
      type: "HIGHLIGHT",
      start_offset: 0,
      end_offset: 10,
      text: "Test highlight",
      color: "#FFFF00",
      visibility: "PRIVATE",
      is_favorite: false,
      group_id: null,
      parent_id: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    it("should toggle favorite and create SessionEvent", async () => {
      // Mock findUnique to return annotation
      mockPrismaService.annotations.findUnique.mockResolvedValue(
        mockAnnotation,
      );

      // Mock update to return toggled annotation
      const toggledAnnotation = { ...mockAnnotation, is_favorite: true };
      mockPrismaService.annotations.update.mockResolvedValue({
        ...toggledAnnotation,
        users: { id: "user-123", name: "Test User" },
      });

      // Mock SessionEvent creation
      mockPrismaService.session_events.create.mockResolvedValue({
        id: "event-123",
        event_type: "ANNOTATION_FAVORITE_TOGGLED",
        payload_json: {
          annotationId: "annotation-123",
          favorite: true,
          userId: "user-123",
        },
        created_at: new Date(),
      });

      // Execute
      const result = await service.toggleFavorite("annotation-123", "user-123");

      // Verify annotation update
      expect(mockPrismaService.annotations.update).toHaveBeenCalledWith({
        where: { id: "annotation-123" },
        data: { is_favorite: true },
        include: { users: { select: { id: true, name: true } } },
      });

      // Verify SessionEvent creation
      expect(mockPrismaService.session_events.create).toHaveBeenCalledWith({
        data: {
          event_type: "ANNOTATION_FAVORITE_TOGGLED",
          payload_json: {
            annotationId: "annotation-123",
            favorite: true,
            userId: "user-123",
          },
        },
      });

      // Verify result
      expect(result.is_favorite).toBe(true);
    });

    it("should throw NotFoundException if annotation does not exist", async () => {
      mockPrismaService.annotations.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleFavorite("non-existent", "user-123"),
      ).rejects.toThrow(NotFoundException);

      // SessionEvent should not be created
      expect(mockPrismaService.session_events.create).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenException if not owner", async () => {
      mockPrismaService.annotations.findUnique.mockResolvedValue(
        mockAnnotation,
      );

      await expect(
        service.toggleFavorite("annotation-123", "different-user"),
      ).rejects.toThrow(ForbiddenException);

      // SessionEvent should not be created
      expect(mockPrismaService.session_events.create).not.toHaveBeenCalled();
    });
  });

  describe("createReply", () => {
    const mockParentAnnotation = {
      id: "parent-123",
      user_id: "user-123",
      content_id: "content-123",
      type: "COMMENT",
      start_offset: 5,
      end_offset: 15,
      text: "Parent comment",
      color: "#00FF00",
      visibility: "PRIVATE",
      is_favorite: false,
      group_id: null,
      parent_id: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    it("should create reply and SessionEvent", async () => {
      // Mock parent annotation lookup
      mockPrismaService.annotations.findUnique.mockResolvedValue(
        mockParentAnnotation,
      );

      // Mock reply creation
      const mockReply = {
        id: "reply-123",
        user_id: "user-456",
        content_id: "content-123",
        type: "COMMENT",
        start_offset: 5,
        end_offset: 15,
        text: "Reply text",
        color: "#00FF00",
        visibility: "PRIVATE",
        parent_id: "parent-123",
        created_at: new Date(),
        updated_at: new Date(),
        users: { id: "user-456", name: "Reply User" },
        annotations: mockParentAnnotation,
      };
      mockPrismaService.annotations.create.mockResolvedValue(mockReply);

      // Mock SessionEvent creation
      mockPrismaService.session_events.create.mockResolvedValue({
        id: "event-456",
        event_type: "ANNOTATION_REPLY_CREATED",
        payload_json: {
          annotationId: "parent-123",
          replyId: "reply-123",
          userId: "user-456",
        },
        created_at: new Date(),
      });

      // Execute
      const result = await service.createReply("parent-123", "user-456", {
        content: "Reply text",
        color: "#00FF00",
      });

      // Verify reply creation
      expect(mockPrismaService.annotations.create).toHaveBeenCalledWith({
        data: {
          content_id: "content-123",
          user_id: "user-456",
          type: "COMMENT",
          start_offset: 5,
          end_offset: 15,
          text: "Reply text",
          color: "#00FF00",
          visibility: "PRIVATE",
          group_id: null,
          parent_id: "parent-123",
        },
        include: {
          users: { select: { id: true, name: true } },
          annotations: true,
        },
      });

      // Verify SessionEvent creation
      expect(mockPrismaService.session_events.create).toHaveBeenCalledWith({
        data: {
          event_type: "ANNOTATION_REPLY_CREATED",
          payload_json: {
            annotationId: "parent-123",
            replyId: "reply-123",
            userId: "user-456",
          },
        },
      });

      // Verify result
      expect(result.id).toBe("reply-123");
      expect(result.parent_id).toBe("parent-123");
    });

    it("should throw NotFoundException if parent does not exist", async () => {
      mockPrismaService.annotations.findUnique.mockResolvedValue(null);

      await expect(
        service.createReply("non-existent", "user-123", {
          content: "Reply",
          color: "#00FF00",
        }),
      ).rejects.toThrow(NotFoundException);

      // No SessionEvent should be created
      expect(mockPrismaService.session_events.create).not.toHaveBeenCalled();
    });

    it("should emit WebSocket event for GROUP visibility", async () => {
      const groupAnnotation = {
        ...mockParentAnnotation,
        visibility: "GROUP",
        group_id: "group-789",
      };

      mockPrismaService.annotations.findUnique.mockResolvedValue(
        groupAnnotation,
      );
      mockPrismaService.annotations.create.mockResolvedValue({
        id: "reply-123",
        parent_id: "parent-123",
        users: { id: "user-456", name: "User" },
        annotations: groupAnnotation,
      });
      mockPrismaService.session_events.create.mockResolvedValue({});

      await service.createReply("parent-123", "user-456", {
        content: "Group reply",
        color: "#00FF00",
      });

      // Verify WebSocket emission
      expect(mockWebSocketGateway.emitToGroup).toHaveBeenCalledWith(
        "group-789",
        "annotation:reply",
        expect.any(Object),
      );
    });
  });
});
