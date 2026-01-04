"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const request = require("supertest");
const app_module_1 = require("../../src/app.module");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const routes_constants_1 = require("../../src/common/constants/routes.constants");
describe("Institutional Registration (Integration)", () => {
    let app;
    let prisma;
    let adminToken;
    let adminUserId;
    let institutionId;
    let inviteToken;
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
        await prisma.institution_members.deleteMany({});
        await prisma.institution_invites.deleteMany({});
        await prisma.institution_domains.deleteMany({});
        await prisma.pending_user_approvals.deleteMany({});
        await prisma.institutions.deleteMany({
            where: { name: { contains: "Test Institution" } },
        });
        await prisma.users.deleteMany({
            where: { email: { contains: "@inst-test.com" } },
        });
        await prisma.plans.upsert({
            where: { code: "FREE" },
            update: {},
            create: {
                id: "FREE_PLAN",
                code: "FREE",
                name: "Free Plan",
                description: "Basic access",
                entitlements: {},
                monthly_price: 0,
                yearly_price: 0,
                is_active: true,
                updated_at: new Date(),
            },
        });
    });
    afterAll(async () => {
        await prisma.institution_members.deleteMany({});
        await prisma.institution_invites.deleteMany({});
        await prisma.institution_domains.deleteMany({});
        await prisma.pending_user_approvals.deleteMany({});
        await prisma.institutions.deleteMany({
            where: { name: { contains: "Test Institution" } },
        });
        await prisma.users.deleteMany({
            where: { email: { contains: "@inst-test.com" } },
        });
        await app.close();
    });
    describe("Setup: Create Admin User and Institution", () => {
        it("should create institution using global admin", async () => {
            await prisma.institutions.deleteMany({
                where: { name: "Test Institution" },
            });
            await prisma.users.deleteMany({
                where: {
                    email: {
                        in: [
                            "global-admin@test.com",
                            "admin@inst-test.com",
                            "teacher@inst-test.com",
                            "student@inst-test.com",
                        ],
                    },
                },
            });
            await request(app.getHttpServer())
                .post((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.AUTH.REGISTER))
                .send({
                email: "global-admin@test.com",
                password: "Test123!@#",
                name: "Global Admin",
                role: "ADMIN",
            })
                .expect(201);
            const globalAdminLogin = await request(app.getHttpServer())
                .post((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.AUTH.LOGIN))
                .send({
                email: "global-admin@test.com",
                password: "Test123!@#",
            })
                .expect(201);
            const globalAdminToken = globalAdminLogin.body.access_token;
            const response = await request(app.getHttpServer())
                .post((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.INSTITUTIONS.CREATE))
                .set("Authorization", `Bearer ${globalAdminToken}`)
                .send({
                name: "Test Institution",
                type: "SCHOOL",
                city: "São Paulo",
                state: "SP",
                requiresApproval: false,
            })
                .expect(201);
            institutionId = response.body.id;
            expect(response.body.name).toBe("Test Institution");
        });
        it("should register institution admin and add as member", async () => {
            await request(app.getHttpServer())
                .post((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.AUTH.REGISTER))
                .send({
                email: "admin@inst-test.com",
                password: "Test123!@#",
                name: "Institution Admin",
                role: "INSTITUTION_ADMIN",
            })
                .expect(201);
            const instAdminLogin = await request(app.getHttpServer())
                .post((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.AUTH.LOGIN))
                .send({
                email: "admin@inst-test.com",
                password: "Test123!@#",
            })
                .expect(201);
            adminToken = instAdminLogin.body.access_token;
            adminUserId = instAdminLogin.body.user.id;
            await prisma.institution_members.create({
                data: {
                    user_id: adminUserId,
                    institution_id: institutionId,
                    role: "INSTITUTION_EDUCATION_ADMIN",
                    status: "ACTIVE",
                },
            });
            expect(adminToken).toBeDefined();
            expect(adminUserId).toBeDefined();
        });
    });
    describe("POST /institutions/:id/invites - Invite Flow", () => {
        it("should create institution invite", async () => {
            const response = await request(app.getHttpServer())
                .post((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.INSTITUTIONS.CREATE_INVITE(institutionId)))
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                email: "teacher@inst-test.com",
                role: "TEACHER",
                expiresInDays: 7,
            })
                .expect(201);
            expect(response.body).toHaveProperty("inviteUrl");
            expect(response.body.email).toBe("teacher@inst-test.com");
            const urlMatch = response.body.inviteUrl.match(/token=([^&]+)/);
            inviteToken = urlMatch ? urlMatch[1] : null;
            expect(inviteToken).toBeDefined();
        });
        it("should register user with invite token", async () => {
            const registerResponse = await request(app.getHttpServer())
                .post((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.AUTH.REGISTER))
                .send({
                email: "teacher@inst-test.com",
                password: "Test123!@#",
                name: "Teacher User",
            })
                .query({ inviteToken })
                .expect(201);
            expect(registerResponse.body.email).toBe("teacher@inst-test.com");
            const member = await prisma.institution_members.findFirst({
                where: {
                    user_id: registerResponse.body.id,
                    institution_id: institutionId,
                },
            });
            expect(member).toBeDefined();
            expect(member.role).toBe("TEACHER");
            expect(member.status).toBe("ACTIVE");
        });
        it("should mark invite as used", async () => {
            const invite = await prisma.institution_invites.findUnique({
                where: { token: inviteToken },
            });
            expect(invite.used_at).not.toBeNull();
        });
    });
    describe("POST /institutions/:id/domains - Domain Flow", () => {
        it("should add domain with auto-approve", async () => {
            const response = await request(app.getHttpServer())
                .post((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.INSTITUTIONS.ADD_DOMAIN(institutionId)))
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                domain: "@inst-test.com",
                autoApprove: true,
                defaultRole: "STUDENT",
            })
                .expect(201);
            expect(response.body.domain).toBe("@inst-test.com");
            expect(response.body.auto_approve).toBe(true);
        });
        it("should auto-approve registration for domain email", async () => {
            const response = await request(app.getHttpServer())
                .post((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.AUTH.REGISTER))
                .send({
                email: "student@inst-test.com",
                password: "Test123!@#",
                name: "Student User",
            })
                .expect(201);
            expect(response.body.email).toBe("student@inst-test.com");
            const member = await prisma.institution_members.findFirst({
                where: {
                    user_id: response.body.id,
                    institution_id: institutionId,
                },
            });
            expect(member).toBeDefined();
            expect(member.role).toBe("STUDENT");
            expect(member.status).toBe("ACTIVE");
        });
    });
    describe("POST /institutions/:id/pending - Manual Approval Flow", () => {
        let pendingApprovalId;
        beforeAll(async () => {
            await prisma.institutions.update({
                where: { id: institutionId },
                data: { requires_approval: true },
            });
            await prisma.institution_domains.update({
                where: { domain: "@inst-test.com" },
                data: { auto_approve: false },
            });
        });
        it("should create pending approval instead of user", async () => {
            const response = await request(app.getHttpServer())
                .post((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.AUTH.REGISTER))
                .send({
                email: "pending@inst-test.com",
                password: "Test123!@#",
                name: "Pending User",
            })
                .expect(201);
            expect(response.body.status).toBe("pending_approval");
            expect(response.body.approvalId).toBeDefined();
            pendingApprovalId = response.body.approvalId;
            const pending = await prisma.pending_user_approvals.findUnique({
                where: { id: pendingApprovalId },
            });
            expect(pending).toBeDefined();
            expect(pending.email).toBe("pending@inst-test.com");
            expect(pending.status).toBe("PENDING");
        });
        it("should list pending approvals", async () => {
            const response = await request(app.getHttpServer())
                .get((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.INSTITUTIONS.PENDING(institutionId)))
                .set("Authorization", `Bearer ${adminToken}`)
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body[0]).toHaveProperty("email", "pending@inst-test.com");
        });
        it("should approve pending user", async () => {
            await request(app.getHttpServer())
                .post((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.INSTITUTIONS.PROCESS_APPROVAL(institutionId, pendingApprovalId)))
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                approve: true,
            })
                .expect(200);
            const user = await prisma.users.findUnique({
                where: { email: "pending@inst-test.com" },
            });
            expect(user).toBeDefined();
            expect(user.status).toBe("ACTIVE");
            const member = await prisma.institution_members.findFirst({
                where: {
                    user_id: user.id,
                    institution_id: institutionId,
                },
            });
            expect(member).toBeDefined();
            expect(member.status).toBe("ACTIVE");
            const approval = await prisma.pending_user_approvals.findUnique({
                where: { id: pendingApprovalId },
            });
            expect(approval.status).toBe("APPROVED");
            expect(approval.reviewed_by).toBe(adminUserId);
        });
    });
    describe("DELETE /institutions/:id/invites/:inviteId - Cancel Invite", () => {
        let cancelInviteId;
        beforeAll(async () => {
            const response = await request(app.getHttpServer())
                .post((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.INSTITUTIONS.CREATE_INVITE(institutionId)))
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                email: "cancelled@inst-test.com",
                role: "TEACHER",
            })
                .expect(201);
            cancelInviteId = response.body.id;
        });
        it("should cancel invitation", async () => {
            await request(app.getHttpServer())
                .delete((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.INSTITUTIONS.CANCEL_INVITE(institutionId, cancelInviteId)))
                .set("Authorization", `Bearer ${adminToken}`)
                .expect(200);
            const invite = await prisma.institution_invites.findUnique({
                where: { id: cancelInviteId },
            });
            expect(invite).toBeNull();
        });
    });
    describe("GET /institutions/:id/invites - List Invites", () => {
        it("should list all invites for institution", async () => {
            const response = await request(app.getHttpServer())
                .get((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.INSTITUTIONS.INVITES(institutionId)))
                .set("Authorization", `Bearer ${adminToken}`)
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
            const teacherInvite = response.body.find((i) => i.email === "teacher@inst-test.com");
            expect(teacherInvite).toBeDefined();
            expect(teacherInvite.used_at).not.toBeNull();
        });
    });
    describe("GET /institutions/:id/domains - List Domains", () => {
        it("should list all domains for institution", async () => {
            const response = await request(app.getHttpServer())
                .get((0, routes_constants_1.apiUrl)(routes_constants_1.ROUTES.INSTITUTIONS.DOMAINS(institutionId)))
                .set("Authorization", `Bearer ${adminToken}`)
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body[0].domain).toBe("@inst-test.com");
        });
    });
});
//# sourceMappingURL=institutions.integration.spec.js.map