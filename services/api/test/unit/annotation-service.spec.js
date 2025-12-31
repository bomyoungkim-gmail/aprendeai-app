"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const annotation_service_1 = require("../../src/annotations/annotation.service");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const study_groups_ws_gateway_1 = require("../../src/websocket/study-groups-ws.gateway");
const common_1 = require("@nestjs/common");
describe("AnnotationService - Sprint 3: Audit Trail", () => {
    let service;
    let prisma;
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
        const module = await testing_1.Test.createTestingModule({
            providers: [
                annotation_service_1.AnnotationService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: study_groups_ws_gateway_1.StudyGroupsWebSocketGateway,
                    useValue: mockWebSocketGateway,
                },
            ],
        }).compile();
        service = module.get(annotation_service_1.AnnotationService);
        prisma = module.get(prisma_service_1.PrismaService);
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
            mockPrismaService.annotations.findUnique.mockResolvedValue(mockAnnotation);
            const toggledAnnotation = Object.assign(Object.assign({}, mockAnnotation), { is_favorite: true });
            mockPrismaService.annotations.update.mockResolvedValue(Object.assign(Object.assign({}, toggledAnnotation), { users: { id: "user-123", name: "Test User" } }));
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
            const result = await service.toggleFavorite("annotation-123", "user-123");
            expect(mockPrismaService.annotations.update).toHaveBeenCalledWith({
                where: { id: "annotation-123" },
                data: { is_favorite: true },
                include: { users: { select: { id: true, name: true } } },
            });
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
            expect(result.is_favorite).toBe(true);
        });
        it("should throw NotFoundException if annotation does not exist", async () => {
            mockPrismaService.annotations.findUnique.mockResolvedValue(null);
            await expect(service.toggleFavorite("non-existent", "user-123")).rejects.toThrow(common_1.NotFoundException);
            expect(mockPrismaService.session_events.create).not.toHaveBeenCalled();
        });
        it("should throw ForbiddenException if not owner", async () => {
            mockPrismaService.annotations.findUnique.mockResolvedValue(mockAnnotation);
            await expect(service.toggleFavorite("annotation-123", "different-user")).rejects.toThrow(common_1.ForbiddenException);
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
            mockPrismaService.annotations.findUnique.mockResolvedValue(mockParentAnnotation);
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
            const result = await service.createReply("parent-123", "user-456", {
                content: "Reply text",
                color: "#00FF00",
            });
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
            expect(result.id).toBe("reply-123");
            expect(result.parent_id).toBe("parent-123");
        });
        it("should throw NotFoundException if parent does not exist", async () => {
            mockPrismaService.annotations.findUnique.mockResolvedValue(null);
            await expect(service.createReply("non-existent", "user-123", {
                content: "Reply",
                color: "#00FF00",
            })).rejects.toThrow(common_1.NotFoundException);
            expect(mockPrismaService.session_events.create).not.toHaveBeenCalled();
        });
        it("should emit WebSocket event for GROUP visibility", async () => {
            const groupAnnotation = Object.assign(Object.assign({}, mockParentAnnotation), { visibility: "GROUP", group_id: "group-789" });
            mockPrismaService.annotations.findUnique.mockResolvedValue(groupAnnotation);
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
            expect(mockWebSocketGateway.emitToGroup).toHaveBeenCalledWith("group-789", "annotation:reply", expect.any(Object));
        });
    });
});
//# sourceMappingURL=annotation-service.spec.js.map