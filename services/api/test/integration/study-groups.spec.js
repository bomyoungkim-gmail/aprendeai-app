"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const request = require("supertest");
const app_module_1 = require("../../src/app.module");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const auth_helper_1 = require("../helpers/auth.helper");
const routes_1 = require("../helpers/routes");
describe("Study Groups API (Integration)", () => {
    let app;
    let prisma;
    let authHelper;
    let authToken;
    let userId;
    let groupId;
    let contentId;
    let sessionId;
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
        const testUser = await prisma.users.upsert({
            where: { email: "test-groups@example.com" },
            create: {
                email: "test-groups@example.com",
                name: "Test User",
                password_hash: "hash",
                last_context_role: client_1.ContextRole.STUDENT,
                schooling_level: "ADULT",
                status: "ACTIVE",
            },
            update: {},
        });
        userId = testUser.id;
        authToken = authHelper.generateAuthHeader({
            id: testUser.id,
            email: testUser.email,
            name: testUser.name,
        });
        const testContent = await prisma.contents.create({
            data: {
                id: "test-content-1",
                title: "Test Content for Groups",
                type: "PDF",
                users_owner: { connect: { id: userId } },
                original_language: "EN",
                raw_text: "Test content for groups",
            },
        });
        contentId = testContent.id;
    });
    afterAll(async () => {
        if (groupId) {
            await prisma.group_chat_messages.deleteMany({
                where: {
                    session_id: {
                        in: await prisma.group_sessions
                            .findMany({ where: { group_id: groupId } })
                            .then((s) => s.map((x) => x.id)),
                    },
                },
            });
            await prisma.group_events.deleteMany({
                where: {
                    session_id: {
                        in: await prisma.group_sessions
                            .findMany({ where: { group_id: groupId } })
                            .then((s) => s.map((x) => x.id)),
                    },
                },
            });
            await prisma.shared_cards.deleteMany({
                where: {
                    session_id: {
                        in: await prisma.group_sessions
                            .findMany({ where: { group_id: groupId } })
                            .then((s) => s.map((x) => x.id)),
                    },
                },
            });
            await prisma.group_rounds.deleteMany({
                where: {
                    session_id: {
                        in: await prisma.group_sessions
                            .findMany({ where: { group_id: groupId } })
                            .then((s) => s.map((x) => x.id)),
                    },
                },
            });
            await prisma.group_session_members.deleteMany({
                where: {
                    session_id: {
                        in: await prisma.group_sessions
                            .findMany({ where: { group_id: groupId } })
                            .then((s) => s.map((x) => x.id)),
                    },
                },
            });
            await prisma.group_sessions.deleteMany({ where: { group_id: groupId } });
            await prisma.content_shares.deleteMany({
                where: {
                    context_id: groupId,
                    context_type: client_1.ShareContextType.STUDY_GROUP,
                },
            });
            await prisma.study_group_members.deleteMany({
                where: { group_id: groupId },
            });
            await prisma.study_groups.delete({ where: { id: groupId } });
        }
        else {
            const testUser = await prisma.users.findUnique({
                where: { email: "owner-groups@example.com" },
            });
            if (testUser) {
                await prisma.study_groups.deleteMany({
                    where: { owner_user_id: testUser.id },
                });
            }
        }
        await prisma.contents
            .deleteMany({
            where: {
                id: { in: [contentId, "test-content-2"] },
            },
        })
            .catch(() => { });
        await prisma.users.deleteMany({
            where: {
                email: {
                    in: ["owner-groups@example.com", "member2-groups@example.com"],
                },
            },
        });
        await app.close();
    });
    describe("Groups Management", () => {
        it("POST /groups - should create group", async () => {
            const res = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)("groups"))
                .set("Authorization", authToken)
                .send({ name: "Integration Test Group" })
                .expect(201);
            expect(res.body).toHaveProperty("id");
            expect(res.body.name).toBe("Integration Test Group");
            expect(res.body.owner_user_id).toBe(userId);
            groupId = res.body.id;
        });
        it("GET /groups - should list user groups", async () => {
            const res = await request(app.getHttpServer())
                .get((0, routes_1.apiUrl)("groups"))
                .set("Authorization", authToken)
                .expect(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body.some((g) => g.id === groupId)).toBe(true);
        });
        it("GET /groups/:groupId - should get group details", async () => {
            const res = await request(app.getHttpServer())
                .get((0, routes_1.apiUrl)(`groups/${groupId}`))
                .set("Authorization", authToken)
                .expect(200);
            expect(res.body.id).toBe(groupId);
            expect(res.body.name).toBe("Integration Test Group");
            expect(res.body.study_group_members).toBeDefined();
            expect(res.body.study_group_members.length).toBeGreaterThan(0);
            expect(res.body.study_group_members[0].role).toBe("OWNER");
        });
        it("POST /groups/:groupId/members/invite - should invite member", async () => {
            const user2 = await prisma.users.upsert({
                where: { email: "user2-groups@example.com" },
                create: {
                    email: "user2-groups@example.com",
                    name: "User 2",
                    password_hash: "hash",
                    last_context_role: client_1.ContextRole.STUDENT,
                    schooling_level: "ADVANCED_USER",
                    status: "ACTIVE",
                },
                update: {},
            });
            await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(`groups/${groupId}/members/invite`))
                .set("Authorization", authToken)
                .send({ user_id: user2.id, role: "MEMBER" })
                .expect(201);
            const member = await prisma.study_group_members.findUnique({
                where: { group_id_user_id: { group_id: groupId, user_id: user2.id } },
            });
            expect(member).toBeDefined();
            expect(member.status).toBe("INVITED");
            await prisma.study_group_members.delete({
                where: { group_id_user_id: { group_id: groupId, user_id: user2.id } },
            });
            await prisma.users.delete({ where: { id: user2.id } });
        });
        it("POST /groups/:groupId/contents - should add content", async () => {
            await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(`groups/${groupId}/contents`))
                .set("Authorization", authToken)
                .send({ content_id: contentId })
                .expect(201);
            const groupContent = await prisma.content_shares.findUnique({
                where: {
                    content_id_context_type_context_id: {
                        content_id: contentId,
                        context_type: client_1.ShareContextType.STUDY_GROUP,
                        context_id: groupId,
                    },
                },
            });
            expect(groupContent).toBeDefined();
        });
        it("DELETE /groups/:groupId/contents/:contentId - should remove content", async () => {
            const content2 = await prisma.contents.upsert({
                where: { id: "test-content-2" },
                update: {},
                create: {
                    id: "test-content-2",
                    title: "Content 2",
                    type: "PDF",
                    users_owner: { connect: { id: userId } },
                    original_language: "EN",
                    raw_text: "Test content 2 text",
                },
            });
            await prisma.content_shares.create({
                data: {
                    context_id: groupId,
                    context_type: client_1.ShareContextType.STUDY_GROUP,
                    content_id: content2.id,
                    created_by: userId,
                },
            });
            await request(app.getHttpServer())
                .delete((0, routes_1.apiUrl)(`groups/${groupId}/contents/${content2.id}`))
                .set("Authorization", authToken)
                .expect(200);
            const groupContent = await prisma.content_shares.findUnique({
                where: {
                    content_id_context_type_context_id: {
                        content_id: content2.id,
                        context_type: client_1.ShareContextType.STUDY_GROUP,
                        context_id: groupId,
                    },
                },
            });
            expect(groupContent).toBeNull();
            await prisma.contents.delete({ where: { id: content2.id } });
        });
    });
    describe("Group Sessions", () => {
        beforeAll(async () => {
            const user2 = await prisma.users.upsert({
                where: { email: "member2-groups@example.com" },
                create: {
                    email: "member2-groups@example.com",
                    name: "Member 2",
                    password_hash: "hash",
                    last_context_role: client_1.ContextRole.STUDENT,
                    schooling_level: "ADULT",
                    status: "ACTIVE",
                },
                update: {},
            });
            await prisma.study_group_members.upsert({
                where: { group_id_user_id: { group_id: groupId, user_id: user2.id } },
                create: {
                    group_id: groupId,
                    user_id: user2.id,
                    role: "MEMBER",
                    status: "ACTIVE",
                },
                update: { status: "ACTIVE" },
            });
        });
        it("POST /group-sessions - should create session", async () => {
            const res = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(`group-sessions?groupId=${groupId}`))
                .set("Authorization", authToken)
                .send({
                content_id: contentId,
                mode: "PI_SPRINT",
                layer: "L1",
                rounds_count: 2,
            })
                .expect(201);
            expect(res.body).toHaveProperty("id");
            expect(res.body.group_id).toBe(groupId);
            expect(res.body.content_id).toBe(contentId);
            expect(res.body.status).toBe("CREATED");
            expect(res.body.group_rounds).toBeDefined();
            expect(res.body.group_rounds.length).toBe(2);
            expect(res.body.group_session_members).toBeDefined();
            expect(res.body.group_session_members.length).toBeGreaterThanOrEqual(2);
            sessionId = res.body.id;
            const roles = res.body.group_session_members.map((m) => m.assigned_role);
            expect(roles).toContain("FACILITATOR");
        });
        it("GET /group-sessions/:sessionId - should get session details", async () => {
            const res = await request(app.getHttpServer())
                .get((0, routes_1.apiUrl)(`group-sessions/${sessionId}`))
                .set("Authorization", authToken)
                .expect(200);
            expect(res.body.id).toBe(sessionId);
            expect(res.body.group_rounds).toBeDefined();
        });
        it("PUT /group-sessions/:sessionId/start - should start session", async () => {
            await request(app.getHttpServer())
                .put((0, routes_1.apiUrl)(`group-sessions/${sessionId}/start`))
                .set("Authorization", authToken)
                .expect(200);
            const session = await prisma.group_sessions.findUnique({
                where: { id: sessionId },
            });
            expect(session.status).toBe("RUNNING");
        });
        it("POST /group-sessions/:sessionId/events - should submit vote", async () => {
            await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(`group-sessions/${sessionId}/events`))
                .set("Authorization", authToken)
                .send({
                round_index: 1,
                event_type: "PI_VOTE_SUBMIT",
                payload: { choice: "A", rationale: "Because it makes sense" },
            })
                .expect(201);
            const events = await prisma.group_events.findMany({
                where: { session_id: sessionId, event_type: "PI_VOTE_SUBMIT" },
            });
            expect(events.length).toBeGreaterThan(0);
        });
        it("POST /group-sessions/:sessionId/rounds/:roundIndex/advance - should block with 409 if incomplete", async () => {
            const res = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(`group-sessions/${sessionId}/rounds/1/advance`))
                .set("Authorization", authToken)
                .send({ to_status: "DISCUSSING" })
                .expect(409);
            expect(res.body.statusCode).toBe(409);
            expect(res.body.message).toContain("haven't PI_VOTE_SUBMIT");
            expect(res.body).toHaveProperty("required");
            expect(res.body).toHaveProperty("current");
            expect(res.body).toHaveProperty("missing");
        });
        it("POST /group-sessions/:sessionId/rounds/:roundIndex/advance - should advance after all vote", async () => {
            const session = await prisma.group_sessions.findUnique({
                where: { id: sessionId },
                include: { group_session_members: true, group_rounds: true },
            });
            for (const member of session.group_session_members) {
                const events = await prisma.group_events.findMany({
                    where: {
                        session_id: sessionId,
                        user_id: member.user_id,
                        event_type: "PI_VOTE_SUBMIT",
                    },
                });
                const hasVoted = events.some((e) => {
                    return true;
                });
                if (!hasVoted) {
                    await prisma.group_events.create({
                        data: {
                            id: "vote-event-custom",
                            group_sessions: { connect: { id: sessionId } },
                            user_id: member.user_id,
                            group_rounds: { connect: { id: session.group_rounds[0].id } },
                            event_type: "PI_VOTE_SUBMIT",
                            payload_json: { choice: "A" },
                        },
                    });
                }
            }
            await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(`group-sessions/${sessionId}/rounds/1/advance`))
                .set("Authorization", authToken)
                .send({ to_status: "DISCUSSING" })
                .expect(201);
            const round = await prisma.group_rounds.findFirst({
                where: { session_id: sessionId, round_index: 1 },
            });
            expect(round.status).toBe("DISCUSSING");
        });
        it("GET /group-sessions/:sessionId/events - should get events", async () => {
            const res = await request(app.getHttpServer())
                .get((0, routes_1.apiUrl)(`group-sessions/${sessionId}/events?round_index=1`))
                .set("Authorization", authToken)
                .expect(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
        });
        it("GET /group-sessions/:sessionId/shared-cards - should get shared cards", async () => {
            const res = await request(app.getHttpServer())
                .get((0, routes_1.apiUrl)(`group-sessions/${sessionId}/shared-cards`))
                .set("Authorization", authToken)
                .expect(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });
    describe("Permission Tests", () => {
        it("should reject unauthorized access (no token)", async () => {
            await request(app.getHttpServer()).get((0, routes_1.apiUrl)("groups")).expect(401);
        });
        it("should reject MEMBER trying to invite", async () => {
            const memberUser = await prisma.users.upsert({
                where: { email: "member-only@example.com" },
                create: {
                    email: "member-only@example.com",
                    name: "Member Only",
                    password_hash: "hash",
                    last_context_role: client_1.ContextRole.STUDENT,
                    schooling_level: "ADULT",
                    status: "ACTIVE",
                },
                update: {},
            });
            await prisma.study_group_members.create({
                data: {
                    group_id: groupId,
                    user_id: memberUser.id,
                    role: "MEMBER",
                    status: "ACTIVE",
                },
            });
            const memberToken = authHelper.generateAuthHeader({
                id: memberUser.id,
                email: memberUser.email,
                name: memberUser.name,
            });
            await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(`groups/${groupId}/members/invite`))
                .set("Authorization", memberToken)
                .send({ user_id: "some-user-id", role: "MEMBER" })
                .expect(403);
            await prisma.study_group_members.delete({
                where: {
                    group_id_user_id: { group_id: groupId, user_id: memberUser.id },
                },
            });
            await prisma.users.delete({ where: { id: memberUser.id } });
        });
        it("should reject expired JWT token", async () => {
            const expiredToken = authHelper.generateExpiredToken({
                id: userId,
                email: "test-groups@example.com",
                name: "Test User",
            });
            await request(app.getHttpServer())
                .get((0, routes_1.apiUrl)("groups"))
                .set("Authorization", `Bearer ${expiredToken}`)
                .expect(401);
        });
        it("should reject invalid JWT token", async () => {
            await request(app.getHttpServer())
                .get((0, routes_1.apiUrl)("groups"))
                .set("Authorization", "Bearer invalid-token-12345")
                .expect(401);
        });
    });
});
//# sourceMappingURL=study-groups.spec.js.map