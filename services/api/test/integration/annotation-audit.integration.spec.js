"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = require("supertest");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const app_module_1 = require("../../src/app.module");
const routes_1 = require("../helpers/routes");
describe("Sprint 3: Annotation Audit Trail (Integration)", () => {
    let app;
    let prisma;
    let authToken;
    let testUserId;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix("api/v1");
        app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
        await app.init();
        prisma = app.get(prisma_service_1.PrismaService);
        await prisma.users.deleteMany({
            where: { email: "maria@example.com" },
        });
        await request(app.getHttpServer())
            .post((0, routes_1.apiUrl)(routes_1.ROUTES.AUTH.REGISTER))
            .send({
            email: "maria@example.com",
            password: "demo1234",
            name: "Maria Silva",
            role: "STUDENT",
        })
            .expect(201);
        const loginResponse = await request(app.getHttpServer())
            .post((0, routes_1.apiUrl)(routes_1.ROUTES.AUTH.LOGIN))
            .send({ email: "maria@example.com", password: "demo1234" })
            .expect(201);
        authToken = loginResponse.body.access_token;
        testUserId = loginResponse.body.user.id;
    });
    afterAll(async () => {
        await app.close();
    });
    describe("PATCH /annotations/:id/favorite - SessionEvent Creation", () => {
        let testContentId;
        let testAnnotationId;
        beforeEach(async () => {
            const content = await prisma.contents.create({
                data: {
                    id: "test-content-audit",
                    title: "Test Content for Annotations",
                    type: "PDF",
                    original_language: "PT_BR",
                    raw_text: "Sample content",
                },
            });
            testContentId = content.id;
            const annotation = await prisma.annotations.create({
                data: {
                    content_id: testContentId,
                    user_id: testUserId,
                    type: "HIGHLIGHT",
                    start_offset: 0,
                    end_offset: 10,
                    text: "Highlighted text",
                    color: "#FFFF00",
                    visibility: "PRIVATE",
                    is_favorite: false,
                },
            });
            testAnnotationId = annotation.id;
        });
        afterEach(async () => {
            const events = await prisma.session_events.findMany({
                where: {
                    payload_json: {
                        path: ["annotationId"],
                        equals: testAnnotationId,
                    },
                },
            });
            if (events.length > 0) {
                await prisma.session_events.deleteMany({
                    where: { id: { in: events.map((e) => e.id) } },
                });
            }
            await prisma.annotations.delete({ where: { id: testAnnotationId } });
            await prisma.contents.delete({ where: { id: testContentId } });
        });
        it("should toggle favorite and create SessionEvent", async () => {
            const initialEventCount = await prisma.session_events.count();
            const response = await request(app.getHttpServer())
                .patch(`/api/v1/annotations/${testAnnotationId}/favorite`)
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.isFavorite).toBe(true);
            const events = await prisma.session_events.findMany({
                where: {
                    payload_json: {
                        path: ["annotationId"],
                        equals: testAnnotationId,
                    },
                },
                orderBy: { created_at: "desc" },
            });
            expect(events.length).toBeGreaterThan(0);
            const favoriteEvent = events[0];
            expect(favoriteEvent.event_type).toBe("ANNOTATION_FAVORITE_TOGGLED");
            expect(favoriteEvent.payload_json.annotationId).toBe(testAnnotationId);
            expect(favoriteEvent.payload_json.favorite).toBe(true);
            expect(favoriteEvent.payload_json.userId).toBe(testUserId);
            const finalEventCount = await prisma.session_events.count();
            expect(finalEventCount).toBe(initialEventCount + 1);
        });
        it("should create event when toggling favorite off", async () => {
            await request(app.getHttpServer())
                .patch(`/api/v1/annotations/${testAnnotationId}/favorite`)
                .set("Authorization", `Bearer ${authToken}`);
            const response = await request(app.getHttpServer())
                .patch(`/api/v1/annotations/${testAnnotationId}/favorite`)
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.isFavorite).toBe(false);
            const events = await prisma.session_events.findMany({
                where: {
                    payload_json: {
                        path: ["annotationId"],
                        equals: testAnnotationId,
                    },
                },
                orderBy: { created_at: "desc" },
                take: 1,
            });
            expect(events[0].payload_json.favorite).toBe(false);
        });
    });
    describe("POST /annotations/:id/reply - SessionEvent Creation", () => {
        let testContentId;
        let testAnnotationId;
        beforeEach(async () => {
            const content = await prisma.contents.create({
                data: {
                    id: "test-content-reply",
                    title: "Content with Annotations",
                    type: "ARTICLE",
                    original_language: "PT_BR",
                    raw_text: "Article text",
                },
            });
            testContentId = content.id;
            const annotation = await prisma.annotations.create({
                data: {
                    content_id: testContentId,
                    user_id: testUserId,
                    type: "COMMENT",
                    start_offset: 5,
                    end_offset: 15,
                    text: "This is interesting",
                    color: "#00FF00",
                    visibility: "PRIVATE",
                },
            });
            testAnnotationId = annotation.id;
        });
        afterEach(async () => {
            const events = await prisma.session_events.findMany({
                where: {
                    payload_json: {
                        path: ["annotationId"],
                        equals: testAnnotationId,
                    },
                },
            });
            if (events.length > 0) {
                await prisma.session_events.deleteMany({
                    where: { id: { in: events.map((e) => e.id) } },
                });
            }
            await prisma.annotations.deleteMany({
                where: {
                    OR: [{ id: testAnnotationId }, { parent_id: testAnnotationId }],
                },
            });
            await prisma.contents.delete({ where: { id: testContentId } });
        });
        it("should create reply and SessionEvent", async () => {
            const initialEventCount = await prisma.session_events.count();
            const response = await request(app.getHttpServer())
                .post(`/api/v1/annotations/${testAnnotationId}/reply`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                content: "I agree with this point!",
                color: "#00FF00",
            })
                .expect(201);
            expect(response.body.text).toBe("I agree with this point!");
            expect(response.body.parentId).toBe(testAnnotationId);
            const events = await prisma.session_events.findMany({
                where: {
                    payload_json: {
                        path: ["annotationId"],
                        equals: testAnnotationId,
                    },
                },
                orderBy: { created_at: "desc" },
            });
            expect(events.length).toBeGreaterThan(0);
            const replyEvent = events[0];
            expect(replyEvent.event_type).toBe("ANNOTATION_REPLY_CREATED");
            expect(replyEvent.payload_json.annotationId).toBe(testAnnotationId);
            expect(replyEvent.payload_json.replyId).toBe(response.body.id);
            expect(replyEvent.payload_json.userId).toBe(testUserId);
            const finalEventCount = await prisma.session_events.count();
            expect(finalEventCount).toBe(initialEventCount + 1);
        });
        it("should create multiple events for multiple replies", async () => {
            const reply1 = await request(app.getHttpServer())
                .post(`/api/v1/annotations/${testAnnotationId}/reply`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({ content: "First reply", color: "#00FF00" });
            const reply2 = await request(app.getHttpServer())
                .post(`/api/v1/annotations/${testAnnotationId}/reply`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({ content: "Second reply", color: "#00FF00" });
            const events = await prisma.session_events.findMany({
                where: {
                    event_type: "ANNOTATION_REPLY_CREATED",
                    payload_json: {
                        path: ["annotationId"],
                        equals: testAnnotationId,
                    },
                },
            });
            expect(events.length).toBe(2);
        });
    });
    describe("GET /annotations/search - Existing Functionality", () => {
        let testContentId;
        beforeEach(async () => {
            const content = await prisma.contents.create({
                data: {
                    id: "test-content-search",
                    title: "Searchable Content",
                    type: "PDF",
                    original_language: "PT_BR",
                    raw_text: "Content for search",
                },
            });
            testContentId = content.id;
            await prisma.annotations.createMany({
                data: [
                    {
                        content_id: testContentId,
                        user_id: testUserId,
                        type: "HIGHLIGHT",
                        start_offset: 0,
                        end_offset: 5,
                        text: "Test highlight",
                        color: "#FFFF00",
                        visibility: "PRIVATE",
                    },
                    {
                        content_id: testContentId,
                        user_id: testUserId,
                        type: "COMMENT",
                        start_offset: 10,
                        end_offset: 15,
                        text: "Important note",
                        color: "#FF0000",
                        visibility: "PRIVATE",
                    },
                ],
            });
        });
        afterEach(async () => {
            await prisma.annotations.deleteMany({
                where: { content_id: testContentId },
            });
            await prisma.contents.deleteMany({ where: { id: testContentId } });
        });
        it("should search annotations by query", async () => {
            const response = await request(app.getHttpServer())
                .get("/api/v1/annotations/search")
                .query({ query: "Important" })
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.length).toBeGreaterThan(0);
            const foundAnnotation = response.body.find((a) => a.text.includes("Important note"));
            expect(foundAnnotation).toBeDefined();
        });
    });
});
//# sourceMappingURL=annotation-audit.integration.spec.js.map