import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/prisma/prisma.service";
import { ROUTES, apiUrl } from "../../src/common/constants";

describe("Family Plan (Integration)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let ownerUserId: string;
  let familyId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Match production configuration from main.ts
    app.setGlobalPrefix("api/v1");

    // Enable validation globally (same as main.ts)
    const { ValidationPipe } = await import("@nestjs/common");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up test data
    await prisma.family_members.deleteMany({});
    await prisma.families.deleteMany({});
    await prisma.users.deleteMany({
      where: { email: { contains: "@family-test.com" } },
    });
  });

  afterAll(async () => {
    // Clean up after tests
    await prisma.family_members.deleteMany({});
    await prisma.families.deleteMany({});
    await prisma.users.deleteMany({
      where: { email: { contains: "@family-test.com" } },
    });

    await app.close();
  });

  describe("Authentication Setup", () => {
    it("should register and login owner user", async () => {
      // Register
      await request(app.getHttpServer())
        .post(apiUrl(ROUTES.AUTH.REGISTER))
        .send({
          email: "owner@family-test.com",
          password: "Test123!@#",
          name: "Family Owner",
          role: "COMMON_USER",
          institutionId: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID v4 for testing
          schoolingLevel: "UNDERGRADUATE",
        })
        .expect(201);

      // Login
      const loginResponse = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.AUTH.LOGIN))
        .send({
          email: "owner@family-test.com",
          password: "Test123!@#",
        })
        .expect(201);

      authToken = loginResponse.body.access_token;
      ownerUserId = loginResponse.body.user.id;

      expect(authToken).toBeDefined();
    });
  });

  describe("POST /families", () => {
    it("should create family with current user as owner", async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.FAMILY.BASE))
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Test Family",
        })
        .expect(201);

      familyId = response.body.id;

      expect(response.body).toMatchObject({
        name: "Test Family",
        owner_user_id: ownerUserId,
      });
    });

    it("should create owner membership record", async () => {
      const members = await prisma.family_members.findMany({
        where: { family_id: familyId },
      });

      expect(members).toHaveLength(1);
      expect(members[0]).toMatchObject({
        user_id: ownerUserId,
        role: "OWNER",
        status: "ACTIVE",
      });
    });

    it("should return family with members array", async () => {
      const response = await request(app.getHttpServer())
        .get(apiUrl(ROUTES.FAMILY.BY_ID(familyId)))
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.members).toBeDefined();
      expect(response.body.members).toHaveLength(1);
      expect(response.body.members[0].role).toBe("OWNER");
    });
  });

  describe("GET /families", () => {
    it("should list all families user belongs to", async () => {
      const response = await request(app.getHttpServer())
        .get(apiUrl(ROUTES.FAMILY.BASE))
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe("Test Family");
    });
  });

  describe("POST /families/:id/invite", () => {
    it("should add existing user as GUARDIAN", async () => {
      // Create existing user
      await request(app.getHttpServer())
        .post(apiUrl(ROUTES.AUTH.REGISTER))
        .send({
          email: "existing@family-test.com",
          password: "Test123!@#",
          name: "Existing User",
          role: "COMMON_USER",
          institutionId: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID v4 for testing
          schoolingLevel: "UNDERGRADUATE",
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.FAMILY.INVITE(familyId)))
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: "existing@family-test.com",
          role: "GUARDIAN",
        })
        .expect(201);

      // expect(response.body.message).toContain('invited'); // Controllers return data directly

      // Verify membership created
      const existingUser = await prisma.users.findUnique({
        where: { email: "existing@family-test.com" },
      });

      const membership = await prisma.family_members.findUnique({
        where: {
          family_id_user_id: {
            family_id: familyId,
            user_id: existingUser.id,
          },
        },
      });

      expect(membership).toBeDefined();
      expect(membership.role).toBe("GUARDIAN");
    });

    it("should create placeholder user for new email", async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.FAMILY.INVITE(familyId)))
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: "newuser@family-test.com",
          displayName: "New User",
          role: "CHILD",
        })
        .expect(201);

      // expect(response.body.message).toContain('invited'); // Controllers return data directly

      // Verify placeholder user created
      const newUser = await prisma.users.findUnique({
        where: { email: "newuser@family-test.com" },
      });

      expect(newUser).toBeDefined();
      expect(newUser.password_hash).toBe("PENDING_INVITE");
      expect(newUser.name).toBe("New User");
    });

    it("should reject duplicate invitations", async () => {
      await request(app.getHttpServer())
        .post(apiUrl(ROUTES.FAMILY.INVITE(familyId)))
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: "existing@family-test.com",
          role: "GUARDIAN",
        })
        .expect(409);
    });

    it("should only allow owner to invite members", async () => {
      // Login as non-owner
      await request(app.getHttpServer())
        .post(apiUrl(ROUTES.AUTH.REGISTER))
        .send({
          email: "nonowner@family-test.com",
          password: "Test123!@#",
          name: "Non Owner",
          role: "COMMON_USER",
          institutionId: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID v4 for testing
          schoolingLevel: "UNDERGRADUATE",
        });

      const nonOwnerLogin = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.AUTH.LOGIN))
        .send({
          email: "nonowner@family-test.com",
          password: "Test123!@#",
        });

      const nonOwnerToken = nonOwnerLogin.body.access_token;

      await request(app.getHttpServer())
        .post(apiUrl(ROUTES.FAMILY.INVITE(familyId)))
        .set("Authorization", `Bearer ${nonOwnerToken}`)
        .send({
          email: "another@family-test.com",
          role: "CHILD",
        })
        .expect(403);
    });
  });

  describe("POST /families/:id/transfer-ownership", () => {
    let memberUserId: string;

    beforeAll(async () => {
      const existingUser = await prisma.users.findUnique({
        where: { email: "existing@family-test.com" },
      });
      memberUserId = existingUser.id;
    });

    it("should transfer ownership to existing member", async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.FAMILY.TRANSFER_OWNERSHIP(familyId)))
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          newOwnerId: memberUserId,
        })
        .expect(201);

      // expect(response.body.message).toContain('transferred'); // Controllers return data directly

      // Verify family owner_user_id updated
      const family = await prisma.families.findUnique({
        where: { id: familyId },
      });
      expect(family.owner_user_id).toBe(memberUserId);

      // Verify old owner downgraded to GUARDIAN
      const oldOwnerMembership = await prisma.family_members.findUnique({
        where: {
          family_id_user_id: { family_id: familyId, user_id: ownerUserId },
        },
      });
      expect(oldOwnerMembership.role).toBe("GUARDIAN");

      // Verify new owner upgraded to OWNER
      const newOwnerMembership = await prisma.family_members.findUnique({
        where: {
          family_id_user_id: { family_id: familyId, user_id: memberUserId },
        },
      });
      expect(newOwnerMembership.role).toBe("OWNER");
    });

    it("should prevent non-owner from transferring", async () => {
      // Try to transfer back using old owner token (now just a guardian)
      await request(app.getHttpServer())
        .post(apiUrl(ROUTES.FAMILY.TRANSFER_OWNERSHIP(familyId)))
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          newOwnerId: ownerUserId,
        })
        .expect(403);
    });

    afterAll(async () => {
      // Transfer ownership back for other tests
      const newOwnerLogin = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.AUTH.LOGIN))
        .send({
          email: "existing@family-test.com",
          password: "Test123!@#",
        });

      await request(app.getHttpServer())
        .post(apiUrl(ROUTES.FAMILY.TRANSFER_OWNERSHIP(familyId)))
        .set("Authorization", `Bearer ${newOwnerLogin.body.access_token}`)
        .send({
          newOwnerId: ownerUserId,
        })
        .expect(201);
    });
  });

  describe("POST /families/:id/primary", () => {
    it("should set family as primary for user", async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.FAMILY.SET_PRIMARY(familyId)))
        .set("Authorization", `Bearer ${authToken}`)
        .expect(201);

      // expect(response.body.message).toContain('primary'); // Controllers return data directly

      // Verify user settings updated
      const user = await prisma.users.findUnique({
        where: { id: ownerUserId },
      });

      expect(user.settings).toHaveProperty("primaryFamilyId", familyId);
    });

    it("should only allow family members to set as primary", async () => {
      await request(app.getHttpServer())
        .post(apiUrl(ROUTES.AUTH.REGISTER))
        .send({
          email: "outsider@family-test.com",
          password: "Test123!@#",
          name: "Outsider",
          role: "COMMON_USER",
          institutionId: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID v4 for testing
          schoolingLevel: "UNDERGRADUATE",
        });

      const outsiderLogin = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.AUTH.LOGIN))
        .send({
          email: "outsider@family-test.com",
          password: "Test123!@#",
        });

      await request(app.getHttpServer())
        .post(apiUrl(ROUTES.FAMILY.SET_PRIMARY(familyId)))
        .set("Authorization", `Bearer ${outsiderLogin.body.access_token}`)
        .expect(403);
    });
  });

  describe.skip("GET /families/:id/billing-hierarchy (NOT IMPLEMENTED)", () => {
    it("should resolve to primary family", async () => {
      const response = await request(app.getHttpServer())
        .get(apiUrl(ROUTES.FAMILY.BILLING_HIERARCHY(familyId)))
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.scopeType).toBe("FAMILY");
      expect(response.body.scopeId).toBe(familyId);
    });

    it("should fall back to user scope if no families", async () => {
      const outsiderLogin = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.AUTH.LOGIN))
        .send({
          email: "outsider@family-test.com",
          password: "Test123!@#",
        });

      const response = await request(app.getHttpServer())
        .get(apiUrl(ROUTES.FAMILY.BILLING_HIERARCHY("any-id")))
        .set("Authorization", `Bearer ${outsiderLogin.body.access_token}`)
        .expect(200);

      expect(response.body.scopeType).toBe("USER");
    });
  });

  describe("DELETE /families/:id", () => {
    let tempFamilyId: string;

    beforeAll(async () => {
      // Create a temporary family to delete
      const response = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.FAMILY.BASE))
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Temp Family",
        });

      tempFamilyId = response.body.id;
    });

    it("should delete family and all members", async () => {
      await request(app.getHttpServer())
        .delete(apiUrl(ROUTES.FAMILY.BY_ID(tempFamilyId)))
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // Verify family deleted
      const family = await prisma.families.findUnique({
        where: { id: tempFamilyId },
      });
      expect(family).toBeNull();

      // Verify members deleted
      const members = await prisma.family_members.findMany({
        where: { family_id: tempFamilyId },
      });
      expect(members).toHaveLength(0);
    });

    it("should only allow owner to delete family", async () => {
      const newOwnerLogin = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.AUTH.LOGIN))
        .send({
          email: "existing@family-test.com",
          password: "Test123!@#",
        });

      await request(app.getHttpServer())
        .delete(apiUrl(ROUTES.FAMILY.BY_ID(familyId)))
        .set("Authorization", `Bearer ${newOwnerLogin.body.access_token}`)
        .expect(403);
    });

    it("should return 404 if family does not exist", async () => {
      await request(app.getHttpServer())
        .delete(apiUrl(ROUTES.FAMILY.BY_ID("non-existent-id")))
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe("Multi-Family Scenarios", () => {
    let secondFamilyId: string;

    it("should create second family", async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.FAMILY.BASE))
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Second Family",
        })
        .expect(201);

      secondFamilyId = response.body.id;
      expect(response.body.name).toBe("Second Family");
    });

    it("should list both families", async () => {
      const response = await request(app.getHttpServer())
        .get(apiUrl(ROUTES.FAMILY.BASE))
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(2);
      const familyNames = response.body.map((f) => f.name);
      expect(familyNames).toContain("Test Family");
      expect(familyNames).toContain("Second Family");
    });

    it("should switch primary family", async () => {
      await request(app.getHttpServer())
        .post(apiUrl(ROUTES.FAMILY.SET_PRIMARY(secondFamilyId)))
        .set("Authorization", `Bearer ${authToken}`)
        .expect(201);

      const user = await prisma.users.findUnique({
        where: { id: ownerUserId },
      });

      expect(user.settings["primaryFamilyId"]).toBe(secondFamilyId);
    });

    it.skip("should resolve billing to new primary family (NOT IMPLEMENTED)", async () => {
      const response = await request(app.getHttpServer())
        .get(apiUrl(ROUTES.FAMILY.BILLING_HIERARCHY(secondFamilyId)))
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.scopeId).toBe(secondFamilyId);
    });
  });
});
