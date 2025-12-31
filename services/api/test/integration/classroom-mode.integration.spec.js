"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_module_1 = require("../../src/app.module");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const request = require("supertest");
const auth_helper_1 = require("../helpers/auth.helper");
const routes_1 = require("../helpers/routes");
describe("Classroom Mode Integration Tests (e2e)", () => {
    let app;
    let prisma;
    let authHelper;
    let authToken;
    let userId;
    let classroomId;
    let teacherId;
    let studentId;
    let teacherEmail;
    let studentEmail;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix("api/v1");
        app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
        await app.init();
        prisma = app.get(prisma_service_1.PrismaService);
        const configService = app.get(config_1.ConfigService);
        const secret = configService.get("JWT_SECRET") || "test-secret-key";
        authHelper = new auth_helper_1.TestAuthHelper(secret);
        teacherEmail = `teacher_${Date.now()}@example.com`;
        const teacherUser = await prisma.users.upsert({
            where: { email: teacherEmail },
            create: {
                id: `teacher-${Date.now()}`,
                email: teacherEmail,
                name: "Teacher Test",
                password_hash: "hash",
                last_context_role: "TEACHER",
                schooling_level: "HIGHER_EDUCATION",
                status: "ACTIVE",
            },
            update: {},
        });
        userId = teacherUser.id;
        teacherId = teacherUser.id;
        authToken = authHelper.generateAuthHeader({
            id: teacherUser.id,
            email: teacherUser.email,
            name: teacherUser.name,
        });
        const institution = await prisma.institutions.create({
            data: {
                id: `inst-cl-${Date.now()}`,
                name: "Classroom Test Institution",
                type: "SCHOOL",
                updated_at: new Date(),
            },
        });
        await prisma.teacher_verifications.create({
            data: {
                id: `ver-${Date.now()}`,
                user_id: teacherId,
                institution_id: institution.id,
                status: "VERIFIED",
                verified_at: new Date(),
            },
        });
        studentEmail = `student_${Date.now()}@example.com`;
        const studentUser = await prisma.users.upsert({
            where: { email: studentEmail },
            create: {
                id: `student-${Date.now()}`,
                email: studentEmail,
                name: "Student Maria",
                password_hash: "hash",
                last_context_role: "STUDENT",
                schooling_level: "ELEMENTARY",
                status: "ACTIVE",
            },
            update: {},
        });
        studentId = studentUser.id;
    });
    afterAll(async () => {
        if (classroomId) {
            await prisma.classrooms
                .delete({ where: { id: classroomId } })
                .catch(() => { });
        }
        await prisma.teacher_verifications
            .deleteMany({
            where: { user_id: teacherId },
        })
            .catch(() => { });
        await prisma.institutions
            .deleteMany({
            where: { name: "Classroom Test Institution" },
        })
            .catch(() => { });
        if (teacherId) {
            await prisma.users.delete({ where: { id: teacherId } }).catch(() => { });
        }
        if (studentId) {
            await prisma.users.delete({ where: { id: studentId } }).catch(() => { });
        }
        await app.close();
    });
    describe("Classroom CRUD Flow", () => {
        it("should create a classroom", async () => {
            const response = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)("classrooms"))
                .set("Authorization", authToken)
                .send({
                ownerEducatorUserId: teacherId,
                name: "Turma 5A - Teste",
                gradeLevel: "5º Ano",
            });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("id");
            expect(response.body.name).toBe("Turma 5A - Teste");
            classroomId = response.body.id;
        });
        it("should get classroom by ID", async () => {
            const response = await request(app.getHttpServer())
                .get((0, routes_1.apiUrl)(`classrooms/${classroomId}`))
                .set("Authorization", authToken);
            expect(response.status).toBe(200);
            expect(response.body.id).toBe(classroomId);
            expect(response.body).toHaveProperty("enrollments");
        });
        it("should update classroom", async () => {
            const response = await request(app.getHttpServer())
                .put((0, routes_1.apiUrl)(`classrooms/${classroomId}`))
                .set("Authorization", authToken)
                .send({
                name: "Turma 5A - Atualizada",
            });
            expect(response.status).toBe(200);
            expect(response.body.name).toBe("Turma 5A - Atualizada");
        });
    });
    describe("Enrollment Flow", () => {
        it("should enroll student in classroom", async () => {
            const response = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(`classrooms/${classroomId}/enroll`))
                .set("Authorization", authToken)
                .send({
                learnerUserId: studentId,
                nickname: "Maria",
            });
            expect(response.status).toBe(201);
            expect(response.body.learnerUserId).toBe(studentId);
            expect(response.body.status).toBe("ACTIVE");
        });
        it("should get enrollments for classroom", async () => {
            const response = await request(app.getHttpServer())
                .get((0, routes_1.apiUrl)(`classrooms/${classroomId}/enrollments`))
                .set("Authorization", authToken);
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body[0].learnerUserId).toBe(studentId);
        });
    });
    describe("Classroom Policy Flow", () => {
        it("should create classroom policy", async () => {
            const response = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(`classrooms/${classroomId}/policy`))
                .set("Authorization", authToken)
                .send({
                weeklyUnitsTarget: 3,
                timeboxDefaultMin: 20,
                privacyMode: "AGGREGATED_PLUS_HELP_REQUESTS",
                interventionMode: "PROMPT_COACH_PLUS_1ON1",
            });
            expect(response.status).toBe(201);
            expect(response.body.weeklyUnitsTarget).toBe(3);
            expect(response.body.privacyMode).toBe("AGGREGATED_PLUS_HELP_REQUESTS");
        });
        it("should get policy prompt", async () => {
            const response = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(`classrooms/${classroomId}/policy/prompt`))
                .set("Authorization", authToken)
                .send({
                units: 3,
                minutes: 20,
            });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("nextPrompt");
            expect(response.body.nextPrompt).toContain("3");
        });
    });
    describe("Weekly Planning Flow", () => {
        it("should create weekly plan", async () => {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const response = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(`classrooms/${classroomId}/plans/weekly`))
                .set("Authorization", authToken)
                .send({
                weekStart,
                items: ["content_1", "content_2", "content_3"],
                toolWords: ["palavra1", "palavra2"],
            });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("itemsJson");
            expect(response.body.itemsJson).toHaveLength(3);
        });
        it("should get current week plan", async () => {
            const response = await request(app.getHttpServer())
                .get((0, routes_1.apiUrl)(`classrooms/${classroomId}/plans/weekly`))
                .set("Authorization", authToken);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("itemsJson");
        });
    });
    describe("Dashboard with Privacy Filtering", () => {
        it("should get teacher dashboard with privacy filtering", async () => {
            const response = await request(app.getHttpServer())
                .get((0, routes_1.apiUrl)(`classrooms/${classroomId}/dashboard`))
                .set("Authorization", authToken);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("activeStudents");
            expect(response.body).toHaveProperty("students");
            expect(response.body.privacyMode).toBe("AGGREGATED_PLUS_HELP_REQUESTS");
            const student = response.body.students[0];
            if (student) {
                expect(student).toHaveProperty("progressPercent");
                expect(student).toHaveProperty("helpRequests");
                expect(student.comprehensionScore).toBeUndefined();
            }
        });
    });
    describe("Intervention Flow", () => {
        it("should log student help request", async () => {
            const response = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(`classrooms/${classroomId}/interventions`))
                .set("Authorization", authToken)
                .send({
                learnerUserId: studentId,
                topic: "vocabulário",
            });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("timestamp");
            expect(response.body.status).toBe("PENDING");
        });
        it("should get intervention prompt", async () => {
            const response = await request(app.getHttpServer())
                .post((0, routes_1.apiUrl)(`classrooms/${classroomId}/interventions/prompt`))
                .set("Authorization", authToken)
                .send({
                studentName: "Maria",
                topic: "vocabulário",
            });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("nextPrompt");
            expect(response.body.nextPrompt).toContain("Maria");
        });
    });
});
//# sourceMappingURL=classroom-mode.integration.spec.js.map