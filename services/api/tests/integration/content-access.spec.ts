import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "src/prisma/prisma.service";
import { ContentService } from "src/cornell/services/content.service";
import { ConfigService } from "@nestjs/config";
import { StorageService } from "src/cornell/services/storage.service";
import { ActivityService } from "src/activity/activity.service";
import { FamilyService } from "src/family/family.service";
import { VideoService } from "src/video/video.service";
import { TranscriptionService } from "src/transcription/transcription.service";
import { EnforcementService } from "src/billing/enforcement.service";
import { UsageTrackingService } from "src/billing/usage-tracking.service";
import { TopicMasteryService } from "src/analytics/topic-mastery.service"; // Added
import { v4 as uuidv4 } from "uuid";
import { ContentType, Language, ScopeType } from "@prisma/client";

// Mocks
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
  let module: TestingModule;
  let contentService: ContentService;
  let prisma: PrismaService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        PrismaService,
        ContentService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: VideoService, useValue: mockVideoService },
        { provide: TranscriptionService, useValue: mockTranscriptionService },
        { provide: EnforcementService, useValue: mockEnforcementService },
        { provide: UsageTrackingService, useValue: mockUsageTrackingService },
        { provide: ActivityService, useValue: mockActivityService },
        { provide: FamilyService, useValue: mockFamilyService },
        { provide: TopicMasteryService, useValue: mockTopicMasteryService },
      ],
    }).compile();

    contentService = module.get<ContentService>(ContentService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await module.close();
  });

  it("should be defined", () => {
    expect(contentService).toBeDefined();
  });

  describe("createManualContent", () => {
    it("should create content with snake_case fields correctly", async () => {
      const userId = uuidv4();
      // Setup User (required for FK)
      const user = await prisma.users.create({
        data: {
          id: userId,
          email: `content-test-${uuidv4()}@test.com`,
          name: "Content Creator",
          password_hash: "hash",
          schooling_level: "Superior",
          updated_at: new Date(),
        },
      });

      const dto: any = {
        title: "Manual Content Test",
        type: ContentType.ARTICLE,
        original_language: Language.PT_BR,
        raw_text: "This is a manual content test",
        scope_type: ScopeType.USER,
      };

      const content = await contentService.createManualContent(user.id, dto);

      expect(content).toBeDefined();
      expect(content.title).toBe(dto.title);
      expect(content.owner_user_id).toBe(user.id); // Checking DB field name mapping

      // Verify in DB
      const dbContent = await prisma.contents.findUnique({
        where: { id: content.id },
      });
      expect(dbContent).toBeDefined();
      expect(dbContent?.owner_user_id).toBe(user.id);

      // Cleanup
      await prisma.contents.delete({ where: { id: content.id } });
      await prisma.users.delete({ where: { id: user.id } });
    });
  });

  describe("getContent", () => {
    it("should retrieve content and check access (snake_case read)", async () => {
      const userId = uuidv4();
      const user = await prisma.users.create({
        data: {
          id: userId,
          email: `read-test-${uuidv4()}@test.com`,
          name: "Reader",
          password_hash: "h",
          schooling_level: "Basic",
          updated_at: new Date(),
        },
      });

      const content = await prisma.contents.create({
        data: {
          id: uuidv4(),
          title: "Readable Content",
          type: "ARTICLE",
          original_language: "PT_BR",
          raw_text: "Text",
          users_owner: { connect: { id: user.id } }, // Connect relation
          // Note: creating directly via prisma to test Service.getContent retrieval
          updated_at: new Date(),
        },
      });

      // Just to be safe with the connect vs scalar check from before:
      // The create above uses connect, so owner_user_id is set by Prisma.

      const retrieved = await contentService.getContent(content.id, user.id);
      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(content.id);
      expect(retrieved.owner_user_id).toBe(user.id);

      // Cleanup
      await prisma.contents.delete({ where: { id: content.id } });
      await prisma.users.delete({ where: { id: user.id } });
    });
  });
});
