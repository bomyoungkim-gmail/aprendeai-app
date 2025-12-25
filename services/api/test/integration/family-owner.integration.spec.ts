import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { PrismaService } from "../../src/prisma/prisma.service";
import { AppModule } from "../../src/app.module";

describe("Family Owner Dashboard (Integration)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let familyOwnerId: string;
  let familyId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe("Setup: Create Family Owner", () => {
    it("should register and login family owner user", async () => {
      // Register
      const registerRes = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "owner@family-test.com",
          password: "Test123!",
          name: "Family Owner",
        })
        .expect(201);

      familyOwnerId = registerRes.body.id;

      // Login to get token
      const loginRes = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "owner@family-test.com",
          password: "Test123!",
        })
        .expect(201);

      expect(loginRes.body).toHaveProperty("access_token");
      authToken = loginRes.body.access_token;
    });

    it("should create family and assign owner", async () => {
      const family = await prisma.family.create({
        data: {
          name: "Test Family Owner Family",
          ownerId: familyOwnerId,
          members: {
            create: {
              user: { connect: { id: familyOwnerId } },
              role: "OWNER",
              status: "ACTIVE",
            },
          },
        },
      });
      familyId = family.id;

      // Set as primary family
      await prisma.user.update({
        where: { id: familyOwnerId },
        data: {
          settings: { primaryFamilyId: familyId },
        },
      });

      expect(family).toBeDefined();
    });
  });

  describe("GET /families/my-family", () => {
    it("should return family data with stats", async () => {
      // Add additional members
      const childUser = await prisma.user.create({
        data: {
          email: "child@family-test.com",
          name: "Test Child",
          passwordHash: "hashed",
          role: "COMMON_USER",
          schoolingLevel: "ELEMENTARY",
        },
      });

      await prisma.familyMember.create({
        data: {
          family: { connect: { id: familyId } },
          user: { connect: { id: childUser.id } },
          role: "CHILD",
          status: "ACTIVE",
        },
      });

      // Add invited member
      const invitedUser = await prisma.user.create({
        data: {
          email: "invited@family-test.com",
          name: "Invited Parent",
          passwordHash: "hashed",
          role: "COMMON_USER",
          schoolingLevel: "ADULT",
        },
      });

      await prisma.familyMember.create({
        data: {
          family: { connect: { id: familyId } },
          user: { connect: { id: invitedUser.id } },
          role: "GUARDIAN",
          status: "INVITED",
        },
      });

      const res = await request(app.getHttpServer())
        .get("/families/my-family")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("id", familyId);
      expect(res.body).toHaveProperty("name", "Test Family Owner Family");
      expect(res.body).toHaveProperty("stats");
      expect(res.body.stats.totalMembers).toBe(3); // Owner + Child + Invited
      expect(res.body.stats.activeMembers).toBe(2); // Owner + Child (not Invited)
      expect(res.body.stats.plan).toBe("Free");
      expect(res.body.members).toHaveLength(3);
    });

    it("should return 401 for unauthenticated requests", async () => {
      await request(app.getHttpServer()).get("/families/my-family").expect(401);
    });

    it("should return null for user without family", async () => {
      // Create user without family
      const registerRes = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "nofamily@test.com",
          password: "Test123!",
          name: "No Family User",
        })
        .expect(201);

      const loginRes = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "nofamily@test.com",
          password: "Test123!",
        })
        .expect(201);

      const noFamilyToken = loginRes.body.access_token;

      const res = await request(app.getHttpServer())
        .get("/families/my-family")
        .set("Authorization", `Bearer ${noFamilyToken}`)
        .expect(200);

      expect(res.body).toBeNull();
    });
  });
});
