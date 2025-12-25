import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/prisma/prisma.service";
import * as request from "supertest";
import { TestAuthHelper, createTestUser } from "../helpers/auth.helper";
import { JwtService } from "@nestjs/jwt";
import { apiUrl, ROUTES } from "../../src/common/constants/routes.constants";

describe("Extension Auth Integration Tests (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authHelper: TestAuthHelper;
  let userId: string;
  let authToken: string;

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

    // Initialize Auth Helper
    const jwtService = app.get<JwtService>(JwtService);
    // @ts-ignore - access private secret from jwt service option or config
    const secret = process.env.JWT_SECRET || "test-secret";
    authHelper = new TestAuthHelper(secret);

    // Create Test User in DB
    const userData = createTestUser();
    // Ensure unique email
    userData.email = `ext_test_${Date.now()}@example.com`;

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        passwordHash: "hash", // Mock hash
        role: "COMMON_USER",
        status: "ACTIVE",
        schoolingLevel: "HIGHER_EDUCATION",
      },
    });

    userId = user.id;
    // Generate valid JWT for this user
    authToken = authHelper.generateToken({ ...userData, id: user.id });
  });

  afterAll(async () => {
    // Cleanup
    if (userId) {
      await prisma.extensionDeviceAuth.deleteMany({ where: { userId } });
      await prisma.extensionGrant.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    }

    await prisma.$disconnect();
    await app.close();
  });

  describe("Device Code Flow", () => {
    let deviceCode: string;
    let userCode: string;
    let accessToken: string;
    let refreshToken: string;

    it("should start device code flow", async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.AUTH.EXTENSION_DEVICE_START))
        .send({
          clientId: "browser-extension",
          scopes: ["extension:webclip:create"],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("deviceCode");
      expect(response.body).toHaveProperty("userCode");
      expect(response.body).toHaveProperty("verificationUrl");

      deviceCode = response.body.deviceCode;
      userCode = response.body.userCode;
    });

    it("should return PENDING when polling immediately", async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.AUTH.EXTENSION_DEVICE_POLL))
        .send({
          clientId: "browser-extension",
          deviceCode,
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("PENDING");
    });

    it("should approve device code (as logged in user)", async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.AUTH.EXTENSION_DEVICE_APPROVE))
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          userCode,
          approve: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.ok).toBe(true);
    });

    it("should return APPROVED and tokens when polling after approval", async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.AUTH.EXTENSION_DEVICE_POLL))
        .send({
          clientId: "browser-extension",
          deviceCode,
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("APPROVED");
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
      expect(response.body.scope).toContain("extension:webclip:create");

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it("should use extension token to access protected endpoint", async () => {
      // Trying to access me endpoint
      const response = await request(app.getHttpServer())
        .get(apiUrl(ROUTES.AUTH.EXTENSION_ME))
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.userId).toBe(userId);
    });

    it("should refresh token", async () => {
      // Wait 1.1s to ensure new token has different 'iat' claim
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const response = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.AUTH.EXTENSION_TOKEN_REFRESH))
        .send({ refreshToken });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("accessToken");

      // Old token should still be valid until expiry, but let's just check we got a new one
      expect(response.body.accessToken).not.toBe(accessToken);
    });
  });
});
