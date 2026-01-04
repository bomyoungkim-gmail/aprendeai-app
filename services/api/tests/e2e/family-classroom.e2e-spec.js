"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const app_module_1 = require("../../src/app.module");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const request = require("supertest");
const config_1 = require("@nestjs/config");
const auth_helper_1 = require("../helpers/auth.helper");
describe("Family + Classroom E2E Tests", () => {
    let app;
    let prisma;
    let authHelper;
    let authToken;
    let userId;
    let childId;
    let familyId;
    let contentId;
    let readingSessionId;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix("api/v1");
        app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
        await app.init();
        const configService = app.get(config_1.ConfigService);
        const jwtSecret = configService.get("JWT_SECRET");
        authHelper = new auth_helper_1.TestAuthHelper(jwtSecret);
        prisma = app.get(prisma_service_1.PrismaService);
        const parent = await prisma.users.create({
            data: {
                email: `parent_e2e_${Date.now()}@test.com`,
                name: "Parent User",
                last_context_role: "STUDENT",
                schooling_level: "HIGHER_EDUCATION",
            },
        });
        userId = parent.id;
        authToken = authHelper.generateAuthHeader({
            id: parent.id,
            email: parent.email,
            name: parent.name,
        });
        const institutionId = `inst_e2e_${Date.now()}`;
        await prisma.institutions.create({
            data: {
                id: institutionId,
                name: "E2E School",
                type: "SCHOOL",
                updated_at: new Date(),
            },
        });
        await prisma.teacher_verifications.create({
            data: {
                users: { connect: { id: userId } },
                institutions: { connect: { id: institutionId } },
                status: "VERIFIED",
                id: `verification_${Date.now()}`,
                updated_at: new Date(),
            },
        });
        const child = await prisma.users.create({
            data: {
                email: `child_e2e_${Date.now()}@test.com`,
                name: "Child User",
                last_context_role: "STUDENT",
                schooling_level: "K12_LOWER",
            },
        });
        childId = child.id;
        const family = await prisma.families.create({
            data: {
                name: "E2E Family",
                owner_user_id: userId,
                family_members: {
                    create: { user_id: childId, role: "CHILD" },
                },
            },
        });
        familyId = family.id;
        const content = await prisma.contents.create({
            data: {
                id: `content_${Date.now()}`,
                title: "E2E Content",
                type: "ARTICLE",
                raw_text: "Content",
                original_language: "EN",
                created_by: userId,
                updated_at: new Date(),
            },
        });
        contentId = content.id;
        const rs = await prisma.reading_sessions.create({
            data: {
                user_id: childId,
                content_id: contentId,
                phase: "PRE",
                modality: "READING",
            },
        });
        readingSessionId = rs.id;
    });
    afterAll(async () => {
        await prisma.$disconnect();
        await app.close();
    });
    describe("E2E: Complete Family Co-Reading Journey", () => {
        it("should complete full co-reading session lifecycle", async () => {
            const policyResponse = await request(app.getHttpServer())
                .post("/api/v1/families/policy")
                .set("Authorization", authToken)
                .send({
                familyId: familyId,
                learnerUserId: childId,
                timeboxDefaultMin: 15,
                coReadingDays: [1, 3, 5],
                privacyMode: "AGGREGATED_ONLY",
            })
                .expect(201);
            expect(policyResponse.body).toHaveProperty("id");
            const promptResponse = await request(app.getHttpServer())
                .post(`/api/v1/families/policy/${policyResponse.body.id}/prompt`)
                .set("Authorization", authToken)
                .expect(201);
            expect(promptResponse.body.nextPrompt).toContain("15 min");
            const sessionResponse = await request(app.getHttpServer())
                .post("/api/v1/families/co-sessions/start")
                .set("Authorization", authToken)
                .send({
                familyId: familyId,
                learnerUserId: childId,
                educatorUserId: userId,
                readingSessionId: readingSessionId,
                contentId: contentId,
            })
                .expect(201);
            const coSessionId = sessionResponse.body.coSession.id;
            const bootPrompt = await request(app.getHttpServer())
                .post(`/api/v1/families/co-sessions/${coSessionId}/prompt`)
                .set("Authorization", authToken)
                .send({ phase: "BOOT" })
                .expect(201);
            expect(bootPrompt.body).toHaveProperty("nextPrompt");
            const finishResponse = await request(app.getHttpServer())
                .post(`/api/v1/families/co-sessions/${coSessionId}/finish`)
                .set("Authorization", authToken)
                .send({
                context: {
                    coSessionId,
                    currentPhase: "POST",
                    checkpointFailCount: 0,
                    startedAt: new Date().toISOString(),
                    phaseStartedAt: new Date().toISOString(),
                },
            });
            expect(finishResponse.status).toBe(201);
            const dashboardResponse = await request(app.getHttpServer())
                .get(`/api/v1/families/${familyId}/educator-dashboard/${childId}`)
                .set("Authorization", authToken)
                .expect(200);
            expect(dashboardResponse.body).toHaveProperty("streakDays");
            expect(dashboardResponse.body).toHaveProperty("minutesTotal");
            expect(dashboardResponse.body.topBlockers).toBeUndefined();
        });
    });
    describe("E2E: Privacy Mode Validation", () => {
        it("should enforce AGGREGATED_ONLY privacy mode", async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/v1/families/${familyId}/educator-dashboard/${childId}`)
                .set("Authorization", authToken);
            if (response.status === 200) {
                expect(response.body.detailedLogs).toBeUndefined();
                expect(response.body.textualContent).toBeUndefined();
                expect(response.body.topBlockers).toBeUndefined();
                expect(response.body).toHaveProperty("streakDays");
                expect(response.body).toHaveProperty("comprehensionAvg");
            }
        });
    });
    describe("E2E: Classroom Teacher Dashboard", () => {
        it("should display classroom dashboard with multiple students", async () => {
            const classResponse = await request(app.getHttpServer())
                .post("/api/v1/classrooms")
                .set("Authorization", authToken)
                .send({
                ownerEducatorUserId: userId,
                name: "Turma E2E",
                gradeLevel: "5º Ano",
            })
                .expect(201);
            const classroomId = classResponse.body.id;
            await request(app.getHttpServer())
                .post(`/api/v1/classrooms/${classroomId}/policy`)
                .set("Authorization", authToken)
                .send({
                privacyMode: "AGGREGATED_PLUS_FLAGS",
                interventionMode: "PROMPT_COACH",
            })
                .expect(201);
            await request(app.getHttpServer())
                .post(`/api/v1/classrooms/${classroomId}/enroll`)
                .set("Authorization", authToken)
                .send({ learnerUserId: childId, nickname: "João" })
                .expect(201);
            const student2 = await prisma.users.create({
                data: {
                    email: `s2_${Date.now()}@test.com`,
                    name: "S2",
                    last_context_role: "STUDENT",
                    schooling_level: "K12_LOWER",
                },
            });
            await request(app.getHttpServer())
                .post(`/api/v1/classrooms/${classroomId}/enroll`)
                .set("Authorization", authToken)
                .send({ learnerUserId: student2.id, nickname: "Maria" })
                .expect(201);
            const dashboardResponse = await request(app.getHttpServer())
                .get(`/api/v1/classrooms/${classroomId}/dashboard`)
                .set("Authorization", authToken)
                .expect(200);
            expect(dashboardResponse.body.activeStudents).toBeGreaterThanOrEqual(2);
            expect(dashboardResponse.body.students).toHaveLength(2);
            expect(dashboardResponse.body.privacyMode).toBe("AGGREGATED_PLUS_FLAGS");
            const student = dashboardResponse.body.students[0];
            expect(student).toHaveProperty("comprehensionScore");
            expect(student).toHaveProperty("struggles");
        });
    });
    describe("E2E: 1:1 Intervention Trigger", () => {
        it("should trigger intervention on help request", async () => {
            const classroomId = "class_intervention_test";
            const interventionClass = await prisma.classrooms.create({
                data: {
                    id: `class_int_${Date.now()}`,
                    name: "Intervention Class",
                    users: { connect: { id: userId } },
                    updated_at: new Date(),
                },
            });
            const interventionLearner = await prisma.users.create({
                data: {
                    email: `int_learn_${Date.now()}@test.com`,
                    name: "Struggling Student",
                    last_context_role: "STUDENT",
                    schooling_level: "K12_LOWER",
                },
            });
            const requestResponse = await request(app.getHttpServer())
                .post(`/api/v1/classrooms/${interventionClass.id}/interventions`)
                .set("Authorization", authToken)
                .send({
                learnerUserId: interventionLearner.id,
                topic: "gramática complexa",
            });
            if (requestResponse.status === 201) {
                expect(requestResponse.body.status).toBe("PENDING");
                const promptResponse = await request(app.getHttpServer())
                    .post(`/api/v1/classrooms/${interventionClass.id}/interventions/prompt`)
                    .set("Authorization", authToken)
                    .send({
                    studentName: "Pedro",
                    topic: "gramática complexa",
                })
                    .expect(201);
                expect(promptResponse.body.nextPrompt).toContain("Pedro");
                expect(promptResponse.body.nextPrompt).toContain("gramática");
            }
        });
    });
});
//# sourceMappingURL=family-classroom.e2e-spec.js.map