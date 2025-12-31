"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const request = require("supertest");
const app_module_1 = require("./../src/app.module");
const prisma_service_1 = require("./../src/prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
describe("Advanced Integrations (E2E)", () => {
    let app;
    let prisma;
    let jwtService;
    let adminToken;
    let institutionAdminToken;
    let studentToken;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        prisma = moduleFixture.get(prisma_service_1.PrismaService);
        jwtService = moduleFixture.get(jwt_1.JwtService);
        await app.init();
        const admin = await prisma.users.upsert({
            where: { email: "admin_e2e@test.com" },
            update: {},
            create: {
                email: "admin_e2e@test.com",
                name: "Admin E2E",
                schooling_level: "SUPERIOR",
                password_hash: "hash",
                system_role: "ADMIN",
                last_context_role: "OWNER",
            },
        });
        adminToken = jwtService.sign({
            sub: admin.id,
            systemRole: "ADMIN",
            contextRole: "OWNER",
            email: admin.email,
        });
        const inst = await prisma.institutions.create({
            data: {
                name: "E2E Institution",
                slug: `e2e-inst-${Date.now()}`,
                type: "UNIVERSITY",
            },
        });
        const instAdmin = await prisma.users.create({
            data: {
                email: `inst_admin_${Date.now()}@e2e.edu`,
                name: "Inst Admin",
                schooling_level: "SUPERIOR",
                last_context_role: "INSTITUTION_EDUCATION_ADMIN",
                institution_members: {
                    create: {
                        institution_id: inst.id,
                        role: "INSTITUTION_EDUCATION_ADMIN",
                        status: "ACTIVE",
                    },
                },
            },
        });
        institutionAdminToken = jwtService.sign({
            sub: instAdmin.id,
            contextRole: "INSTITUTION_EDUCATION_ADMIN",
            institutionId: inst.id,
            email: instAdmin.email,
        });
    });
    afterAll(async () => {
        await app.close();
    });
    describe("User Context (/users/me/context)", () => {
        it("should return context with institution info", () => {
            return request(app.getHttpServer())
                .get("/users/me/context")
                .set("Authorization", `Bearer ${institutionAdminToken}`)
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty("userId");
                expect(res.body).toHaveProperty("institutionId");
                expect(res.body.institutionRole).toBe("ADMIN");
            });
        });
    });
    describe("Bulk Endpoints (/institutions/:id/bulk-invite)", () => {
        it("should upload CSV and process invites", async () => {
            const me = await request(app.getHttpServer())
                .get("/users/me/context")
                .set("Authorization", `Bearer ${institutionAdminToken}`);
            const instId = me.body.institutionId;
            const csvContent = "email,name,role\ntest1@e2e.edu,Test One,STUDENT\ntest2@e2e.edu,Test Two,TEACHER";
            const buffer = Buffer.from(csvContent, "utf-8");
            return request(app.getHttpServer())
                .post(`/institutions/${instId}/bulk-invite`)
                .set("Authorization", `Bearer ${institutionAdminToken}`)
                .attach("file", buffer, "users.csv")
                .expect(201)
                .expect((res) => {
                expect(res.body).toHaveProperty("success");
                expect(res.body.success).toBe(2);
            });
        });
    });
});
//# sourceMappingURL=integrations.e2e-spec.js.map