import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { PrismaService } from "../../src/prisma/prisma.service";
import { AppModule } from "../../src/app.module";

describe("Institution Admin Dashboard (Integration)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let institutionAdminId: string;
  let institutionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up
    await prisma.institutionMember.deleteMany({});
    await prisma.institution.deleteMany({
      where: { name: { contains: "Test Institution Admin" } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: "@inst-admin-test.com" } },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Setup: Create Institution Admin", () => {
    it("should register and login institution admin user", async () => {
      // Register
      const registerRes = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "admin@inst-admin-test.com",
          password: "Test123!",
          name: "Test Admin",
        })
        .expect(201);

      institutionAdminId = registerRes.body.id; // Register returns user directly

      // Login to get token
      const loginRes = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "admin@inst-admin-test.com",
          password: "Test123!",
        })
        .expect(201);

      expect(loginRes.body).toHaveProperty("access_token");
      authToken = loginRes.body.access_token;
    });

    it("should create institution and assign admin", async () => {
      const institution = await prisma.institution.create({
        data: {
          name: "Test Institution Admin School",
          type: "SCHOOL",
          city: "Test City",
          state: "TC",
        },
      });
      institutionId = institution.id;

      // Make user an INSTITUTION_ADMIN
      await prisma.institutionMember.create({
        data: {
          institution: { connect: { id: institutionId } },
          user: { connect: { id: institutionAdminId } },
          role: "INSTITUTION_ADMIN",
          status: "ACTIVE",
        },
      });

      // Update user role
      await prisma.user.update({
        where: { id: institutionAdminId },
        data: { role: "INSTITUTION_ADMIN" },
      });

      expect(institution).toBeDefined();
    });
  });

  describe("GET /institutions/my-institution", () => {
    it("should return institution data with stats", async () => {
      // Add some test data
      await prisma.institutionInvite.create({
        data: {
          institution: { connect: { id: institutionId } },
          email: "invited@test.com",
          role: "TEACHER",
          token: "test-token-123",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          inviter: { connect: { id: institutionAdminId } },
        },
      });

      await prisma.institutionDomain.create({
        data: {
          institutionId,
          domain: "@test-admin.edu",
          autoApprove: true,
          defaultRole: "STUDENT",
        },
      });

      const res = await request(app.getHttpServer())
        .get("/institutions/my-institution")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: institutionId,
        name: "Test Institution Admin School",
        type: "SCHOOL",
        city: "Test City",
        state: "TC",
      });

      expect(res.body).toHaveProperty("memberCount");
      expect(res.body).toHaveProperty("activeInvites");
      expect(res.body).toHaveProperty("pendingApprovals");
      expect(res.body).toHaveProperty("domains");

      expect(res.body.memberCount).toBeGreaterThanOrEqual(1);
      expect(res.body.activeInvites).toBeGreaterThanOrEqual(1);
      expect(res.body.domains).toContain("@test-admin.edu");
    });

    it("should return 401 for unauthenticated requests", async () => {
      await request(app.getHttpServer())
        .get("/institutions/my-institution")
        .expect(401);
    });

    it("should return 403 Forbidden for non-institution-admin users", async () => {
      // Create a regular user
      await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "regular@inst-admin-test.com",
          password: "Test123!",
          name: "Regular User",
        })
        .expect(201);

      // Login to get token
      const loginRes = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "regular@inst-admin-test.com",
          password: "Test123!",
        })
        .expect(201);

      const regularUserToken = loginRes.body.access_token;

      const res = await request(app.getHttpServer())
        .get("/institutions/my-institution")
        .set("Authorization", `Bearer ${regularUserToken}`)
        .expect(403); // Strictly expect Forbidden

      expect(res.body.message).toBe("Insufficient permissions");
    });
  });
});
