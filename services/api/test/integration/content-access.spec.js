"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const content_service_1 = require("../../src/cornell/services/content.service");
const config_1 = require("@nestjs/config");
const storage_service_1 = require("../../src/cornell/services/storage.service");
const activity_service_1 = require("../../src/activity/activity.service");
const family_service_1 = require("../../src/family/family.service");
const video_service_1 = require("../../src/video/video.service");
const transcription_service_1 = require("../../src/transcription/transcription.service");
const enforcement_service_1 = require("../../src/billing/enforcement.service");
const usage_tracking_service_1 = require("../../src/billing/usage-tracking.service");
const topic_mastery_service_1 = require("../../src/analytics/topic-mastery.service");
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
const mockConfigService = { get: jest.fn() };
const mockStorageService = {
    saveFile: jest.fn().mockResolvedValue("test-key"),
};
const mockVideoService = {
    isVideoFile: jest.fn().mockReturnValue(false),
    isAudioFile: jest.fn().mockReturnValue(false),
};
const mockTranscriptionService = {
    isAvailable: jest.fn().mockReturnValue(false),
};
const mockEnforcementService = {
    enforceHierarchy: jest
        .fn()
        .mockResolvedValue({ scope_type: "USER", scope_id: "test-user" }),
};
const mockUsageTrackingService = {
    trackUsage: jest.fn().mockResolvedValue(true),
};
const mockActivityService = {
    trackActivity: jest.fn().mockResolvedValue(true),
};
const mockFamilyService = {
    resolveBillingHierarchy: jest.fn().mockResolvedValue([]),
    findAllForUser: jest.fn().mockResolvedValue([]),
};
const mockTopicMasteryService = {
    getWeakestTopics: jest.fn().mockResolvedValue([]),
};
describe("Integration: Content Access & Service (Subfase 5.2)", () => {
    let module;
    let contentService;
    let prisma;
    beforeAll(async () => {
        module = await testing_1.Test.createTestingModule({
            providers: [
                prisma_service_1.PrismaService,
                content_service_1.ContentService,
                { provide: config_1.ConfigService, useValue: mockConfigService },
                { provide: storage_service_1.StorageService, useValue: mockStorageService },
                { provide: video_service_1.VideoService, useValue: mockVideoService },
                { provide: transcription_service_1.TranscriptionService, useValue: mockTranscriptionService },
                { provide: enforcement_service_1.EnforcementService, useValue: mockEnforcementService },
                { provide: usage_tracking_service_1.UsageTrackingService, useValue: mockUsageTrackingService },
                { provide: activity_service_1.ActivityService, useValue: mockActivityService },
                { provide: family_service_1.FamilyService, useValue: mockFamilyService },
                { provide: topic_mastery_service_1.TopicMasteryService, useValue: mockTopicMasteryService },
            ],
        }).compile();
        contentService = module.get(content_service_1.ContentService);
        prisma = module.get(prisma_service_1.PrismaService);
    });
    afterAll(async () => {
        await module.close();
    });
    it("should be defined", () => {
        expect(contentService).toBeDefined();
    });
    describe("createManualContent", () => {
        it("should create content with snake_case fields correctly", async () => {
            const userId = (0, uuid_1.v4)();
            const user = await prisma.users.create({
                data: {
                    id: userId,
                    email: `content-test-${(0, uuid_1.v4)()}@test.com`,
                    name: "Content Creator",
                    password_hash: "hash",
                    schooling_level: "Superior",
                    updated_at: new Date(),
                },
            });
            const dto = {
                title: "Manual Content Test",
                type: client_1.ContentType.ARTICLE,
                original_language: client_1.Language.PT_BR,
                raw_text: "This is a manual content test",
                scope_type: client_1.ScopeType.USER,
            };
            const content = await contentService.createManualContent(user.id, dto);
            expect(content).toBeDefined();
            expect(content.title).toBe(dto.title);
            expect(content.owner_user_id).toBe(user.id);
            const dbContent = await prisma.contents.findUnique({
                where: { id: content.id },
            });
            expect(dbContent).toBeDefined();
            expect(dbContent === null || dbContent === void 0 ? void 0 : dbContent.owner_user_id).toBe(user.id);
            await prisma.contents.delete({ where: { id: content.id } });
            await prisma.users.delete({ where: { id: user.id } });
        });
    });
    describe("getContent", () => {
        it("should retrieve content and check access (snake_case read)", async () => {
            const userId = (0, uuid_1.v4)();
            const user = await prisma.users.create({
                data: {
                    id: userId,
                    email: `read-test-${(0, uuid_1.v4)()}@test.com`,
                    name: "Reader",
                    password_hash: "h",
                    schooling_level: "Basic",
                    updated_at: new Date(),
                },
            });
            const content = await prisma.contents.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    title: "Readable Content",
                    type: "ARTICLE",
                    original_language: "PT_BR",
                    raw_text: "Text",
                    users_owner: { connect: { id: user.id } },
                    updated_at: new Date(),
                },
            });
            const retrieved = await contentService.getContent(content.id, user.id);
            expect(retrieved).toBeDefined();
            expect(retrieved.id).toBe(content.id);
            expect(retrieved.owner_user_id).toBe(user.id);
            await prisma.contents.delete({ where: { id: content.id } });
            await prisma.users.delete({ where: { id: user.id } });
        });
    });
});
//# sourceMappingURL=content-access.spec.js.map