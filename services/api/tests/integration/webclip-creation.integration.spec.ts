import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/prisma/prisma.service";
import * as request from "supertest";
import { TestAuthHelper, createTestUser } from "../helpers/auth.helper";
import { JwtService } from "@nestjs/jwt";
import { ROUTES, apiUrl } from "../../src/common/constants/routes.constants";
import { v4 as uuidv4 } from "uuid";

describe("WebClip Creation Integration Tests", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authHelper: TestAuthHelper;
  let userId: string;
  let extensionToken: string;
  let userToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    // Auth Helper
    const jwtService = app.get<JwtService>(JwtService);
    const secret = process.env.JWT_SECRET || "test-secret";
    authHelper = new TestAuthHelper(secret);

    // Create User
    const userData = createTestUser();
    userData.email = `webclip_test_${Date.now()}@example.com`;

    const user = await prisma.users.create({
      data: {
        id: uuidv4(),
        email: userData.email,
        name: userData.name,

        status: "ACTIVE",
        schooling_level: "HIGHER_EDUCATION",
        updated_at: new Date(),
      },
    });

    userId = user.id;
    userToken = authHelper.generateToken({ ...userData, id: user.id });

    // Generate Extension Token (simulating device flow result)
    // Manually create JWT with specific scopes
    const localJwtService = new JwtService({ secret });
    extensionToken = localJwtService.sign({
      sub: userId,
      email: userData.email,
      role: "COMMON_USER", // Usually not present in extension token, but good for guard compat
      scopes: ["extension:webclip:create", "extension:session:start"],
      clientId: "browser-extension",
    });
  });

  afterAll(async () => {
    if (userId) {
      // Must delete dependencies first
      await prisma.reading_sessions.deleteMany({ where: { user_id: userId } });
      // Delete interactions/logs if any?
      // ContentVersion might exist?
      // Since we don't have direct link from user to contentVersion easily without join,
      // we assume clean up deletion of content handles it IF we delete versions first.
      // But we can delete by contentId via findMany.

      const contents = await prisma.contents.findMany({
        where: { owner_user_id: userId },
        select: { id: true },
      });
      const contentIds = contents.map((c) => c.id);

      if (contentIds.length > 0) {
        await prisma.content_versions.deleteMany({
          where: { content_id: { in: contentIds } },
        });
        await prisma.user_library_items.deleteMany({
          where: { content_id: { in: contentIds } },
        });
      }

      await prisma.contents.deleteMany({ where: { owner_user_id: userId } });
      await prisma.users.delete({ where: { id: userId } });
    }
    await prisma.$disconnect();
    await app.close();
  });

  describe("WebClip Creation", () => {
    it("should create WebClip with valid extension token", async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.WEBCLIP.CREATE))
        .set("Authorization", `Bearer ${extensionToken}`)
        .send({
          sourceUrl: "https://example.com/article",
          title: "Test Article",
          siteDomain: "example.com",
          captureMode: "READABILITY",
          contentText: "Full article content here...",
          selectionText: "Only selected text",
          languageHint: "PT_BR",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("content_id");

      // Verify content details
      const contentId = response.body.content_id;
      const verifyResponse = await request(app.getHttpServer())
        .get(apiUrl(ROUTES.WEBCLIP.BASE + "/" + contentId))
        .set("Authorization", `Bearer ${userToken}`);

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.type).toBe("WEB_CLIP");
      expect(verifyResponse.body.metadata.source_url).toBe(
        "https://example.com/article",
      );
    });

    it("should reject creation without required scope", async () => {
      // Create token without webclip scope
      const secret = process.env.JWT_SECRET || "test-secret";
      const localJwtService = new JwtService({ secret });
      const weakToken = localJwtService.sign({
        sub: userId,
        email: "test@example.com", // Must be present for User extraction
        role: "COMMON_USER", // Must be present for Guard
        scopes: ["extension:session:start"], // Missing webclip:create
      });

      const response = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.WEBCLIP.CREATE))
        .set("Authorization", `Bearer ${weakToken}`)
        .send({
          sourceUrl: "https://example.com",
          title: "Fail",
          siteDomain: "example.com",
          captureMode: "SELECTION",
        });

      expect(response.status).toBe(403); // Forbidden
    });
  });

  describe("Session Start", () => {
    let contentId: string;

    beforeAll(async () => {
      // Create content first
      const content = await prisma.contents.create({
        data: {
          id: uuidv4(),
          type: "WEB_CLIP",
          title: "Session Content",
          users_owner: { connect: { id: userId } },
          users_created_by: { connect: { id: userId } },
          scope_type: "USER",
          original_language: "PT_BR",
          raw_text: "Test content for session",
          updated_at: new Date(),
        },
      });
      contentId = content.id;
    });

    it("should start session with valid extension token", async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.WEBCLIP.START_SESSION(contentId)))
        .set("Authorization", `Bearer ${extensionToken}`)
        .send({
          timeboxMin: 15,
          readingIntent: "inspectional",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("session_id");
      // Verifying a prompt is returned, specific content depends on LLM mock
      const prompt = response.body.next_prompt || response.body.initial_prompt;
      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe("string");
    });
  });
});
