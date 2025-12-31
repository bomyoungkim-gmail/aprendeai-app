"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const request = require("supertest");
const config_1 = require("@nestjs/config");
const auth_helper_1 = require("../helpers/auth.helper");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const app_module_1 = require("../../src/app.module");
const routes_1 = require("../helpers/routes");
describe("Annotations Integration Tests", () => {
    let app;
    let prisma;
    let authHelper;
    let authToken;
    let testUserId;
    let testContentId;
    let testGroupId;
    let testUserEmail;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix("api/v1");
        await app.init();
        prisma = app.get(prisma_service_1.PrismaService);
        const configService = app.get(config_1.ConfigService);
        const jwtSecret = configService.get("JWT_SECRET") || "test-secret-key";
        authHelper = new auth_helper_1.TestAuthHelper(jwtSecret);
        testUserEmail = `annotations-test-${Date.now()}@example.com`;
        const user = await prisma.users.upsert({
            where: { email: testUserEmail },
            create: {
                email: testUserEmail,
                name: "Annotations Tester",
                password_hash: "hash",
                schooling_level: "ADULT",
                status: "ACTIVE",
                system_role: "ADMIN",
            },
            update: {},
        });
        testUserId = user.id;
        authToken = authHelper.generateAuthHeader({
            id: user.id,
            email: user.email,
            name: user.name,
        });
        const content = await prisma.contents.create({
            data: {
                id: `content-${Date.now()}`,
                title: "Test Content for Annotations",
                type: "PDF",
                original_language: "EN",
                raw_text: "This is test content for annotations. We will highlight and annotate this text.",
                owner_user_id: testUserId,
            },
        });
        testContentId = content.id;
        const group = await prisma.study_groups.create({
            data: {
                id: `group-${Date.now()}`,
                name: "Test Annotation Group",
                owner_user_id: testUserId,
            },
        });
        testGroupId = group.id;
        await prisma.study_group_members.create({
            data: {
                group_id: testGroupId,
                user_id: testUserId,
                role: "OWNER",
                status: "ACTIVE",
            },
        });
    });
    afterAll(async () => {
        if (testContentId) {
            await prisma.annotations.deleteMany({
                where: { content_id: testContentId },
            });
            await prisma.contents.delete({ where: { id: testContentId } });
        }
        if (testGroupId) {
            await prisma.study_group_members.deleteMany({
                where: { group_id: testGroupId },
            });
            await prisma.study_groups.delete({ where: { id: testGroupId } });
        }
        if (testUserId) {
            await prisma.users.delete({ where: { id: testUserId } });
        }
        await app.close();
    });
    describe("POST /contents/:contentId/annotations", () => {
        it("should create a highlight annotation", async () => {
            const res = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(`contents/${testContentId}/annotations`))
                .set("Authorization", authToken)
                .send({
                type: "HIGHLIGHT",
                startOffset: 0,
                endOffset: 20,
                selectedText: "This is test content",
                color: "yellow",
                visibility: "PRIVATE",
            })
                .expect(201);
            expect(res.body).toMatchObject({
                type: "HIGHLIGHT",
                color: "yellow",
                visibility: "PRIVATE",
            });
            expect(res.body.id).toBeDefined();
        });
        it("should create a note annotation", async () => {
            const res = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(`contents/${testContentId}/annotations`))
                .set("Authorization", authToken)
                .send({
                type: "NOTE",
                startOffset: 25,
                endOffset: 45,
                selectedText: "highlight and annotate",
                text: "This is my note about this section",
                visibility: "PRIVATE",
            })
                .expect(201);
            expect(res.body.type).toBe("NOTE");
            expect(res.body.text).toBe("This is my note about this section");
        });
        it("should create a group annotation", async () => {
            const res = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(`contents/${testContentId}/annotations`))
                .set("Authorization", authToken)
                .send({
                type: "HIGHLIGHT",
                startOffset: 50,
                endOffset: 60,
                selectedText: "this text",
                color: "green",
                visibility: "GROUP",
                groupId: testGroupId,
            })
                .expect(201);
            expect(res.body.visibility).toBe("GROUP");
            expect(res.body.group_id).toBe(testGroupId);
        });
    });
    describe("GET /contents/:contentId/annotations", () => {
        it("should return all annotations for content", async () => {
            const res = await request(app.getHttpServer())
                .get((0, routes_1.apiUrl)(`contents/${testContentId}/annotations`))
                .set("Authorization", authToken)
                .expect(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body[0]).toHaveProperty("users");
        });
        it("should filter by groupId", async () => {
            const res = await request(app.getHttpServer())
                .get((0, routes_1.apiUrl)(`contents/${testContentId}/annotations?groupId=${testGroupId}`))
                .set("Authorization", authToken)
                .expect(200);
            const groupAnnotations = res.body.filter((a) => a.groupId === testGroupId || a.group_id === testGroupId);
            expect(groupAnnotations.length).toBeGreaterThan(0);
        });
    });
    describe("PUT /contents/:contentId/annotations/:id", () => {
        it("should update annotation text", async () => {
            const createRes = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(`contents/${testContentId}/annotations`))
                .set("Authorization", authToken)
                .send({
                type: "NOTE",
                startOffset: 0,
                endOffset: 10,
                text: "Original text",
                visibility: "PRIVATE",
            });
            const annotationId = createRes.body.id;
            const updateRes = await request(app.getHttpServer())
                .put((0, routes_1.apiUrl)(`contents/${testContentId}/annotations/${annotationId}`))
                .set("Authorization", authToken)
                .send({ text: "Updated text" })
                .expect(200);
            expect(updateRes.body.text).toBe("Updated text");
        });
    });
    describe("DELETE /contents/:contentId/annotations/:id", () => {
        it("should delete annotation", async () => {
            const createRes = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(`contents/${testContentId}/annotations`))
                .set("Authorization", authToken)
                .send({
                type: "HIGHLIGHT",
                startOffset: 0,
                endOffset: 5,
                color: "blue",
                visibility: "PRIVATE",
            });
            const annotationId = createRes.body.id;
            await request(app.getHttpServer())
                .delete((0, routes_1.apiUrl)(`contents/${testContentId}/annotations/${annotationId}`))
                .set("Authorization", authToken)
                .expect(200);
            const annotations = await prisma.annotations.findUnique({
                where: { id: annotationId },
            });
            expect(annotations).toBeNull();
        });
    });
});
//# sourceMappingURL=annotations.integration.spec.js.map