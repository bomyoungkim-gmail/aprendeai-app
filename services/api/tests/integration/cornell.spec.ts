/**
 * Integration Tests - Cornell Notes
 *
 * Tests Cornell Notes API with real database:
 * - Auto-create on first GET
 * - Save notes (PUT)
 * - Retrieve saved notes (GET)
 * - Update existing notes
 */

import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/prisma/prisma.service";
import { ROUTES, apiUrl } from "../helpers/routes";
import { InstitutionType } from "@prisma/client";

describe("Cornell Notes Integration Tests", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testUserId: string;
  let testContentId: string;
  let testInstitutionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    ); // Enable validation
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Create Institution
    const institution = await prisma.institutions.create({
      data: {
        name: "Cornell Test University",
        type: InstitutionType.UNIVERSITY,
        city: "Test City",
        country: "Test Country",
      },
    });
    testInstitutionId = institution.id;

    const testEmail = `cornell-test-${Date.now()}@example.com`;

    // Register user via API
    await request(app.getHttpServer())
      .post(apiUrl(ROUTES.AUTH.REGISTER))
      .send({
        email: testEmail,
        password: "Test123!@#",
        name: "Cornell Test User",
        role: "COMMON_USER",
        schoolingLevel: "ADULT",
        institutionId: testInstitutionId,
      })
      .expect(201);

    // Login (Auth token will belong to THIS user)
    const loginResponse = await request(app.getHttpServer())
      .post(apiUrl(ROUTES.AUTH.LOGIN))
      .send({
        email: testEmail,
        password: "Test123!@#",
      })
      .expect(201);

    authToken = `Bearer ${loginResponse.body.access_token}`;

    // Fetch the REAL user ID from DB
    const user = await prisma.users.findUnique({ where: { email: testEmail } });
    testUserId = user.id;

    // Create test content OWNED by THIS user
    const content = await prisma.contents.create({
      data: {
        id: `content-${Date.now()}`,
        owner_user_id: testUserId,
        title: "Cornell Test Content",
        type: "PDF",
        original_language: "EN",
        raw_text: "Test content for Cornell notes testing.",
      },
    });
    testContentId = content.id;
  });

  afterAll(async () => {
    try {
      await prisma.cornell_notes.deleteMany({ where: { user_id: testUserId } });
      // Delete contents (allow failure if deps exist)
      await prisma.contents.deleteMany({ where: { id: testContentId } });
      await prisma.users.deleteMany({ where: { id: testUserId } });
      await prisma.institutions.deleteMany({
        where: { id: testInstitutionId },
      });
    } catch (e) {
      // Ignore cleanup errors
      console.warn("Cleanup failed:", e.message);
    }
    await app.close();
  });

  describe("GET /contents/:id/cornell - Auto-create", () => {
    it("should create empty Cornell notes on first GET", async () => {
      const response = await request(app.getHttpServer())
        .get(apiUrl(ROUTES.CONTENT.CORNELL(testContentId)))
        .set("Authorization", authToken)
        .expect(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body.content_id).toBe(testContentId);
      expect(response.body.user_id).toBe(testUserId);
      expect(response.body.notes_json).toEqual([]);
      expect(response.body.cues_json).toEqual([]);
      expect(response.body.summary_text).toBe("");
    });

    it("should return existing Cornell notes on subsequent GET", async () => {
      // First GET creates it
      const first = await request(app.getHttpServer())
        .get(apiUrl(ROUTES.CONTENT.CORNELL(testContentId)))
        .set("Authorization", authToken)
        .expect(200);

      const createdId = first.body.id;

      // Second GET returns same
      const second = await request(app.getHttpServer())
        .get(apiUrl(ROUTES.CONTENT.CORNELL(testContentId)))
        .set("Authorization", authToken)
        .expect(200);

      expect(second.body.id).toBe(createdId);
    });
  });

  describe("PUT /contents/:id/cornell - Save Notes", () => {
    beforeEach(async () => {
      await prisma.cornell_notes.deleteMany({
        where: { user_id: testUserId },
      });
    });

    it("should save notes", async () => {
      const notes_json = [
        { id: "1", text: "First note about the content" },
        { id: "2", text: "Second important point" },
      ];

      const response = await request(app.getHttpServer())
        .put(apiUrl(ROUTES.CONTENT.CORNELL(testContentId)))
        .set("Authorization", authToken)
        .send({ notes_json })
        .expect(200);

      expect(response.body.notes_json).toEqual(notes_json);
    });

    it("should save cues", async () => {
      const cues_json = ["What is X?", "Why Y?"];

      const response = await request(app.getHttpServer())
        .put(apiUrl(ROUTES.CONTENT.CORNELL(testContentId)))
        .set("Authorization", authToken)
        .send({ cues_json })
        .expect(200);

      expect(response.body.cues_json).toEqual(cues_json);
    });

    it("should save summary text", async () => {
      const summary_text = "This is a comprehensive summary.";

      const response = await request(app.getHttpServer())
        .put(apiUrl(ROUTES.CONTENT.CORNELL(testContentId)))
        .set("Authorization", authToken)
        .send({ summary_text })
        .expect(200);

      expect(response.body.summary_text).toBe(summary_text);
    });

    it("should save all fields together", async () => {
      const data = {
        notes_json: [{ id: "1", text: "Note 1" }],
        cues_json: ["Question 1"],
        summary_text: "Complete summary",
      };

      const response = await request(app.getHttpServer())
        .put(apiUrl(ROUTES.CONTENT.CORNELL(testContentId)))
        .set("Authorization", authToken)
        .send(data)
        .expect(200);

      expect(response.body.notes_json).toEqual(data.notes_json);
      expect(response.body.cues_json).toEqual(data.cues_json);
      expect(response.body.summary_text).toBe(data.summary_text);
    });
  });

  describe("Cornell Notes Persistence", () => {
    it("should persist changes across GET requests", async () => {
      const data = {
        notes_json: [{ id: "1", text: "Persisted note" }],
        summary_text: "Persisted summary",
      };

      // Save
      await request(app.getHttpServer())
        .put(apiUrl(ROUTES.CONTENT.CORNELL(testContentId)))
        .set("Authorization", authToken)
        .send(data)
        .expect(200);

      // Retrieve
      const response = await request(app.getHttpServer())
        .get(apiUrl(ROUTES.CONTENT.CORNELL(testContentId)))
        .set("Authorization", authToken)
        .expect(200);

      expect(response.body.notes_json).toEqual(data.notes_json);
      expect(response.body.summary_text).toBe(data.summary_text);
    });

    it("should update existing notes without losing data", async () => {
      // Initial save
      await request(app.getHttpServer())
        .put(apiUrl(ROUTES.CONTENT.CORNELL(testContentId)))
        .set("Authorization", authToken)
        .send({
          notes_json: [{ id: "1", text: "Original" }],
          summary_text: "Original summary",
        })
        .expect(200);

      // Update only cues
      const updated = await request(app.getHttpServer())
        .put(apiUrl(ROUTES.CONTENT.CORNELL(testContentId)))
        .set("Authorization", authToken)
        .send({
          cues_json: ["New cue"],
        })
        .expect(200);

      expect(updated.body.notes_json).toEqual([{ id: "1", text: "Original" }]);
      expect(updated.body.summary_text).toBe("Original summary");
      expect(updated.body.cues_json).toEqual(["New cue"]);
    });
  });

  describe("Cornell Notes Validation", () => {
    it("should reject invalid notes_json format", async () => {
      await request(app.getHttpServer())
        .put(apiUrl(ROUTES.CONTENT.CORNELL(testContentId)))
        .set("Authorization", authToken)
        .send({
          notes_json: "not an array", // Should be array
        })
        .expect(400);
    });

    it("should allow empty cornell notes", async () => {
      const response = await request(app.getHttpServer())
        .put(apiUrl(ROUTES.CONTENT.CORNELL(testContentId)))
        .set("Authorization", authToken)
        .send({
          notes_json: [],
          cues_json: [],
          summary_text: "",
        })
        .expect(200);

      expect(response.body.notes_json).toEqual([]);
    });
  });
});
