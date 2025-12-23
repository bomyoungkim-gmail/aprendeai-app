import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { TestAuthHelper } from '../helpers/auth.helper';

describe('Session History API (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authHelper: TestAuthHelper;
  let authToken: string;
  let userId: string;
  let contentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    
    // Initialize test auth helper
    const secret = process.env.JWT_SECRET || 'test-secret-key-123';
    authHelper = new TestAuthHelper(secret);

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `session_history_${Date.now()}@test.com`,
        name: 'History Test User',
        passwordHash: 'test-hash',
        role: UserRole.COMMON_USER,
        schoolingLevel: 'MEDIO',
      },
    });
    userId = user.id;

    // Generate real JWT token using TestAuthHelper
    authToken = authHelper.generateAuthHeader({ id: userId, email: user.email, name: user.name });

    // Create test content
    const content = await prisma.content.create({
      data: {
        title: 'Test Article for History',
        rawText: 'Test content',
        type: 'ARTICLE',
        originalLanguage: 'PT_BR',
        creator: { connect: { id: userId } },
        scopeType: 'USER',
      },
    });
    contentId = content.id;

    // Create test sessions
    const now = new Date();
    for (let i = 0; i < 25; i++) {
      const startedAt = new Date(now);
      startedAt.setDate(startedAt.getDate() - i);

      await prisma.readingSession.create({
        data: {
          userId,
          contentId,
          phase: i % 3 === 0 ? 'PRE' : i % 3 === 1 ? 'DURING' : 'POST',
          modality: 'READING',
          assetLayer: 'L1',
          goalStatement: `Session ${i}`,
          predictionText: '',
          targetWordsJson: [],
          startedAt,
          finishedAt: i < 20 ? new Date(startedAt.getTime() + 30 * 60000) : null, // 30 min
        },
      });
    }
  });

  afterAll(async () => {
    if (userId) {
      await prisma.readingSession.deleteMany({ where: { userId } });
      await prisma.content.deleteMany({ where: { createdBy: userId } });
      await prisma.user.delete({ where: { id: userId } });
    }
    await prisma.$disconnect();
    await app.close();
  });

  describe('GET /api/v1/sessions', () => {
    it('should return paginated sessions with default params', () => {
      return request(app.getHttpServer())
        .get('/api/v1/sessions')
        .set('Authorization', authToken)
        .expect(200)
        .expect((res) => {
          expect(res.body.sessions).toBeDefined();
          expect(Array.isArray(res.body.sessions)).toBe(true);
          expect(res.body.sessions.length).toBeLessThanOrEqual(20);
          expect(res.body.pagination).toMatchObject({
            page: 1,
            limit: 20,
            total: 25,
            totalPages: 2,
          });
        });
    });

    it('should respect page and limit parameters', () => {
      return request(app.getHttpServer())
        .get('/api/v1/sessions?page=2&limit=10')
        .set('Authorization', authToken)
        .expect(200)
        .expect((res) => {
          expect(res.body.sessions.length).toBeLessThanOrEqual(10);
          expect(res.body.pagination).toMatchObject({
            page: 2,
            limit: 10,
          });
        });
    });

    it('should filter by phase', () => {
      return request(app.getHttpServer())
        .get('/api/v1/sessions?phase=PRE')
        .set('Authorization', authToken)
        .expect(200)
        .expect((res) => {
          expect(res.body.sessions.length).toBeGreaterThan(0);
          res.body.sessions.forEach((session: any) => {
            expect(session.phase).toBe('PRE');
          });
        });
    });

    it('should filter by date range', () => {
      const since = new Date();
      since.setDate(since.getDate() - 7);
      const until = new Date();

      return request(app.getHttpServer())
        .get(`/api/v1/sessions?since=${since.toISOString()}&until=${until.toISOString()}`)
        .set('Authorization', authToken)
        .expect(200)
        .expect((res) => {
          expect(res.body.sessions).toBeDefined();
          expect(res.body.sessions.length).toBeGreaterThan(0);
          expect(res.body.sessions.length).toBeLessThan(25);
        });
    });

    it('should search by content title', () => {
      return request(app.getHttpServer())
        .get('/api/v1/sessions?query=Test Article')
        .set('Authorization', authToken)
        .expect(200)
        .expect((res) => {
          expect(res.body.sessions).toBeDefined();
          res.body.sessions.forEach((session: any) => {
            expect(session.content.title).toContain('Test Article');
          });
        });
    });

    it('should enforce max limit of 100', () => {
      return request(app.getHttpServer())
        .get('/api/v1/sessions?limit=500')
        .set('Authorization', authToken)
        .expect(400);
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/sessions')
        .expect(401);
    });
  });

  describe('GET /api/v1/sessions/export', () => {
    it('should export as JSON by default', () => {
      return request(app.getHttpServer())
        .get('/api/v1/sessions/export')
        .set('Authorization', authToken)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.count).toBe(25);
        });
    });

    it('should export as CSV when format=csv', () => {
      return request(app.getHttpServer())
        .get('/api/v1/sessions/export?format=csv')
        .set('Authorization', authToken)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(typeof res.body.data).toBe('string');
          expect(res.body.data).toContain('ID,Started At');
          expect(res.body.filename).toMatch(/sessions_.*\.csv/);
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/sessions/export')
        .expect(401);
    });
  });

  describe('GET /api/v1/sessions/analytics', () => {
    it('should return analytics with default 30 days', () => {
      return request(app.getHttpServer())
        .get('/api/v1/sessions/analytics')
        .set('Authorization', authToken)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('activityByDate');
          expect(res.body).toHaveProperty('phaseDistribution');
          expect(res.body).toHaveProperty('totalSessions');
          expect(res.body.periodDays).toBe(30);
          expect(res.body.phaseDistribution).toMatchObject({
            PRE: expect.any(Number),
            DURING: expect.any(Number),
            POST: expect.any(Number),
          });
        });
    });

    it('should respect custom days parameter', () => {
      return request(app.getHttpServer())
        .get('/api/v1/sessions/analytics?days=7')
        .set('Authorization', authToken)
        .expect(200)
        .expect((res) => {
          expect(res.body.periodDays).toBe(7);
          expect(res.body.totalSessions).toBeLessThan(25);
        });
    });

    it('should return activity grouped by date', () => {
      return request(app.getHttpServer())
        .get('/api/v1/sessions/analytics?days=30')
        .set('Authorization', authToken)
        .expect(200)
        .expect((res) => {
          expect(typeof res.body.activityByDate).toBe('object');
          const dates = Object.keys(res.body.activityByDate);
          expect(dates.length).toBeGreaterThan(0);
          
          // Check structure of activity data
          const firstDate = dates[0];
          expect(res.body.activityByDate[firstDate]).toHaveProperty('count');
          expect(res.body.activityByDate[firstDate]).toHaveProperty('minutes');
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/sessions/analytics')
        .expect(401);
    });
  });
});
