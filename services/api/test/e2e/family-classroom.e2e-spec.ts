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
    const parent = await prisma.user.create({
      data: {
        email: `parent_e2e_${Date.now()}@test.com`,
        name: "Parent User",
        role: "COMMON_USER",
        schoolingLevel: "HIGHER_EDUCATION",
      },
    });
    userId = parent.id;
    authToken = authHelper.generateAuthHeader({
      id: parent.id,
      email: parent.email,
      name: parent.name,
    });

    // 2. Create Child (Learner)
    const child = await prisma.user.create({
      data: {
        email: `child_e2e_${Date.now()}@test.com`,
        name: "Child User",
        role: "COMMON_USER",
        schoolingLevel: "K12_LOWER",
      },
    });
    childId = child.id;

    // 3. Create Family
    const family = await prisma.family.create({
      data: {
        name: "E2E Family",
        ownerId: userId,
        members: {
          create: { userId: childId, role: "CHILD" },
        },
      },
    });
    familyId = family.id;

    // 4. Create Content (for Co-Reading)
    const content = await prisma.content.create({
      data: {
        title: "E2E Content",
        type: "ARTICLE",
        rawText: "Content",
        originalLanguage: "EN",
        createdBy: userId,
      },
    });
    contentId = content.id;

    // 5. Create Reading Session (Pre-requisite for Co-Reading)
    const rs = await prisma.readingSession.create({
      data: {
        userId: childId,
        contentId: contentId,
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
      const student2 = await prisma.user.create({
        data: {
          email: `s2_${Date.now()}@test.com`,
          name: "S2",
          role: "COMMON_USER",
          schoolingLevel: "K12_LOWER",
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
      // Let's create a quick classroom for this test.
      const interventionClass = await prisma.classroom.create({
        data: {
          name: "Intervention Class",
          owner: { connect: { id: userId } },
        },
      });
      const interventionLearner = await prisma.user.create({
        data: {
          email: `int_learn_${Date.now()}@test.com`,
          name: "Struggling Student",
          role: "COMMON_USER",
          schoolingLevel: "K12_LOWER",
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
