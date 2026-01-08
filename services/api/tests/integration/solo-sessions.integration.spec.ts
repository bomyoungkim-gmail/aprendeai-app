import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { PrismaService } from "../../src/prisma/prisma.service";
import { AppModule } from "../../src/app.module";
import { AiServiceClient } from "../../src/ai-service/ai-service.client";

describe("Sprint 2: Solo Sessions (Integration)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AiServiceClient)
      .useValue({
        sendPrompt: jest.fn().mockResolvedValue({
          threadId: "test-thread-id",
          readingSessionId: "session-id",
          nextPrompt: "Mock Prompt",
          quickReplies: ["Mock Reply"],
          eventsToWrite: [
            {
              eventType: "PROMPT_SENT",
              payloadJson: {
                text: "What is the main idea of this article?",
                role: "USER",
              },
            },
            {
              eventType: "PROMPT_RECEIVED",
              payloadJson: {
                text: "Mock response",
                role: "ASSISTANT",
              },
            },
          ],
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up existing user
    await prisma.users.deleteMany({ where: { email: "maria@example.com" } });

    // Register test user (creates valid hash and meets password length reqs)
    await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({
        email: "maria@example.com",
        password: "demo1234",
        name: "Maria Test",
        role: "STUDENT",
        schoolingLevel: "MEDIO",
      })
      .expect(201);

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: "maria@example.com", password: "demo1234" })
      .expect(201);

    authToken = loginResponse.body.access_token;
    testUserId = loginResponse.body.user?.id;

    if (!authToken || !testUserId) {
      throw new Error(
        `Login failed: token=${!!authToken}, userId=${!!testUserId}`,
      );
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /sessions/:id - Enhanced Response", () => {
    let testContentId: string;
    let testSessionId: string;

    beforeEach(async () => {
      // Create test content
      const content = await prisma.contents.create({
        data: {
          id: "test-content-solo",
          title: "Test Reading Material",
          type: "PDF",
          original_language: "PT_BR",
          raw_text: "Sample text for reading",
        },
      });
      testContentId = content.id;

      // Create test session
      const session = await prisma.reading_sessions.create({
        data: {
          user_id: testUserId,
          content_id: testContentId,
          phase: "PRE",
          modality: "READING",
          asset_layer: "ORIGINAL",
          goal_statement: "Test goal",
          prediction_text: "",
          target_words_json: {},
        },
      });
      testSessionId = session.id;
    });

    afterEach(async () => {
      // Cleanup
      if (testSessionId) {
        await prisma.session_events.deleteMany({
          where: { reading_session_id: testSessionId },
        });
        await prisma.reading_sessions.delete({ where: { id: testSessionId } });
      }
      if (testContentId) {
        await prisma.contents.delete({ where: { id: testContentId } });
      }
    });

    it("should return session with content, messages, and quickReplies", async () => {
      // Create some session events (messages)
      await prisma.session_events.createMany({
        data: [
          {
            reading_session_id: testSessionId,
            event_type: "PROMPT_SENT",
            payload_json: {
              role: "USER",
              text: "Hello, I want to start reading",
            },
          },
          {
            reading_session_id: testSessionId,
            event_type: "PROMPT_RECEIVED",
            payload_json: {
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
      const file = await prisma.files.create({
        data: {
          id: "test-file-solo",
          storageProvider: "LOCAL",
          storageKey: "session-content-abc123.pdf",
          mimeType: "application/pdf",
          sizeBytes: BigInt(512000),
          checksumSha256: "hash123",
          originalFilename: "document.pdf",
        },
      });

      // Update content with file
      await prisma.contents.update({
        where: { id: testContentId },
        data: { file_id: file.id },
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
      await prisma.contents.update({
        where: { id: testContentId },
        data: { file_id: null },
      });
      await prisma.files.delete({ where: { id: file.id } });
    });

    it("should return 404 for non-existent session", async () => {
      await request(app.getHttpServer())
        .get("/api/v1/sessions/non-existent-id")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });

    it("should return 403 for session owned by another user", async () => {
      // Create another user's session
      const otherUser = await prisma.users.create({
        data: {
          email: "other@example.com",
          name: "Other User",

          status: "ACTIVE",
          updated_at: new Date(),
        } as any,
      });

      const otherSession = await prisma.reading_sessions.create({
        data: {
          user_id: otherUser.id,
          content_id: testContentId,
          phase: "PRE",
          modality: "READING",
          asset_layer: "ORIGINAL",
          goal_statement: "Other goal",
          prediction_text: "",
          target_words_json: {},
        },
      });

      await request(app.getHttpServer())
        .get(`/api/v1/sessions/${otherSession.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(403);

      // Cleanup
      await prisma.reading_sessions.delete({ where: { id: otherSession.id } });
      await prisma.users.delete({ where: { id: otherUser.id } });
    });
  });

  describe("POST /sessions/:id/prompt - Message Persistence", () => {
    let testContentId: string;
    let testSessionId: string;

    beforeEach(async () => {
      const content = await prisma.contents.create({
        data: {
          id: "test-content-prompt",
          title: "Prompt Test Material",
          type: "ARTICLE",
          original_language: "PT_BR",
          raw_text: "Article content",
        },
      });
      testContentId = content.id;

      const session = await prisma.reading_sessions.create({
        data: {
          user_id: testUserId,
          content_id: testContentId,
          phase: "DURING",
          modality: "READING",
          asset_layer: "ORIGINAL",
          goal_statement: "Read article",
          prediction_text: "",
          target_words_json: {},
        },
      });
      testSessionId = session.id;
    });

    afterEach(async () => {
      await prisma.session_events.deleteMany({
        where: { reading_session_id: testSessionId },
      });
      await prisma.reading_sessions.delete({ where: { id: testSessionId } });
      await prisma.contents.delete({ where: { id: testContentId } });
    });

    it("should create session event when sending prompt", async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/sessions/${testSessionId}/prompt`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          text: "What is the main idea of this article?",
          actorRole: "LEARNER",
          threadId: "test-thread-id",
          readingSessionId: testSessionId,
          clientTs: new Date().toISOString(),
          metadata: {
            uiMode: "DURING",
            contentId: testContentId,
            assetLayer: "L1", // Valid enum value
            readingIntent: "analytical", // Valid enum value
          },
        })
        .expect(201);

      // Verify response has nextPrompt and quickReplies
      expect(response.body).toHaveProperty("nextPrompt");
      expect(response.body).toHaveProperty("quickReplies");

      // Verify event was created
      const events = await prisma.session_events.findMany({
        where: { reading_session_id: testSessionId },
      });

      expect(events.length).toBeGreaterThan(0);
      const userEvent = events.find(
        (e) =>
          (e.payload_json as any)?.text ===
          "What is the main idea of this article?",
      );
      expect(userEvent).toBeDefined();
    });
  });
});
