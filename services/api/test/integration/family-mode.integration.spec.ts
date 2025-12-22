import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import * as request from 'supertest';

describe('Family Mode Integration Tests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let familyId: string;
  let learnerId: string;
  let policyId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    // TODO: Get auth token (mock or real authentication)
    authToken = 'mock-jwt-token';
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('Family Policy Flow', () => {
    it('should create a family policy', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/families/policy')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          familyId: 'fam_test_123',
          learnerUserId: 'user_test_456',
          timeboxDefaultMin: 20,
          coReadingDays: [1, 3, 5],
          privacyMode: 'AGGREGATED_ONLY',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.timeboxDefaultMin).toBe(20);
      
      policyId = response.body.id;
      familyId = response.body.familyId;
      learnerId = response.body.learnerUserId;
    });

    it('should get policy confirmation prompt', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/families/policy/${policyId}/prompt`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('nextPrompt');
      expect(response.body.nextPrompt).toContain('20 min');
    });

    it('should get educator dashboard with privacy filtering', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/families/${familyId}/educator-dashboard/${learnerId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('streakDays');
      expect(response.body).toHaveProperty('minutesTotal');
      expect(response.body).toHaveProperty('comprehensionAvg');
      // AGGREGATED_ONLY mode: should not have topBlockers
      expect(response.body.topBlockers).toBeUndefined();
    });
  });

  describe('Co-Reading Session Flow', () => {
    it('should start co-reading session', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/families/co-sessions/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          familyId: 'fam_test_123',
          learnerUserId: 'user_test_456',
          educatorUserId: 'user_educator_789',
          readingSessionId: 'rs_test_001',
          contentId: 'content_xyz',
          timeboxMin: 20,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('coSession');
      expect(response.body).toHaveProperty('context');
      expect(response.body.context.currentPhase).toBe('BOOT');
    });

    it('should get co-session prompt by phase', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/families/co-sessions/session_123/prompt')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ phase: 'PRE' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('nextPrompt');
    });
  });

  describe('Teach-Back Session Flow', () => {
    it('should start teach-back session', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/families/teachback/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          familyId: 'fam_test_123',
          childUserId: 'user_test_456', // Child as educator
          parentUserId: 'user_educator_789', // Parent as learner
          baseReadingSessionId: 'rs_test_001',
          durationMin: 7,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('session');
      expect(response.body.session.type).toBe('TEACH_BACK');
    });

    it('should get teach-back prompts by step', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/families/teachback/tb_123/prompt')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ step: 2 });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('nextPrompt');
    });

    it('should finish teach-back with stars', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/families/teachback/tb_123/finish')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ stars: 3 });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('nextPrompt');
      expect(response.body.nextPrompt).toContain('3 estrelas');
    });
  });
});
