"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = require("supertest");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const routes_1 = require("../helpers/routes");
const cornell_controller_1 = require("../../src/cornell/cornell.controller");
const files_controller_1 = require("../../src/common/files.controller");
const cornell_service_1 = require("../../src/cornell/cornell.service");
const storage_service_1 = require("../../src/cornell/services/storage.service");
const content_service_1 = require("../../src/cornell/services/content.service");
const queue_service_1 = require("../../src/queue/queue.service");
const notifications_gateway_1 = require("../../src/notifications/notifications.gateway");
const content_access_service_1 = require("../../src/cornell/services/content-access.service");
const auth_helper_1 = require("../helpers/auth.helper");
const usage_tracking_service_1 = require("../../src/billing/usage-tracking.service");
const activity_service_1 = require("../../src/activity/activity.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const video_service_1 = require("../../src/video/video.service");
const transcription_service_1 = require("../../src/transcription/transcription.service");
const enforcement_service_1 = require("../../src/billing/enforcement.service");
const family_service_1 = require("../../src/family/family.service");
const topic_mastery_service_1 = require("../../src/analytics/topic-mastery.service");
const cache_manager_1 = require("@nestjs/cache-manager");
const passport_1 = require("@nestjs/passport");
const jwt_auth_guard_1 = require("../../src/auth/infrastructure/jwt-auth.guard");
describe("Media Content (Integration - Mocked DB)", () => {
    let app;
    let authToken;
    const testUserId = "550e8400-e29b-41d4-a716-446655440000";
    const testContentId = "550e8400-e29b-41d4-a716-446655440001";
    const testFileId = "550e8400-e29b-41d4-a716-446655440002";
    const mockPrismaService = {
        users: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            findUnique: jest
                .fn()
                .mockResolvedValue({ id: testUserId, email: "maria@example.com" }),
        },
        contents: {
            create: jest.fn().mockImplementation((args) => {
                var _a;
                return Promise.resolve(Object.assign(Object.assign({ id: testContentId }, args.data), { duration: (_a = args.data.duration) !== null && _a !== void 0 ? _a : null }));
            }),
            findUnique: jest.fn().mockImplementation((args) => Promise.resolve({
                id: args.where.id,
                owner_user_id: testUserId,
                title: "Test Content",
                type: "VIDEO",
                file_id: testFileId,
                duration: 300,
                files: {
                    id: testFileId,
                    storage_key: "test-file.mp4",
                    mime_type: "video/mp4",
                    size_bytes: BigInt(1024000),
                    original_filename: "test.mp4",
                },
            })),
            findFirst: jest.fn().mockImplementation((args) => Promise.resolve({
                id: testContentId,
                owner_user_id: testUserId,
                title: "Test Content",
                type: "VIDEO",
                file_id: testFileId,
                files: {
                    id: testFileId,
                    storage_key: "test-file.mp4",
                    mime_type: "video/mp4",
                    size_bytes: BigInt(1024000),
                },
            })),
            update: jest
                .fn()
                .mockImplementation((args) => Promise.resolve(Object.assign({ id: args.where.id }, args.data))),
            delete: jest.fn().mockResolvedValue({ id: testContentId }),
            findMany: jest.fn().mockResolvedValue([]),
        },
        files: {
            create: jest
                .fn()
                .mockImplementation((args) => Promise.resolve(Object.assign({ id: testFileId }, args.data))),
            findUnique: jest.fn().mockImplementation((args) => Promise.resolve({
                id: args.where.id,
                storage_key: "test-file.mp4",
                mime_type: "video/mp4",
            })),
            delete: jest.fn().mockResolvedValue({ id: testFileId }),
        },
        family_members: {
            findUnique: jest.fn().mockResolvedValue({ status: "ACTIVE" }),
        },
        $transaction: jest.fn().mockImplementation((cb) => cb(mockPrismaService)),
    };
    const mockQueueService = {
        publish: jest.fn().mockResolvedValue(true),
    };
    const mockNotificationsGateway = {
        emitContentUpdate: jest.fn(),
    };
    const mockStorageService = {
        streamFile: jest
            .fn()
            .mockImplementation((id, res) => res.send("File Content")),
        getFileViewUrl: jest.fn().mockResolvedValue("http://localhost/view/file"),
        uploadFile: jest
            .fn()
            .mockResolvedValue({ id: testFileId, storageKey: "key" }),
        deleteFile: jest.fn().mockResolvedValue(true),
    };
    const mockCacheManager = {
        get: jest.fn().mockResolvedValue(undefined),
        set: jest.fn().mockResolvedValue(undefined),
    };
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            controllers: [cornell_controller_1.CornellController, files_controller_1.FilesController, cornell_controller_1.HighlightsController],
            providers: [
                cornell_service_1.CornellService,
                content_service_1.ContentService,
                content_access_service_1.ContentAccessService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: queue_service_1.QueueService, useValue: mockQueueService },
                { provide: notifications_gateway_1.NotificationsGateway, useValue: mockNotificationsGateway },
                { provide: storage_service_1.StorageService, useValue: mockStorageService },
                { provide: cache_manager_1.CACHE_MANAGER, useValue: mockCacheManager },
                { provide: usage_tracking_service_1.UsageTrackingService, useValue: { trackUsage: jest.fn() } },
                { provide: activity_service_1.ActivityService, useValue: { logActivity: jest.fn() } },
                { provide: event_emitter_1.EventEmitter2, useValue: { emit: jest.fn() } },
                { provide: video_service_1.VideoService, useValue: { processVideo: jest.fn() } },
                { provide: transcription_service_1.TranscriptionService, useValue: { transcribe: jest.fn() } },
                { provide: enforcement_service_1.EnforcementService, useValue: { checkQuota: jest.fn() } },
                { provide: family_service_1.FamilyService, useValue: { getPrimaryFamily: jest.fn() } },
                {
                    provide: topic_mastery_service_1.TopicMasteryService,
                    useValue: { updateTopicMastery: jest.fn() },
                },
            ],
        })
            .overrideGuard((0, passport_1.AuthGuard)("jwt"))
            .useValue({
            canActivate: (context) => {
                const req = context.switchToHttp().getRequest();
                req.user = { id: testUserId, email: "maria@example.com" };
                return true;
            },
        })
            .overrideGuard(jwt_auth_guard_1.JwtAuthGuard)
            .useValue({
            canActivate: (context) => {
                const req = context.switchToHttp().getRequest();
                req.user = { id: testUserId, email: "maria@example.com" };
                return true;
            },
        })
            .compile();
        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix("api/v1");
        app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
        await app.init();
        const authHelper = new auth_helper_1.TestAuthHelper("test-secret");
        authToken = authHelper.generateToken({
            id: testUserId,
            email: "maria@example.com",
            name: "Maria",
        });
    });
    afterAll(async () => {
        if (app)
            await app.close();
    });
    describe("ContentType Enum - VIDEO/AUDIO", () => {
        it("should create VIDEO content with duration", async () => {
            const response = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(routes_1.ROUTES.CORNELL.CREATE_MANUAL))
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                title: "Test Video Content",
                type: "VIDEO",
                originalLanguage: "PT_BR",
                rawText: "Video transcription here",
                duration: 300,
            })
                .expect(201);
            expect(response.body).toMatchObject({
                title: "Test Video Content",
                type: "VIDEO",
                duration: 300,
            });
            expect(mockPrismaService.contents.create).toHaveBeenCalled();
        });
        it("should create AUDIO content with duration", async () => {
            const response = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(routes_1.ROUTES.CORNELL.CREATE_MANUAL))
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                title: "Test Audio Content",
                type: "AUDIO",
                originalLanguage: "PT_BR",
                rawText: "Audio transcription",
                duration: 180,
            })
                .expect(201);
            expect(response.body).toMatchObject({
                title: "Test Audio Content",
                type: "AUDIO",
                duration: 180,
            });
            expect(mockPrismaService.contents.create).toHaveBeenCalled();
        });
        it("should reject invalid content type", async () => {
            await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(routes_1.ROUTES.CORNELL.CREATE_MANUAL))
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                title: "Invalid Content",
                type: "INVALID_TYPE",
                originalLanguage: "PT_BR",
                rawText: "Text",
            })
                .expect(400);
        });
    });
    describe("Duration Field", () => {
        it("should accept null duration for non-media content", async () => {
            const response = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(routes_1.ROUTES.CORNELL.CREATE_MANUAL))
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                title: "PDF Document",
                type: "PDF",
                originalLanguage: "PT_BR",
                rawText: "Document text",
            })
                .expect(201);
            expect(response.body.duration).toBeNull();
        });
        it("should update duration field", async () => {
            const contentId = testContentId;
            const updateResponse = await request(app.getHttpServer())
                .patch((0, routes_1.apiUrl)(routes_1.ROUTES.CORNELL.UPDATE(contentId)))
                .set("Authorization", `Bearer ${authToken}`)
                .send({ duration: 200 })
                .expect(200);
            expect(updateResponse.body.duration).toBe(200);
            expect(mockPrismaService.contents.update).toHaveBeenCalled();
        });
    });
    describe("File.storageKey Exposure", () => {
        it("should expose file.storageKey in GET /content/:id", async () => {
            const contentId = testContentId;
            const url = (0, routes_1.apiUrl)(routes_1.ROUTES.CORNELL.BY_ID(contentId));
            const response = await request(app.getHttpServer())
                .get(url)
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.file).toBeDefined();
            expect(response.body.file.storage_key).toBe("test-file.mp4");
            expect(response.body.file.mime_type).toBe("video/mp4");
        });
    });
    describe("Secure File Serving", () => {
        it("should stream files via FilesController", async () => {
            const fileId = testFileId;
            const response = await request(app.getHttpServer())
                .get((0, routes_1.apiUrl)(routes_1.ROUTES.FILES.VIEW(fileId)))
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            expect(response.text).toBe("File Content");
        });
    });
});
//# sourceMappingURL=media-content.integration.spec.js.map