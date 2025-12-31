import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { PrismaService } from "../../src/prisma/prisma.service";
import { ROUTES, apiUrl } from "../helpers/routes";
import {
  CornellController,
  HighlightsController,
} from "../../src/cornell/cornell.controller";
import { FilesController } from "../../src/common/files.controller";
import { CornellService } from "../../src/cornell/cornell.service";
import { StorageService } from "../../src/cornell/services/storage.service";
import { ContentService } from "../../src/cornell/services/content.service";
import { QueueService } from "../../src/queue/queue.service";
import { NotificationsGateway } from "../../src/notifications/notifications.gateway";
import { ContentAccessService } from "../../src/cornell/services/content-access.service";
import { TestAuthHelper } from "../helpers/auth.helper";
import { UsageTrackingService } from "../../src/billing/usage-tracking.service";
import { ActivityService } from "../../src/activity/activity.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { VideoService } from "../../src/video/video.service";
import { TranscriptionService } from "../../src/transcription/transcription.service";
import { EnforcementService } from "../../src/billing/enforcement.service";
import { FamilyService } from "../../src/family/family.service";
import { TopicMasteryService } from "../../src/analytics/topic-mastery.service";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { AuthGuard } from "@nestjs/passport";
import { JwtAuthGuard } from "../../src/auth/infrastructure/jwt-auth.guard";

describe("Media Content (Integration - Mocked DB)", () => {
  let app: INestApplication;
  let authToken: string;
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
      create: jest.fn().mockImplementation((args) =>
        Promise.resolve({
          id: testContentId,
          ...args.data,
          duration: args.data.duration ?? null,
        }),
      ),
      findUnique: jest.fn().mockImplementation((args) =>
        Promise.resolve({
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
        }),
      ),
      findFirst: jest.fn().mockImplementation((args) =>
        Promise.resolve({
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
        }),
      ),
      update: jest
        .fn()
        .mockImplementation((args) =>
          Promise.resolve({ id: args.where.id, ...args.data }),
        ),
      delete: jest.fn().mockResolvedValue({ id: testContentId }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    files: {
      create: jest
        .fn()
        .mockImplementation((args) =>
          Promise.resolve({ id: testFileId, ...args.data }),
        ),
      findUnique: jest.fn().mockImplementation((args) =>
        Promise.resolve({
          id: args.where.id,
          storage_key: "test-file.mp4",
          mime_type: "video/mp4",
        }),
      ),
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
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CornellController, FilesController, HighlightsController],
      providers: [
        CornellService,
        ContentService,
        ContentAccessService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: QueueService, useValue: mockQueueService },
        { provide: NotificationsGateway, useValue: mockNotificationsGateway },
        { provide: StorageService, useValue: mockStorageService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: UsageTrackingService, useValue: { trackUsage: jest.fn() } },
        { provide: ActivityService, useValue: { logActivity: jest.fn() } },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: VideoService, useValue: { processVideo: jest.fn() } },
        { provide: TranscriptionService, useValue: { transcribe: jest.fn() } },
        { provide: EnforcementService, useValue: { checkQuota: jest.fn() } },
        { provide: FamilyService, useValue: { getPrimaryFamily: jest.fn() } },
        {
          provide: TopicMasteryService,
          useValue: { updateTopicMastery: jest.fn() },
        },
      ],
    })
      .overrideGuard(AuthGuard("jwt"))
      .useValue({
        canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: testUserId, email: "maria@example.com" };
          return true;
        },
      })
      .overrideGuard(JwtAuthGuard)
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
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    const authHelper = new TestAuthHelper("test-secret");
    authToken = authHelper.generateToken({
      id: testUserId,
      email: "maria@example.com",
      name: "Maria",
    });
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe("ContentType Enum - VIDEO/AUDIO", () => {
    it("should create VIDEO content with duration", async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.CORNELL.CREATE_MANUAL))
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Test Video Content",
          type: "VIDEO",
          originalLanguage: "PT_BR",
          rawText: "Video transcription here",
          duration: 300, // 5 minutes
        })
        .expect(201);

      expect(response.body).toMatchObject({
        title: "Test Video Content",
        type: "VIDEO",
        duration: 300,
      });

      // Verification
      expect(mockPrismaService.contents.create).toHaveBeenCalled();
    });

    it("should create AUDIO content with duration", async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.CORNELL.CREATE_MANUAL))
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Test Audio Content",
          type: "AUDIO",
          originalLanguage: "PT_BR",
          rawText: "Audio transcription",
          duration: 180, // 3 minutes
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
        .post(apiUrl(ROUTES.CORNELL.CREATE_MANUAL))
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
        .post(apiUrl(ROUTES.CORNELL.CREATE_MANUAL))
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
      // Mock create
      const contentId = testContentId;

      // Update duration
      const updateResponse = await request(app.getHttpServer())
        .patch(apiUrl(ROUTES.CORNELL.UPDATE(contentId)))
        .set("Authorization", `Bearer ${authToken}`)
        .send({ duration: 200 })
        .expect(200);

      expect(updateResponse.body.duration).toBe(200);
      expect(mockPrismaService.contents.update).toHaveBeenCalled();
    });
  });

  describe("File.storageKey Exposure", () => {
    it("should expose file.storageKey in GET /content/:id", async () => {
      // Create content with file (mocked in Prisma)
      const contentId = testContentId;

      // GET content
      const url = apiUrl(ROUTES.CORNELL.BY_ID(contentId));
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

      // Request file via Controller (Requires Auth)
      const response = await request(app.getHttpServer())
        .get(apiUrl(ROUTES.FILES.VIEW(fileId)))
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // Verify content
      expect(response.text).toBe("File Content");
    });
  });
});
