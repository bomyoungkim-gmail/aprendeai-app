import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { PrismaService } from "../../src/prisma/prisma.service";
import { AppModule } from "../../src/app.module";
import { ROUTES, apiUrl } from "../helpers/routes";

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
    app.setGlobalPrefix("api/v1"); // Required for routes to work
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
      // Clean up existing users
      await prisma.families.deleteMany({
        where: {
          users_owner: {
            email: {
              in: [
                "owner@family-test.com",
                "child@family-test.com",
                "invited@family-test.com",
              ],
            },
          },
        },
      });
      await prisma.users.deleteMany({
        where: {
          email: {
            in: [
              "owner@family-test.com",
              "child@family-test.com",
              "invited@family-test.com",
            ],
          },
        },
      });

      // Register
      const registerRes = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.AUTH.REGISTER))
        .send({
          email: "owner@family-test.com",
          password: "Test123!",
          name: "Family Owner",
        })
        .expect(201);

      familyOwnerId = registerRes.body.id;

      // Login to get token
      const loginRes = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.AUTH.LOGIN))
        .send({
          email: "owner@family-test.com",
          password: "Test123!",
        })
        .expect(201);

      expect(loginRes.body).toHaveProperty("access_token");
      authToken = loginRes.body.access_token;
    });

    it("should create family and assign owner", async () => {
      const family = await prisma.families.create({
        data: {
          name: "Test Family Owner Family",
          owner_user_id: familyOwnerId,
          family_members: {
            create: {
              user_id: familyOwnerId,
              role: "OWNER" as any,
              status: "ACTIVE",
            },
          },
        },
      });
      familyId = family.id;

      // Set as primary family
      await prisma.users.update({
        where: { id: familyOwnerId },
        data: {
          settings: { primaryFamilyId: familyId } as any,
        },
      });

      expect(family).toBeDefined();
    });
  });

  describe("GET /families/my-family", () => {
    it("should return family data with stats", async () => {
      // Add additional members
      const childUser = await prisma.users.create({
        data: {
          email: "child@family-test.com",
          name: "Test Child",

          schooling_level: "ELEMENTARY",
        },
      });

      await prisma.family_members.create({
        data: {
          family_id: familyId,
          user_id: childUser.id,
          role: "CHILD" as any,
          status: "ACTIVE",
        },
      });

      // Add invited member
      const invitedUser = await prisma.users.create({
        data: {
          email: "invited@family-test.com",
          name: "Invited Parent",

          schooling_level: "ADULT",
        },
      });

      await prisma.family_members.create({
        data: {
          family_id: familyId,
          user_id: invitedUser.id,
          role: "GUARDIAN" as any,
          status: "INVITED",
        },
      });

      const res = await request(app.getHttpServer())
        .get(apiUrl(ROUTES.FAMILY.MY_FAMILY))
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
      await request(app.getHttpServer())
        .get(apiUrl(ROUTES.FAMILY.MY_FAMILY))
        .expect(401);
    });

    it("should return null for user without family", async () => {
      // Clean up any existing test users
      await prisma.users.deleteMany({
        where: { email: "nofamily@test.com" },
      });

      // Create user without family
      const registerRes = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.AUTH.REGISTER))
        .send({
          email: "nofamily@test.com",
          password: "Test123!",
          name: "No Family User",
        })
        .expect(201);

      const loginRes = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.AUTH.LOGIN))
        .send({
          email: "nofamily@test.com",
          password: "Test123!",
        })
        .expect(201);

      const noFamilyToken = loginRes.body.access_token;

      const res = await request(app.getHttpServer())
        .get(apiUrl(ROUTES.FAMILY.MY_FAMILY))
        .set("Authorization", `Bearer ${noFamilyToken}`)
        .expect(200);

      expect(res.body).toEqual({}); // API returns empty object if no family found
    });
  });
});
