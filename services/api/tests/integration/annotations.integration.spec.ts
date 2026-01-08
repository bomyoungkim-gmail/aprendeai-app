import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { ConfigService } from "@nestjs/config";
import { TestAuthHelper } from "../helpers/auth.helper";
import { PrismaService } from "../../src/prisma/prisma.service";
import { AppModule } from "../../src/app.module";
import { apiUrl } from "../helpers/routes";

describe("Annotations Integration Tests", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authHelper: TestAuthHelper;
  let authToken: string;
  let testUserId: string;
  let testContentId: string;
  let testGroupId: string;
  let testUserEmail: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1"); // Match production
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    const configService = app.get<ConfigService>(ConfigService);

    // Initialize auth helper
    const jwtSecret =
      configService.get<string>("JWT_SECRET") || "test-secret-key";
    authHelper = new TestAuthHelper(jwtSecret);

    // Create unique test user (Dynamic Data)
    testUserEmail = `annotations-test-${Date.now()}@example.com`;

    // Explicitly create user in DB
    const user = await prisma.users.upsert({
      where: { email: testUserEmail },
      create: {
        email: testUserEmail,
        name: "Annotations Tester",

        schooling_level: "ADULT",
        status: "ACTIVE",
        system_role: "ADMIN" as any, // Give admin to be safe for all Ops
      },
      update: {},
    });

    testUserId = user.id;

    // Generate JWT token directly
    authToken = authHelper.generateAuthHeader({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    // Create test content
    const content = await prisma.contents.create({
      data: {
        id: `content-${Date.now()}`,
        title: "Test Content for Annotations",
        type: "PDF",
        original_language: "EN",
        raw_text:
          "This is test content for annotations. We will highlight and annotate this text.",
        owner_user_id: testUserId,
      },
    });
    testContentId = content.id;

    // Create test group
    const group = await prisma.study_groups.create({
      data: {
        id: `group-${Date.now()}`,
        name: "Test Annotation Group",
        owner_user_id: testUserId,
      },
    });
    testGroupId = group.id;

    // Add user to group
    await prisma.study_group_members.create({
      data: {
        group_id: testGroupId,
        user_id: testUserId,
        role: "OWNER" as any,
        status: "ACTIVE",
      },
    });
  });

  afterAll(async () => {
    // Cleanup in correct order
    if (testContentId) {
      await prisma.annotations.deleteMany({
        where: { content_id: testContentId },
      });
      await prisma.contents.delete({ where: { id: testContentId } });
    }

    if (testGroupId) {
      await prisma.study_group_members.deleteMany({
        where: { group_id: testGroupId },
      });
      await prisma.study_groups.delete({ where: { id: testGroupId } });
    }

    if (testUserId) {
      await prisma.users.delete({ where: { id: testUserId } });
    }

    await app.close();
  });

  describe("POST /contents/:contentId/annotations", () => {
    it("should create a highlight annotation", async () => {
      const res = await request(app.getHttpServer())
        .post(apiUrl(`contents/${testContentId}/annotations`))
        .set("Authorization", authToken)
        .send({
          type: "HIGHLIGHT",
          startOffset: 0,
          endOffset: 20,
          selectedText: "This is test content",
          color: "yellow",
          visibility: "PRIVATE",
        })
        .expect(201);

      expect(res.body).toMatchObject({
        type: "HIGHLIGHT",
        color: "yellow",
        visibility: "PRIVATE",
      });
      expect(res.body.id).toBeDefined();
    });

    it("should create a note annotation", async () => {
      const res = await request(app.getHttpServer())
        .post(apiUrl(`contents/${testContentId}/annotations`))
        .set("Authorization", authToken)
        .send({
          type: "NOTE",
          startOffset: 25,
          endOffset: 45,
          selectedText: "highlight and annotate",
          text: "This is my note about this section",
          visibility: "PRIVATE",
        })
        .expect(201);

      expect(res.body.type).toBe("NOTE");
      expect(res.body.text).toBe("This is my note about this section");
    });

    it("should create a group annotation", async () => {
      const res = await request(app.getHttpServer())
        .post(apiUrl(`contents/${testContentId}/annotations`))
        .set("Authorization", authToken)
        .send({
          type: "HIGHLIGHT",
          startOffset: 50,
          endOffset: 60,
          selectedText: "this text",
          color: "green",
          visibility: "GROUP",
          groupId: testGroupId,
        })
        .expect(201);

      expect(res.body.visibility).toBe("GROUP");
      expect(res.body.group_id).toBe(testGroupId);
    });
  });

  describe("GET /contents/:contentId/annotations", () => {
    it("should return all annotations for content", async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl(`contents/${testContentId}/annotations`))
        .set("Authorization", authToken)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty("users");
    });

    it("should filter by groupId", async () => {
      const res = await request(app.getHttpServer())
        .get(
          apiUrl(
            `contents/${testContentId}/annotations?groupId=${testGroupId}`,
          ),
        )
        .set("Authorization", authToken)
        .expect(200);

      const groupAnnotations = res.body.filter(
        (a: any) => a.groupId === testGroupId || a.group_id === testGroupId,
      );
      expect(groupAnnotations.length).toBeGreaterThan(0);
    });
  });

  describe("PUT /contents/:contentId/annotations/:id", () => {
    it("should update annotation text", async () => {
      // First create an annotation
      const createRes = await request(app.getHttpServer())
        .post(apiUrl(`contents/${testContentId}/annotations`))
        .set("Authorization", authToken)
        .send({
          type: "NOTE",
          startOffset: 0,
          endOffset: 10,
          text: "Original text",
          visibility: "PRIVATE",
        });

      const annotationId = createRes.body.id;

      // Then update it
      const updateRes = await request(app.getHttpServer())
        .put(apiUrl(`contents/${testContentId}/annotations/${annotationId}`))
        .set("Authorization", authToken)
        .send({ text: "Updated text" })
        .expect(200);

      expect(updateRes.body.text).toBe("Updated text");
    });
  });

  describe("DELETE /contents/:contentId/annotations/:id", () => {
    it("should delete annotation", async () => {
      // Create annotation
      const createRes = await request(app.getHttpServer())
        .post(apiUrl(`contents/${testContentId}/annotations`))
        .set("Authorization", authToken)
        .send({
          type: "HIGHLIGHT",
          startOffset: 0,
          endOffset: 5,
          color: "blue",
          visibility: "PRIVATE",
        });

      const annotationId = createRes.body.id;

      // Delete it
      await request(app.getHttpServer())
        .delete(apiUrl(`contents/${testContentId}/annotations/${annotationId}`))
        .set("Authorization", authToken)
        .expect(200);

      // Verify deletion
      const annotations = await prisma.annotations.findUnique({
        where: { id: annotationId },
      });
      expect(annotations).toBeNull();
    });
  });
});
