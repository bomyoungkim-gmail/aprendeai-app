import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/prisma/prisma.service";
import { ROUTES, apiUrl } from "../helpers/routes";

describe("Primary Family Logic (Integration)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1"); // Match production
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    // Clean up test data
    await prisma.family_members.deleteMany({});
    await prisma.families.deleteMany({});
    await prisma.users.deleteMany({
      where: { email: { contains: "@primary-test.com" } },
    });
  });

  afterAll(async () => {
    await prisma.family_members.deleteMany({});
    await prisma.families.deleteMany({});
    await prisma.users.deleteMany({
      where: { email: { contains: "@primary-test.com" } },
    });
    await app.close();
  });

  // Helper to create a user and get token
  const createAndLoginUser = async (name: string, email: string) => {
    try {
      await request(app.getHttpServer())
        .post(apiUrl(ROUTES.AUTH.REGISTER))
        .send({
          email,
          password: "Test123!@#",
          name,
          role: "COMMON_USER",
          schoolingLevel: "UNDERGRADUATE",
        });
    } catch (e) {
      console.log("Register failed (might exist):", e.message);
    }

    const login = await request(app.getHttpServer())
      .post(apiUrl(ROUTES.AUTH.LOGIN))
      .send({ email, password: "Test123!@#" });

    if (login.status !== 200 && login.status !== 201) {
      console.error("Login failed for", email, login.body);
    }

    return {
      token: login.body.access_token,
      userId: login.body.user.id,
    };
  };

  describe("Auto-Primary on Creation", () => {
    it("should set primaryFamilyId in database when creating FIRST family", async () => {
      const { token, userId } = await createAndLoginUser(
        "User One",
        "user1-fresh@primary-test.com",
      );

      // Create Family A
      const res = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.FAMILY.BASE))
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Family A" })
        .expect(201);

      const familyId = res.body.id;

      // Verify DB
      const user = await prisma.users.findUnique({ where: { id: userId } });
      const settings = user.settings as any;
      expect(settings.primaryFamilyId).toBe(familyId);
    });

    it("should switch Primary when creating SECOND family (Creation Priority)", async () => {
      const { token, userId } = await createAndLoginUser(
        "User Two",
        "user2@primary-test.com",
      );

      // Create Family A
      const resA = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.FAMILY.BASE))
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Family A" });

      const familyAId = resA.body.id;

      // Verify A is Primary
      let user = await prisma.users.findUnique({ where: { id: userId } });
      expect((user.settings as any).primaryFamilyId).toBe(familyAId);

      // Create Family B
      const resB = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.FAMILY.BASE))
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Family B" });

      const familyBId = resB.body.id;

      // Verify B is NOW Primary (overwrote A)
      user = await prisma.users.findUnique({ where: { id: userId } });
      expect((user.settings as any).primaryFamilyId).toBe(familyBId);
    });
  });

  describe("Auto-Primary on Invites", () => {
    let ownerToken: string;
    let ownerId: string;
    let dependentToken: string;
    let dependentId: string;
    let dependentEmail: string;

    beforeEach(async () => {
      const cleanEmailBase = `dep${Date.now()}@primary-test.com`;
      dependentEmail = `dep-${cleanEmailBase}`;

      const ownerData = await createAndLoginUser(
        "Owner",
        `owner-${cleanEmailBase}`,
      );
      const dependentData = await createAndLoginUser(
        "Dependent",
        dependentEmail,
      );

      ownerToken = ownerData.token;
      ownerId = ownerData.userId;
      dependentToken = dependentData.token;
      dependentId = dependentData.userId;
    });

    it("should set Primary on FIRST invite acceptance", async () => {
      // 1. Owner creates family
      const res = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.FAMILY.BASE))
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({ name: "Invited Family" })
        .expect(201);
      const familyId = res.body.id;

      // 2. Owner invites dependent
      await request(app.getHttpServer())
        .post(apiUrl(ROUTES.FAMILY.INVITE(familyId)))
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({ email: dependentEmail, role: "CHILD" })
        .expect(201);

      // 3. Dependent accepts invite
      await request(app.getHttpServer())
        .post(apiUrl(ROUTES.FAMILY.ACCEPT(familyId)))
        .set("Authorization", `Bearer ${dependentToken}`)
        .expect(201);

      // 4. Verify primaryFamilyId set for dependent
      const user = await prisma.users.findUnique({
        where: { id: dependentId },
      });
      const settings = user.settings as any;
      expect(settings.primaryFamilyId).toBe(familyId);
    });

    it("should NOT change Primary on SECOND invite acceptance", async () => {
      // Setup: Dependent joins Family A (becomes Primary)
      const resA = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.FAMILY.BASE))
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({ name: "Family A" });
      const familyAId = resA.body.id;

      await request(app.getHttpServer())
        .post(apiUrl(ROUTES.FAMILY.INVITE(familyAId)))
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({ email: dependentEmail, role: "CHILD" })
        .expect(201);

      await request(app.getHttpServer())
        .post(apiUrl(ROUTES.FAMILY.ACCEPT(familyAId)))
        .set("Authorization", `Bearer ${dependentToken}`)
        .expect(201);

      // Verify A is Primary
      let user = await prisma.users.findUnique({ where: { id: dependentId } });
      expect((user.settings as any).primaryFamilyId).toBe(familyAId);

      // Create Family B
      const resB = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.FAMILY.BASE))
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({ name: "Family B" });
      const familyBId = resB.body.id;

      // Invite to Family B
      await request(app.getHttpServer())
        .post(apiUrl(ROUTES.FAMILY.INVITE(familyBId)))
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({ email: dependentEmail, role: "CHILD" })
        .expect(201);

      // Accept Family B
      await request(app.getHttpServer())
        .post(apiUrl(ROUTES.FAMILY.ACCEPT(familyBId)))
        .set("Authorization", `Bearer ${dependentToken}`)
        .expect(201);

      // Verify Primary is STILL Family A (not B)
      user = await prisma.users.findUnique({ where: { id: dependentId } });
      expect((user.settings as any).primaryFamilyId).toBe(familyAId);
      expect((user.settings as any).primaryFamilyId).not.toBe(familyBId);
    });
  });
});
