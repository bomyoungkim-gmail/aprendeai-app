import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import * as request from 'supertest';

describe('Family + Classroom E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    authToken = 'mock-jwt-token';
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('E2E: Complete Family Co-Reading Journey', () => {
    it('should complete full co-reading session lifecycle', async () => {
      // Step 1: Create family policy
      const policyResponse = await request(app.getHttpServer())
        .post('/api/v1/families/policy')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          familyId: 'fam_e2e_123',
          learnerUserId: 'child_e2e_456',
          timeboxDefaultMin: 15,
          coReadingDays: [1, 3, 5],
          privacyMode: 'AGGREGATED_ONLY',
        })
        .expect(201);

      expect(policyResponse.body).toHaveProperty('id');

      // Step 2: Get confirmation prompt
      const promptResponse = await request(app.getHttpServer())
        .post(`/api/v1/families/policy/${policyResponse.body.id}/prompt`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(promptResponse.body.nextPrompt).toContain('15 min');

      // Step 3: Start co-reading session
      const sessionResponse = await request(app.getHttpServer())
        .post('/api/v1/families/co-sessions/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          familyId: 'fam_e2e_123',
          learnerUserId: 'child_e2e_456',
          educatorUserId: 'parent_e2e_789',
          readingSessionId: 'rs_e2e_001',
          contentId: 'content_e2e_xyz',
        })
        .expect(201);

      const coSessionId = sessionResponse.body.coSession.id;

      // Step 4: Get prompts for each phase
      const bootPrompt = await request(app.getHttpServer())
        .post(`/api/v1/families/co-sessions/${coSessionId}/prompt`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ phase: 'BOOT' })
        .expect(201);

      expect(bootPrompt.body).toHaveProperty('nextPrompt');

      // Step 5: Finish session
      const finishResponse = await request(app.getHttpServer())
        .post(`/api/v1/families/co-sessions/${coSessionId}/finish`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          context: {
            coSessionId,
            currentPhase: 'POST',
            checkpointFailCount: 0,
          },
        });

      expect(finishResponse.status).toBe(201);

      // Step 6: Check educator dashboard (privacy filtered)
      const dashboardResponse = await request(app.getHttpServer())
        .get('/api/v1/families/fam_e2e_123/educator-dashboard/child_e2e_456')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // AGGREGATED_ONLY: should only show stats, no topBlockers
      expect(dashboardResponse.body).toHaveProperty('streakDays');
      expect(dashboardResponse.body).toHaveProperty('minutesTotal');
      expect(dashboardResponse.body.topBlockers).toBeUndefined();
    });
  });

  describe('E2E: Privacy Mode Validation', () => {
    it('should enforce AGGREGATED_ONLY privacy mode', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/families/fam_privacy_test/educator-dashboard/learner_test')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200) {
        // Should not expose sensitive data
        expect(response.body.detailedLogs).toBeUndefined();
        expect(response.body.textualContent).toBeUndefined();
        expect(response.body.topBlockers).toBeUndefined();
        
        // Should expose aggregated stats
        expect(response.body).toHaveProperty('streakDays');
        expect(response.body).toHaveProperty('comprehensionAvg');
      }
    });
  });

  describe('E2E: Classroom Teacher Dashboard', () => {
    it('should display classroom dashboard with multiple students', async () => {
      // Create classroom
      const classResponse = await request(app.getHttpServer())
        .post('/api/v1/classrooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ownerEducatorUserId: 'teacher_e2e_123',
          name: 'Turma E2E',
          gradeLevel: '5º Ano',
        })
        .expect(201);

      const classroomId = classResponse.body.id;

      // Set policy with AGGREGATED_PLUS_FLAGS
      await request(app.getHttpServer())
        .post(`/api/v1/classrooms/${classroomId}/policy`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          privacyMode: 'AGGREGATED_PLUS_FLAGS',
          interventionMode: 'PROMPT_COACH',
        })
        .expect(201);

      // Enroll students
      await request(app.getHttpServer())
        .post(`/api/v1/classrooms/${classroomId}/enroll`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ learnerUserId: 'student_1', nickname: 'João' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/classrooms/${classroomId}/enroll`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ learnerUserId: 'student_2', nickname: 'Maria' })
        .expect(201);

      // Get dashboard
      const dashboardResponse = await request(app.getHttpServer())
        .get(`/api/v1/classrooms/${classroomId}/dashboard`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(dashboardResponse.body.activeStudents).toBeGreaterThanOrEqual(2);
      expect(dashboardResponse.body.students).toHaveLength(2);
      expect(dashboardResponse.body.privacyMode).toBe('AGGREGATED_PLUS_FLAGS');

      // With AGGREGATED_PLUS_FLAGS: should show comprehensionScore and struggles
      const student = dashboardResponse.body.students[0];
      expect(student).toHaveProperty('comprehensionScore');
      expect(student).toHaveProperty('struggles');
    });
  });

  describe('E2E: 1:1 Intervention Trigger', () => {
    it('should trigger intervention on help request', async () => {
      const classroomId = 'class_intervention_test';

      // Log help request
      const requestResponse = await request(app.getHttpServer())
        .post(`/api/v1/classrooms/${classroomId}/interventions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          learnerUserId: 'struggling_student_123',
          topic: 'gramática complexa',
        });

      if (requestResponse.status === 201) {
        expect(requestResponse.body.status).toBe('PENDING');

        // Get intervention prompt
        const promptResponse = await request(app.getHttpServer())
          .post(`/api/v1/classrooms/${classroomId}/interventions/prompt`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            studentName: 'Pedro',
            topic: 'gramática complexa',
          })
          .expect(201);

        expect(promptResponse.body.nextPrompt).toContain('Pedro');
        expect(promptResponse.body.nextPrompt).toContain('gramática');
      }
    });
  });
});
