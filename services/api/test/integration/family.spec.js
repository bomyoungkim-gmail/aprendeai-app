"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const request = require("supertest");
const app_module_1 = require("../../src/app.module");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const constants_1 = require("../../src/common/constants");
describe("Family Plan (Integration)", () => {
    let app;
    let prisma;
    let authToken;
    let ownerUserId;
    let familyId;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix("api/v1");
        const { ValidationPipe } = await Promise.resolve().then(() => require("@nestjs/common"));
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));
        await app.init();
        prisma = app.get(prisma_service_1.PrismaService);
        await prisma.family_members.deleteMany({});
        await prisma.families.deleteMany({});
        await prisma.users.deleteMany({
            where: { email: { contains: "@family-test.com" } },
        });
    });
    afterAll(async () => {
        await prisma.family_members.deleteMany({});
        await prisma.families.deleteMany({});
        await prisma.users.deleteMany({
            where: { email: { contains: "@family-test.com" } },
        });
        await app.close();
    });
    describe("Authentication Setup", () => {
        it("should register and login owner user", async () => {
            await request(app.getHttpServer())
                .post((0, constants_1.apiUrl)(constants_1.ROUTES.AUTH.REGISTER))
                .send({
                email: "owner@family-test.com",
                password: "Test123!@#",
                name: "Family Owner",
                role: "COMMON_USER",
                institutionId: "550e8400-e29b-41d4-a716-446655440000",
                schoolingLevel: "UNDERGRADUATE",
            })
                .expect(201);
            const loginResponse = await request(app.getHttpServer())
                .post((0, constants_1.apiUrl)(constants_1.ROUTES.AUTH.LOGIN))
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
                .post((0, constants_1.apiUrl)(constants_1.ROUTES.FAMILY.BASE))
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
                .get((0, constants_1.apiUrl)(constants_1.ROUTES.FAMILY.BY_ID(familyId)))
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
                .get((0, constants_1.apiUrl)(constants_1.ROUTES.FAMILY.BASE))
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0].name).toBe("Test Family");
        });
    });
    describe("POST /families/:id/invite", () => {
        it("should add existing user as GUARDIAN", async () => {
            await request(app.getHttpServer())
                .post((0, constants_1.apiUrl)(constants_1.ROUTES.AUTH.REGISTER))
                .send({
                email: "existing@family-test.com",
                password: "Test123!@#",
                name: "Existing User",
                role: "COMMON_USER",
                institutionId: "550e8400-e29b-41d4-a716-446655440000",
                schoolingLevel: "UNDERGRADUATE",
            })
                .expect(201);
            const response = await request(app.getHttpServer())
                .post((0, constants_1.apiUrl)(constants_1.ROUTES.FAMILY.INVITE(familyId)))
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                email: "existing@family-test.com",
                role: "GUARDIAN",
            })
                .expect(201);
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
                .post((0, constants_1.apiUrl)(constants_1.ROUTES.FAMILY.INVITE(familyId)))
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                email: "newuser@family-test.com",
                displayName: "New User",
                role: "CHILD",
            })
                .expect(201);
            const newUser = await prisma.users.findUnique({
                where: { email: "newuser@family-test.com" },
            });
            expect(newUser).toBeDefined();
            expect(newUser.password_hash).toBe("PENDING_INVITE");
            expect(newUser.name).toBe("New User");
        });
        it("should reject duplicate invitations", async () => {
            await request(app.getHttpServer())
                .post((0, constants_1.apiUrl)(constants_1.ROUTES.FAMILY.INVITE(familyId)))
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                email: "existing@family-test.com",
                role: "GUARDIAN",
            })
                .expect(409);
        });
        it("should only allow owner to invite members", async () => {
            await request(app.getHttpServer())
                .post((0, constants_1.apiUrl)(constants_1.ROUTES.AUTH.REGISTER))
                .send({
                email: "nonowner@family-test.com",
                password: "Test123!@#",
                name: "Non Owner",
                role: "COMMON_USER",
                institutionId: "550e8400-e29b-41d4-a716-446655440000",
                schoolingLevel: "UNDERGRADUATE",
            });
            const nonOwnerLogin = await request(app.getHttpServer())
                .post((0, constants_1.apiUrl)(constants_1.ROUTES.AUTH.LOGIN))
                .send({
                email: "nonowner@family-test.com",
                password: "Test123!@#",
            });
            const nonOwnerToken = nonOwnerLogin.body.access_token;
            await request(app.getHttpServer())
                .post((0, constants_1.apiUrl)(constants_1.ROUTES.FAMILY.INVITE(familyId)))
                .set("Authorization", `Bearer ${nonOwnerToken}`)
                .send({
                email: "another@family-test.com",
                role: "CHILD",
            })
                .expect(403);
        });
    });
    describe("POST /families/:id/transfer-ownership", () => {
        let memberUserId;
        beforeAll(async () => {
            const existingUser = await prisma.users.findUnique({
                where: { email: "existing@family-test.com" },
            });
            memberUserId = existingUser.id;
        });
        it("should transfer ownership to existing member", async () => {
            const response = await request(app.getHttpServer())
                .post((0, constants_1.apiUrl)(constants_1.ROUTES.FAMILY.TRANSFER_OWNERSHIP(familyId)))
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                newOwnerId: memberUserId,
            })
                .expect(201);
            const family = await prisma.families.findUnique({
                where: { id: familyId },
            });
            expect(family.owner_user_id).toBe(memberUserId);
            const oldOwnerMembership = await prisma.family_members.findUnique({
                where: {
                    family_id_user_id: { family_id: familyId, user_id: ownerUserId },
                },
            });
            expect(oldOwnerMembership.role).toBe("GUARDIAN");
            const newOwnerMembership = await prisma.family_members.findUnique({
                where: {
                    family_id_user_id: { family_id: familyId, user_id: memberUserId },
                },
            });
            expect(newOwnerMembership.role).toBe("OWNER");
        });
        it("should prevent non-owner from transferring", async () => {
            await request(app.getHttpServer())
                .post((0, constants_1.apiUrl)(constants_1.ROUTES.FAMILY.TRANSFER_OWNERSHIP(familyId)))
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                newOwnerId: ownerUserId,
            })
                .expect(403);
        });
        afterAll(async () => {
            const newOwnerLogin = await request(app.getHttpServer())
                .post((0, constants_1.apiUrl)(constants_1.ROUTES.AUTH.LOGIN))
                .send({
                email: "existing@family-test.com",
                password: "Test123!@#",
            });
            await request(app.getHttpServer())
                .post((0, constants_1.apiUrl)(constants_1.ROUTES.FAMILY.TRANSFER_OWNERSHIP(familyId)))
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
                .post((0, constants_1.apiUrl)(constants_1.ROUTES.FAMILY.SET_PRIMARY(familyId)))
                .set("Authorization", `Bearer ${authToken}`)
                .expect(201);
            const user = await prisma.users.findUnique({
                where: { id: ownerUserId },
            });
            expect(user.settings).toHaveProperty("primaryFamilyId", familyId);
        });
        it("should only allow family members to set as primary", async () => {
            await request(app.getHttpServer())
                .post((0, constants_1.apiUrl)(constants_1.ROUTES.AUTH.REGISTER))
                .send({
                email: "outsider@family-test.com",
                password: "Test123!@#",
                name: "Outsider",
                role: "COMMON_USER",
                institutionId: "550e8400-e29b-41d4-a716-446655440000",
                schoolingLevel: "UNDERGRADUATE",
            });
            const outsiderLogin = await request(app.getHttpServer())
                .post((0, constants_1.apiUrl)(constants_1.ROUTES.AUTH.LOGIN))
                .send({
                email: "outsider@family-test.com",
                password: "Test123!@#",
            });
            await request(app.getHttpServer())
                .post((0, constants_1.apiUrl)(constants_1.ROUTES.FAMILY.SET_PRIMARY(familyId)))
                .set("Authorization", `Bearer ${outsiderLogin.body.access_token}`)
                .expect(403);
        });
    });
    describe.skip("GET /families/:id/billing-hierarchy (NOT IMPLEMENTED)", () => {
        it("should resolve to primary family", async () => {
            const response = await request(app.getHttpServer())
                .get((0, constants_1.apiUrl)(constants_1.ROUTES.FAMILY.BILLING_HIERARCHY(familyId)))
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.scopeType).toBe("FAMILY");
            expect(response.body.scopeId).toBe(familyId);
        });
        it("should fall back to user scope if no families", async () => {
            const outsiderLogin = await request(app.getHttpServer())
                .post((0, constants_1.apiUrl)(constants_1.ROUTES.AUTH.LOGIN))
                .send({
                email: "outsider@family-test.com",
                password: "Test123!@#",
            });
            const response = await request(app.getHttpServer())
                .get((0, constants_1.apiUrl)(constants_1.ROUTES.FAMILY.BILLING_HIERARCHY("any-id")))
                .set("Authorization", `Bearer ${outsiderLogin.body.access_token}`)
                .expect(200);
            expect(response.body.scopeType).toBe("USER");
        });
    });
    describe("DELETE /families/:id", () => {
        let tempFamilyId;
        beforeAll(async () => {
            const response = await request(app.getHttpServer())
                .post((0, constants_1.apiUrl)(constants_1.ROUTES.FAMILY.BASE))
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                name: "Temp Family",
            });
            tempFamilyId = response.body.id;
        });
        it("should delete family and all members", async () => {
            await request(app.getHttpServer())
                .delete((0, constants_1.apiUrl)(constants_1.ROUTES.FAMILY.BY_ID(tempFamilyId)))
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            const family = await prisma.families.findUnique({
                where: { id: tempFamilyId },
            });
            expect(family).toBeNull();
            const members = await prisma.family_members.findMany({
                where: { family_id: tempFamilyId },
            });
            expect(members).toHaveLength(0);
        });
        it("should only allow owner to delete family", async () => {
            const newOwnerLogin = await request(app.getHttpServer())
                .post((0, constants_1.apiUrl)(constants_1.ROUTES.AUTH.LOGIN))
                .send({
                email: "existing@family-test.com",
                password: "Test123!@#",
            });
            await request(app.getHttpServer())
                .delete((0, constants_1.apiUrl)(constants_1.ROUTES.FAMILY.BY_ID(familyId)))
                .set("Authorization", `Bearer ${newOwnerLogin.body.access_token}`)
                .expect(403);
        });
        it("should return 404 if family does not exist", async () => {
            await request(app.getHttpServer())
                .delete((0, constants_1.apiUrl)(constants_1.ROUTES.FAMILY.BY_ID("non-existent-id")))
                .set("Authorization", `Bearer ${authToken}`)
                .expect(404);
        });
    });
    describe("Multi-Family Scenarios", () => {
        let secondFamilyId;
        it("should create second family", async () => {
            const response = await request(app.getHttpServer())
                .post((0, constants_1.apiUrl)(constants_1.ROUTES.FAMILY.BASE))
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
                .get((0, constants_1.apiUrl)(constants_1.ROUTES.FAMILY.BASE))
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.length).toBeGreaterThanOrEqual(2);
            const familyNames = response.body.map((f) => f.name);
            expect(familyNames).toContain("Test Family");
            expect(familyNames).toContain("Second Family");
        });
        it("should switch primary family", async () => {
            await request(app.getHttpServer())
                .post((0, constants_1.apiUrl)(constants_1.ROUTES.FAMILY.SET_PRIMARY(secondFamilyId)))
                .set("Authorization", `Bearer ${authToken}`)
                .expect(201);
            const user = await prisma.users.findUnique({
                where: { id: ownerUserId },
            });
            expect(user.settings["primaryFamilyId"]).toBe(secondFamilyId);
        });
        it.skip("should resolve billing to new primary family (NOT IMPLEMENTED)", async () => {
            const response = await request(app.getHttpServer())
                .get((0, constants_1.apiUrl)(constants_1.ROUTES.FAMILY.BILLING_HIERARCHY(secondFamilyId)))
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.scopeId).toBe(secondFamilyId);
        });
    });
});
//# sourceMappingURL=family.spec.js.map