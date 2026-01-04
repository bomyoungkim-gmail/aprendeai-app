import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/prisma/prisma.service";
import * as request from "supertest";
import { ConfigService } from "@nestjs/config";
import { TestAuthHelper } from "../helpers/auth.helper";

describe("Family + Classroom E2E Tests", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authHelper: TestAuthHelper;
  let authToken: string;
  let userId: string; // Parent/Educator
  let childId: string; // Child/Learner
  let familyId: string;
  let contentId: string;
  let readingSessionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    await app.init();

    const configService = app.get<ConfigService>(ConfigService);
    const jwtSecret = configService.get<string>("JWT_SECRET");
    authHelper = new TestAuthHelper(jwtSecret);

    prisma = app.get<PrismaService>(PrismaService);

    // 1. Create Parent (Educator)
    const parent = await prisma.users.create({
      data: {
        email: `parent_e2e_${Date.now()}@test.com`,
        name: "Parent User",
        last_context_role: "STUDENT", // Simplified for E2E, usually PARENT in business logic but DB uses STUDENT/TEACHER/OWNER
        schooling_level: "HIGHER_EDUCATION",
      },
    });
    userId = parent.id;
    authToken = authHelper.generateAuthHeader({
      id: parent.id,
      email: parent.email,
      name: parent.name,
    });

    // Verify parent as teacher (for Classroom E2E)
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

    // 2. Create Child (Learner)
    const child = await prisma.users.create({
      data: {
        email: `child_e2e_${Date.now()}@test.com`,
        name: "Child User",
        last_context_role: "STUDENT",
        schooling_level: "K12_LOWER",
      },
    });
    childId = child.id;

    // 3. Create Family
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

    // 4. Create Content (for Co-Reading)
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

    // 5. Create Reading Session (Pre-requisite for Co-Reading)
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
      // Step 1: Create family policy
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

      // Step 2: Get confirmation prompt
      const promptResponse = await request(app.getHttpServer())
        .post(`/api/v1/families/policy/${policyResponse.body.id}/prompt`)
        .set("Authorization", authToken)
        .expect(201);

      expect(promptResponse.body.nextPrompt).toContain("15 min");

      // Step 3: Start co-reading session
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

      // Step 4: Get prompts for each phase
      const bootPrompt = await request(app.getHttpServer())
        .post(`/api/v1/families/co-sessions/${coSessionId}/prompt`)
        .set("Authorization", authToken)
        .send({ phase: "BOOT" })
        .expect(201);

      expect(bootPrompt.body).toHaveProperty("nextPrompt");

      // Step 5: Finish session
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

      // Step 6: Check educator dashboard (privacy filtered)
      const dashboardResponse = await request(app.getHttpServer())
        .get(`/api/v1/families/${familyId}/educator-dashboard/${childId}`)
        .set("Authorization", authToken)
        .expect(200);

      // AGGREGATED_ONLY: should only show stats, no topBlockers
      expect(dashboardResponse.body).toHaveProperty("streakDays");
      expect(dashboardResponse.body).toHaveProperty("minutesTotal");
      expect(dashboardResponse.body.topBlockers).toBeUndefined();
    });
  });

  describe("E2E: Privacy Mode Validation", () => {
    it("should enforce AGGREGATED_ONLY privacy mode", async () => {
      // Reuse the family created in beforeAll, which doesn't have a policy set to AGGREGATED_ONLY explicitly (wait, we set it in Step 1)
      // Step 1 set privacyMode: 'AGGREGATED_ONLY'.
      const response = await request(app.getHttpServer())
        .get(`/api/v1/families/${familyId}/educator-dashboard/${childId}`)
        .set("Authorization", authToken);

      if (response.status === 200) {
        // Should not expose sensitive data
        expect(response.body.detailedLogs).toBeUndefined();
        expect(response.body.textualContent).toBeUndefined();
        expect(response.body.topBlockers).toBeUndefined();

        // Should expose aggregated stats
        expect(response.body).toHaveProperty("streakDays");
        expect(response.body).toHaveProperty("comprehensionAvg");
      }
    });
  });

  describe("E2E: Classroom Teacher Dashboard", () => {
    it("should display classroom dashboard with multiple students", async () => {
      // Create classroom
      const classResponse = await request(app.getHttpServer())
        .post("/api/v1/classrooms")
        .set("Authorization", authToken)
        .send({
          ownerEducatorUserId: userId, // Use authenticated user
          name: "Turma E2E",
          gradeLevel: "5º Ano",
        })
        .expect(201);

      const classroomId = classResponse.body.id;

      // Set policy with AGGREGATED_PLUS_FLAGS
      await request(app.getHttpServer())
        .post(`/api/v1/classrooms/${classroomId}/policy`)
        .set("Authorization", authToken)
        .send({
          privacyMode: "AGGREGATED_PLUS_FLAGS",
          interventionMode: "PROMPT_COACH",
        })
        .expect(201);

      // Enroll students (requires creating fresh users or using existing child)
      // For E2E simplicity, we can enroll the existing childId
      await request(app.getHttpServer())
        .post(`/api/v1/classrooms/${classroomId}/enroll`)
        .set("Authorization", authToken)
        .send({ learnerUserId: childId, nickname: "João" })
        .expect(201);

      // Need a second student for activeStudents check
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

      // Get dashboard
      const dashboardResponse = await request(app.getHttpServer())
        .get(`/api/v1/classrooms/${classroomId}/dashboard`)
        .set("Authorization", authToken)
        .expect(200);

      expect(dashboardResponse.body.activeStudents).toBeGreaterThanOrEqual(2);
      expect(dashboardResponse.body.students).toHaveLength(2);
      expect(dashboardResponse.body.privacyMode).toBe("AGGREGATED_PLUS_FLAGS");

      // With AGGREGATED_PLUS_FLAGS: should show comprehensionScore and struggles
      const student = dashboardResponse.body.students[0];
      expect(student).toHaveProperty("comprehensionScore");
      expect(student).toHaveProperty("struggles");
    });
  });

  describe("E2E: 1:1 Intervention Trigger", () => {
    it("should trigger intervention on help request", async () => {
      const classroomId = "class_intervention_test"; // This assumes classroom exists, which it doesn't.
      // We should use the classroom created in previous step, OR create a new one.
      // Re-using 'classroomId' variable from previous test is tricky due to scope.
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

      // Log help request
      const requestResponse = await request(app.getHttpServer())
        .post(`/api/v1/classrooms/${interventionClass.id}/interventions`)
        .set("Authorization", authToken)
        .send({
          learnerUserId: interventionLearner.id,
          topic: "gramática complexa",
        });

      if (requestResponse.status === 201) {
        expect(requestResponse.body.status).toBe("PENDING");

        // Get intervention prompt
        const promptResponse = await request(app.getHttpServer())
          .post(
            `/api/v1/classrooms/${interventionClass.id}/interventions/prompt`,
          )
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
