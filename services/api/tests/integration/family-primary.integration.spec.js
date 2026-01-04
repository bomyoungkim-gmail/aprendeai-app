"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const request = require("supertest");
const app_module_1 = require("../../src/app.module");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const routes_1 = require("../helpers/routes");
describe("Primary Family Logic (Integration)", () => {
    let app;
    let prisma;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix("api/v1");
        await app.init();
        prisma = app.get(prisma_service_1.PrismaService);
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
    const createAndLoginUser = async (name, email) => {
        try {
            await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(routes_1.ROUTES.AUTH.REGISTER))
                .send({
                email,
                password: "Test123!@#",
                name,
                role: "COMMON_USER",
                schoolingLevel: "UNDERGRADUATE",
            });
        }
        catch (e) {
            console.log("Register failed (might exist):", e.message);
        }
        const login = await request(app.getHttpServer())
            .post((0, routes_1.apiUrl)(routes_1.ROUTES.AUTH.LOGIN))
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
            const { token, userId } = await createAndLoginUser("User One", "user1-fresh@primary-test.com");
            const res = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(routes_1.ROUTES.FAMILY.BASE))
                .set("Authorization", `Bearer ${token}`)
                .send({ name: "Family A" })
                .expect(201);
            const familyId = res.body.id;
            const user = await prisma.users.findUnique({ where: { id: userId } });
            const settings = user.settings;
            expect(settings.primaryFamilyId).toBe(familyId);
        });
        it("should switch Primary when creating SECOND family (Creation Priority)", async () => {
            const { token, userId } = await createAndLoginUser("User Two", "user2@primary-test.com");
            const resA = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(routes_1.ROUTES.FAMILY.BASE))
                .set("Authorization", `Bearer ${token}`)
                .send({ name: "Family A" });
            const familyAId = resA.body.id;
            let user = await prisma.users.findUnique({ where: { id: userId } });
            expect(user.settings.primaryFamilyId).toBe(familyAId);
            const resB = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(routes_1.ROUTES.FAMILY.BASE))
                .set("Authorization", `Bearer ${token}`)
                .send({ name: "Family B" });
            const familyBId = resB.body.id;
            user = await prisma.users.findUnique({ where: { id: userId } });
            expect(user.settings.primaryFamilyId).toBe(familyBId);
        });
    });
    describe("Auto-Primary on Invites", () => {
        let ownerToken;
        let ownerId;
        let dependentToken;
        let dependentId;
        let dependentEmail;
        beforeEach(async () => {
            const cleanEmailBase = `dep${Date.now()}@primary-test.com`;
            dependentEmail = `dep-${cleanEmailBase}`;
            const ownerData = await createAndLoginUser("Owner", `owner-${cleanEmailBase}`);
            const dependentData = await createAndLoginUser("Dependent", dependentEmail);
            ownerToken = ownerData.token;
            ownerId = ownerData.userId;
            dependentToken = dependentData.token;
            dependentId = dependentData.userId;
        });
        it("should set Primary on FIRST invite acceptance", async () => {
            const res = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(routes_1.ROUTES.FAMILY.BASE))
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ name: "Invited Family" })
                .expect(201);
            const familyId = res.body.id;
            await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(routes_1.ROUTES.FAMILY.INVITE(familyId)))
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ email: dependentEmail, role: "CHILD" })
                .expect(201);
            await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(routes_1.ROUTES.FAMILY.ACCEPT(familyId)))
                .set("Authorization", `Bearer ${dependentToken}`)
                .expect(201);
            const user = await prisma.users.findUnique({
                where: { id: dependentId },
            });
            const settings = user.settings;
            expect(settings.primaryFamilyId).toBe(familyId);
        });
        it("should NOT change Primary on SECOND invite acceptance", async () => {
            const resA = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(routes_1.ROUTES.FAMILY.BASE))
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ name: "Family A" });
            const familyAId = resA.body.id;
            await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(routes_1.ROUTES.FAMILY.INVITE(familyAId)))
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ email: dependentEmail, role: "CHILD" })
                .expect(201);
            await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(routes_1.ROUTES.FAMILY.ACCEPT(familyAId)))
                .set("Authorization", `Bearer ${dependentToken}`)
                .expect(201);
            let user = await prisma.users.findUnique({ where: { id: dependentId } });
            expect(user.settings.primaryFamilyId).toBe(familyAId);
            const resB = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(routes_1.ROUTES.FAMILY.BASE))
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ name: "Family B" });
            const familyBId = resB.body.id;
            await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(routes_1.ROUTES.FAMILY.INVITE(familyBId)))
                .set("Authorization", `Bearer ${ownerToken}`)
                .send({ email: dependentEmail, role: "CHILD" })
                .expect(201);
            await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(routes_1.ROUTES.FAMILY.ACCEPT(familyBId)))
                .set("Authorization", `Bearer ${dependentToken}`)
                .expect(201);
            user = await prisma.users.findUnique({ where: { id: dependentId } });
            expect(user.settings.primaryFamilyId).toBe(familyAId);
            expect(user.settings.primaryFamilyId).not.toBe(familyBId);
        });
    });
});
//# sourceMappingURL=family-primary.integration.spec.js.map