import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { PrismaService } from "../../src/prisma/prisma.service";
import { AppModule } from "../../src/app.module";

describe("Sprint 2: Solo Sessions (Integration)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: "maria@example.com", password: "demo123" });

    authToken = loginResponse.body.accessToken;
    testUserId = loginResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /sessions/:id - Enhanced Response", () => {
    let testContentId: string;
    let testSessionId: string;

    beforeEach(async () => {
      // Create test content
      const content = await prisma.content.create({
        data: {
          title: "Test Reading Material",
          type: "PDF",
          originalLanguage: "PT_BR",
          rawText: "Sample text for reading",
        },
      });
      testContentId = content.id;

      // Create test session
      const session = await prisma.readingSession.create({
        data: {
          userId: testUserId,
          contentId: testContentId,
          phase: "PRE",
          modality: "READING",
          assetLayer: "ORIGINAL",
          goalStatement: "Test goal",
          predictionText: "",
          targetWordsJson: {},
        },
      });
      testSessionId = session.id;
    });

    afterEach(async () => {
      // Cleanup
      await prisma.sessionEvent.deleteMany({
        where: { readingSessionId: testSessionId },
      });
      await prisma.readingSession.delete({ where: { id: testSessionId } });
      await prisma.content.delete({ where: { id: testContentId } });
    });

    it("should return session with content, messages, and quickReplies", async () => {
      // Create some session events (messages)
      await prisma.sessionEvent.createMany({
        data: [
          {
            readingSessionId: testSessionId,
            eventType: "PROMPT_SENT",
            payloadJson: {
              role: "USER",
              text: "Hello, I want to start reading",
            },
          },
          {
            readingSessionId: testSessionId,
            eventType: "PROMPT_RECEIVED",
            payloadJson: {
              role: "EDUCATOR",
              text: "Great! Let me know if you have questions.",
              quickReplies: ["Continue", "Ask question", "Finish"],
            },
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/sessions/${testSessionId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // Verify structure
      expect(response.body).toHaveProperty("session");
      expect(response.body).toHaveProperty("content");
      expect(response.body).toHaveProperty("messages");
      expect(response.body).toHaveProperty("quickReplies");

      // Verify session
      expect(response.body.session.id).toBe(testSessionId);
      expect(response.body.session.phase).toBe("PRE");

      // Verify content
      expect(response.body.content.id).toBe(testContentId);
      expect(response.body.content.title).toBe("Test Reading Material");

      // Verify messages
      expect(response.body.messages).toBeInstanceOf(Array);
      expect(response.body.messages.length).toBeGreaterThanOrEqual(2);
      expect(response.body.messages[0]).toMatchObject({
        role: "USER",
        content: "Hello, I want to start reading",
      });
      expect(response.body.messages[1]).toMatchObject({
        role: "EDUCATOR",
        content: "Great! Let me know if you have questions.",
      });

      // Verify quickReplies
      expect(response.body.quickReplies).toEqual([
        "Continue",
        "Ask question",
        "Finish",
      ]);
    });

    it("should return empty messages and quickReplies for new session", async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/sessions/${testSessionId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.messages).toEqual([]);
      expect(response.body.quickReplies).toEqual([]);
    });

    it("should expose file.storageKey if content has file", async () => {
      // Create file
      const file = await prisma.file.create({
        data: {
          storageProvider: "LOCAL",
          storageKey: "session-content-abc123.pdf",
          mimeType: "application/pdf",
          sizeBytes: BigInt(512000),
          checksumSha256: "hash123",
          originalFilename: "document.pdf",
        },
      });

      // Update content with file
      await prisma.content.update({
        where: { id: testContentId },
        data: { fileId: file.id },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/sessions/${testSessionId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.content.file).toBeDefined();
      expect(response.body.content.file.storageKey).toBe(
        "session-content-abc123.pdf",
      );

      // Cleanup file
      await prisma.content.update({
        where: { id: testContentId },
        data: { fileId: null },
      });
      await prisma.file.delete({ where: { id: file.id } });
    });

    it("should return 404 for non-existent session", async () => {
      await request(app.getHttpServer())
        .get("/api/v1/sessions/non-existent-id")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });

    it("should return 403 for session owned by another user", async () => {
      // Create another user's session
      const otherUser = await prisma.user.create({
        data: {
          email: "other@example.com",
          name: "Other User",
          passwordHash: "hash",
          role: "STUDENT",
          schoolingLevel: "MEDIO",
        },
      });

      const otherSession = await prisma.readingSession.create({
        data: {
          userId: otherUser.id,
          contentId: testContentId,
          phase: "PRE",
          modality: "READING",
          assetLayer: "ORIGINAL",
          goalStatement: "Other goal",
          predictionText: "",
          targetWordsJson: {},
        },
      });

      await request(app.getHttpServer())
        .get(`/api/v1/sessions/${otherSession.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(403);

      // Cleanup
      await prisma.readingSession.delete({ where: { id: otherSession.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe("POST /sessions/:id/prompt - Message Persistence", () => {
    let testContentId: string;
    let testSessionId: string;

    beforeEach(async () => {
      const content = await prisma.content.create({
        data: {
          title: "Prompt Test Material",
          type: "ARTICLE",
          originalLanguage: "PT_BR",
          rawText: "Article content",
        },
      });
      testContentId = content.id;

      const session = await prisma.readingSession.create({
        data: {
          userId: testUserId,
          contentId: testContentId,
          phase: "DURING",
          modality: "READING",
          assetLayer: "ORIGINAL",
          goalStatement: "Read article",
          predictionText: "",
          targetWordsJson: {},
        },
      });
      testSessionId = session.id;
    });

    afterEach(async () => {
      await prisma.sessionEvent.deleteMany({
        where: { readingSessionId: testSessionId },
      });
      await prisma.readingSession.delete({ where: { id: testSessionId } });
      await prisma.content.delete({ where: { id: testContentId } });
    });

    it("should create session event when sending prompt", async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/sessions/${testSessionId}/prompt`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          text: "What is the main idea of this article?",
          actorRole: "LEARNER",
        })
        .expect(201);

      // Verify response has nextPrompt and quickReplies
      expect(response.body).toHaveProperty("nextPrompt");
      expect(response.body).toHaveProperty("quickReplies");

      // Verify event was created
      const events = await prisma.sessionEvent.findMany({
        where: { readingSessionId: testSessionId },
      });

      expect(events.length).toBeGreaterThan(0);
      const userEvent = events.find(
        (e) =>
          (e.payloadJson as any)?.text ===
          "What is the main idea of this article?",
      );
      expect(userEvent).toBeDefined();
    });
  });
});
