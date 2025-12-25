import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { PrismaService } from "../../src/prisma/prisma.service";
import { AppModule } from "../../src/app.module";
import { ROUTES, apiUrl } from "../helpers/routes";

describe("Sprint 3: Annotation Audit Trail (Integration)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");  // Required for routes to work
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up any existing test users
    await prisma.user.deleteMany({
      where: { email: "maria@example.com" },
    });

    // Register test user (doesn't exist in seeds)
    await request(app.getHttpServer())
      .post(apiUrl(ROUTES.AUTH.REGISTER))
      .send({
        email: "maria@example.com",
        password: "demo1234",
        name: "Maria Silva",
        role: "STUDENT",
      })
      .expect(201);

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post(apiUrl(ROUTES.AUTH.LOGIN))
      .send({ email: "maria@example.com", password: "demo1234" })
      .expect(201);
    



    authToken = loginResponse.body.access_token;  // API returns access_token (underscore)
    testUserId = loginResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("PATCH /annotations/:id/favorite - SessionEvent Creation", () => {
    let testContentId: string;
    let testAnnotationId: string;

    beforeEach(async () => {
      // Create content
      const content = await prisma.content.create({
        data: {
          title: "Test Content for Annotations",
          type: "PDF",
          originalLanguage: "PT_BR",
          rawText: "Sample content",
        },
      });
      testContentId = content.id;

      // Create annotation
      const annotation = await prisma.annotation.create({
        data: {
          contentId: testContentId,
          userId: testUserId,
          type: "HIGHLIGHT",
          startOffset: 0,
          endOffset: 10,
          text: "Highlighted text",
          color: "#FFFF00",
          visibility: "PRIVATE",
          isFavorite: false,
        },
      });
      testAnnotationId = annotation.id;
    });

    afterEach(async () => {
      // Cleanup
      const events = await prisma.sessionEvent.findMany({
        where: {
          payloadJson: {
            path: ["annotationId"],
            equals: testAnnotationId,
          },
        },
      });
      if (events.length > 0) {
        await prisma.sessionEvent.deleteMany({
          where: { id: { in: events.map((e) => e.id) } },
        });
      }
      await prisma.annotation.delete({ where: { id: testAnnotationId } });
      await prisma.content.delete({ where: { id: testContentId } });
    });

    it("should toggle favorite and create SessionEvent", async () => {
      // Get initial event count
      const initialEventCount = await prisma.sessionEvent.count();

      // Toggle favorite
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/annotations/${testAnnotationId}/favorite`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.isFavorite).toBe(true);

      // Verify SessionEvent was created
      const events = await prisma.sessionEvent.findMany({
        where: {
          payloadJson: {
            path: ["annotationId"],
            equals: testAnnotationId,
          },
        },
        orderBy: { createdAt: "desc" },
      });

      expect(events.length).toBeGreaterThan(0);

      const favoriteEvent = events[0];
      expect(favoriteEvent.eventType).toBe("ANNOTATION_FAVORITE_TOGGLED");
      expect((favoriteEvent.payloadJson as any).annotationId).toBe(
        testAnnotationId,
      );
      expect((favoriteEvent.payloadJson as any).favorite).toBe(true);
      expect((favoriteEvent.payloadJson as any).userId).toBe(testUserId);

      // Verify event count increased
      const finalEventCount = await prisma.sessionEvent.count();
      expect(finalEventCount).toBe(initialEventCount + 1);
    });

    it("should create event when toggling favorite off", async () => {
      // First toggle on
      await request(app.getHttpServer())
        .patch(`/api/v1/annotations/${testAnnotationId}/favorite`)
        .set("Authorization", `Bearer ${authToken}`);

      // Then toggle off
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/annotations/${testAnnotationId}/favorite`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.isFavorite).toBe(false);

      // Verify latest event shows favorite=false
      const events = await prisma.sessionEvent.findMany({
        where: {
          payloadJson: {
            path: ["annotationId"],
            equals: testAnnotationId,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      });

      expect((events[0].payloadJson as any).favorite).toBe(false);
    });
  });

  describe("POST /annotations/:id/reply - SessionEvent Creation", () => {
    let testContentId: string;
    let testAnnotationId: string;

    beforeEach(async () => {
      // Create content
      const content = await prisma.content.create({
        data: {
          title: "Content with Annotations",
          type: "ARTICLE",
          originalLanguage: "PT_BR",
          rawText: "Article text",
        },
      });
      testContentId = content.id;

      // Create parent annotation
      const annotation = await prisma.annotation.create({
        data: {
          contentId: testContentId,
          userId: testUserId,
          type: "COMMENT",
          startOffset: 5,
          endOffset: 15,
          text: "This is interesting",
          color: "#00FF00",
          visibility: "PRIVATE",
        },
      });
      testAnnotationId = annotation.id;
    });

    afterEach(async () => {
      // Cleanup
      const events = await prisma.sessionEvent.findMany({
        where: {
          payloadJson: {
            path: ["annotationId"],
            equals: testAnnotationId,
          },
        },
      });
      if (events.length > 0) {
        await prisma.sessionEvent.deleteMany({
          where: { id: { in: events.map((e) => e.id) } },
        });
      }
      await prisma.annotation.deleteMany({
        where: {
          OR: [{ id: testAnnotationId }, { parentId: testAnnotationId }],
        },
      });
      await prisma.content.delete({ where: { id: testContentId } });
    });

    it("should create reply and SessionEvent", async () => {
      const initialEventCount = await prisma.sessionEvent.count();

      const response = await request(app.getHttpServer())
        .post(`/api/v1/annotations/${testAnnotationId}/reply`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          content: "I agree with this point!",
          color: "#00FF00",
        })
        .expect(201);

      expect(response.body.text).toBe("I agree with this point!");
      expect(response.body.parentId).toBe(testAnnotationId);

      // Verify SessionEvent was created
      const events = await prisma.sessionEvent.findMany({
        where: {
          payloadJson: {
            path: ["annotationId"],
            equals: testAnnotationId,
          },
        },
        orderBy: { createdAt: "desc" },
      });

      expect(events.length).toBeGreaterThan(0);

      const replyEvent = events[0];
      expect(replyEvent.eventType).toBe("ANNOTATION_REPLY_CREATED");
      expect((replyEvent.payloadJson as any).annotationId).toBe(
        testAnnotationId,
      );
      expect((replyEvent.payloadJson as any).replyId).toBe(response.body.id);
      expect((replyEvent.payloadJson as any).userId).toBe(testUserId);

      // Verify event count increased
      const finalEventCount = await prisma.sessionEvent.count();
      expect(finalEventCount).toBe(initialEventCount + 1);
    });

    it("should create multiple events for multiple replies", async () => {
      // Create first reply
      const reply1 = await request(app.getHttpServer())
        .post(`/api/v1/annotations/${testAnnotationId}/reply`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ content: "First reply", color: "#00FF00" });

      // Create second reply
      const reply2 = await request(app.getHttpServer())
        .post(`/api/v1/annotations/${testAnnotationId}/reply`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ content: "Second reply", color: "#00FF00" });

      // Verify 2 events created
      const events = await prisma.sessionEvent.findMany({
        where: {
          eventType: "ANNOTATION_REPLY_CREATED",
          payloadJson: {
            path: ["annotationId"],
            equals: testAnnotationId,
          },
        },
      });

      expect(events.length).toBe(2);
    });
  });

  describe("GET /annotations/search - Existing Functionality", () => {
    let testContentId: string;

    beforeEach(async () => {
      const content = await prisma.content.create({
        data: {
          title: "Searchable Content",
          type: "PDF",
          originalLanguage: "PT_BR",
          rawText: "Content for search",
        },
      });
      testContentId = content.id;

      // Create test annotations
      await prisma.annotation.createMany({
        data: [
          {
            contentId: testContentId,
            userId: testUserId,
            type: "HIGHLIGHT",
            startOffset: 0,
            endOffset: 5,
            text: "Test highlight",
            color: "#FFFF00",
            visibility: "PRIVATE",
          },
          {
            contentId: testContentId,
            userId: testUserId,
            type: "COMMENT",
            startOffset: 10,
            endOffset: 15,
            text: "Important note",
            color: "#FF0000",
            visibility: "PRIVATE",
          },
        ],
      });
    });

    afterEach(async () => {
      await prisma.annotation.deleteMany({
        where: { contentId: testContentId },
      });
      await prisma.content.deleteMany({ where: { id: testContentId } });
    });

    it("should search annotations by query", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/annotations/search")
        .query({ query: "Important" })
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      const foundAnnotation = response.body.find((a: any) =>
        a.text.includes("Important note"),
      );
      expect(foundAnnotation).toBeDefined();
    });
  });
});
