import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/prisma/prisma.service";
import * as request from "supertest";
import { TestAuthHelper, createTestUser } from "../helpers/auth.helper";
import { JwtService } from "@nestjs/jwt";
import { ROUTES, apiUrl } from "../../src/common/constants/routes.constants";

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

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        passwordHash: "hash",
        role: "COMMON_USER",
        status: "ACTIVE",
        schoolingLevel: "HIGHER_EDUCATION",
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
      await prisma.readingSession.deleteMany({ where: { userId } });
      // Delete interactions/logs if any?
      // ContentVersion might exist?
      // Since we don't have direct link from user to contentVersion easily without join,
      // we assume clean up deletion of content handles it IF we delete versions first.
      // But we can delete by contentId via findMany.

      const contents = await prisma.content.findMany({
        where: { createdBy: userId },
        select: { id: true },
      });
      const contentIds = contents.map((c) => c.id);

      if (contentIds.length > 0) {
        await prisma.contentVersion.deleteMany({
          where: { contentId: { in: contentIds } },
        });
        await prisma.userLibraryItem.deleteMany({
          where: { contentId: { in: contentIds } },
        });
      }

      await prisma.content.deleteMany({ where: { createdBy: userId } });
      await prisma.user.delete({ where: { id: userId } });
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
      expect(response.body).toHaveProperty("contentId");

      // Verify content details
      const contentId = response.body.contentId;
      const verifyResponse = await request(app.getHttpServer())
        .get(apiUrl(ROUTES.WEBCLIP.BASE + "/" + contentId))
        .set("Authorization", `Bearer ${userToken}`);

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.type).toBe("WEB_CLIP");
      expect(verifyResponse.body.metadata.sourceUrl).toBe(
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
      const content = await prisma.content.create({
        data: {
          type: "WEB_CLIP",
          title: "Session Content",
          creator: { connect: { id: userId } },
          scopeType: "USER",
          originalLanguage: "PT_BR",
          rawText: "Test content for session",
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
      expect(response.body).toHaveProperty("sessionId");
      // Verifying a prompt is returned, specific content depends on LLM mock
      const prompt = response.body.nextPrompt || response.body.initialPrompt;
      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe("string");
    });
  });
});
