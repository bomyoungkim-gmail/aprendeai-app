"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = require("supertest");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const app_module_1 = require("../../src/app.module");
const routes_1 = require("../helpers/routes");
describe("Family Owner Dashboard (Integration)", () => {
    let app;
    let prisma;
    let authToken;
    let familyOwnerId;
    let familyId;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix("api/v1");
        app.useGlobalPipes(new common_1.ValidationPipe());
        await app.init();
        prisma = app.get(prisma_service_1.PrismaService);
    });
    afterAll(async () => {
        await prisma.$disconnect();
        await app.close();
    });
    describe("Setup: Create Family Owner", () => {
        it("should register and login family owner user", async () => {
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
            const registerRes = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(routes_1.ROUTES.AUTH.REGISTER))
                .send({
                email: "owner@family-test.com",
                password: "Test123!",
                name: "Family Owner",
            })
                .expect(201);
            familyOwnerId = registerRes.body.id;
            const loginRes = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(routes_1.ROUTES.AUTH.LOGIN))
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
                            role: "OWNER",
                            status: "ACTIVE",
                        },
                    },
                },
            });
            familyId = family.id;
            await prisma.users.update({
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
            const childUser = await prisma.users.create({
                data: {
                    email: "child@family-test.com",
                    name: "Test Child",
                    password_hash: "hashed",
                    schooling_level: "ELEMENTARY",
                },
            });
            await prisma.family_members.create({
                data: {
                    family_id: familyId,
                    user_id: childUser.id,
                    role: "CHILD",
                    status: "ACTIVE",
                },
            });
            const invitedUser = await prisma.users.create({
                data: {
                    email: "invited@family-test.com",
                    name: "Invited Parent",
                    password_hash: "hashed",
                    schooling_level: "ADULT",
                },
            });
            await prisma.family_members.create({
                data: {
                    family_id: familyId,
                    user_id: invitedUser.id,
                    role: "GUARDIAN",
                    status: "INVITED",
                },
            });
            const res = await request(app.getHttpServer())
                .get((0, routes_1.apiUrl)(routes_1.ROUTES.FAMILY.MY_FAMILY))
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            expect(res.body).toHaveProperty("id", familyId);
            expect(res.body).toHaveProperty("name", "Test Family Owner Family");
            expect(res.body).toHaveProperty("stats");
            expect(res.body.stats.totalMembers).toBe(3);
            expect(res.body.stats.activeMembers).toBe(2);
            expect(res.body.stats.plan).toBe("Free");
            expect(res.body.members).toHaveLength(3);
        });
        it("should return 401 for unauthenticated requests", async () => {
            await request(app.getHttpServer())
                .get((0, routes_1.apiUrl)(routes_1.ROUTES.FAMILY.MY_FAMILY))
                .expect(401);
        });
        it("should return null for user without family", async () => {
            await prisma.users.deleteMany({
                where: { email: "nofamily@test.com" },
            });
            const registerRes = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(routes_1.ROUTES.AUTH.REGISTER))
                .send({
                email: "nofamily@test.com",
                password: "Test123!",
                name: "No Family User",
            })
                .expect(201);
            const loginRes = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(routes_1.ROUTES.AUTH.LOGIN))
                .send({
                email: "nofamily@test.com",
                password: "Test123!",
            })
                .expect(201);
            const noFamilyToken = loginRes.body.access_token;
            const res = await request(app.getHttpServer())
                .get((0, routes_1.apiUrl)(routes_1.ROUTES.FAMILY.MY_FAMILY))
                .set("Authorization", `Bearer ${noFamilyToken}`)
                .expect(200);
            expect(res.body).toEqual({});
        });
    });
});
//# sourceMappingURL=family-owner.integration.spec.js.map