import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('Study Session Analytics (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let eventEmitter: EventEmitter2;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    eventEmitter = app.get<EventEmitter2>(EventEmitter2);

    // Create test user and get auth token
    const testUser = await prisma.user.create({
      data: {
        name: 'Analytics Test User',
        email: `analytics-test-${Date.now()}@test.com`,
        passwordHash: 'hashed',
        role: 'STUDENT',
        schoolingLevel: 'HIGH_SCHOOL',
      },
    });
    userId = testUser.id;

    // Get auth token (simplified - adapt to your auth flow)
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: 'password' });
    
    authToken = loginRes.body.token || 'mock-token';
  });

  afterAll(async () => {
    // Cleanup
    await prisma.studySession.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await app.close();
  });

  describe('Event-Driven Session Creation', () => {
    it('should create StudySession when game.completed event is emitted', async () => {
      // Emit game completion event
      eventEmitter.emit('session.started', {
        userId,
        activityType: 'game',
        sourceId: 'test-game-session',
      });

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify StudySession was created
      const sessions = await prisma.studySession.findMany({
        where: { userId, activityType: 'game' },
      });

      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions[0].activityType).toBe('game');
      expect(sessions[0].sourceId).toBe('test-game-session');
    });

    it('should create StudySession when reading.activity event is emitted', async () => {
      const contentId = 'test-content-123';

      // Emit reading activity
      eventEmitter.emit('reading.activity', {
        userId,
        contentId,
        activityType: 'annotation',
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify reading session created
      const sessions = await prisma.studySession.findMany({
        where: { userId, contentId, activityType: 'reading' },
      });

      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions[0].contentId).toBe(contentId);
    });

    it('should update session with metrics on session.finished', async () => {
      // Create a session first
      const session = await prisma.studySession.create({
        data: {
          userId,
          activityType: 'game',
          startTime: new Date(),
        },
      });

      // Emit finish event
      eventEmitter.emit('session.finished', {
        sessionId: session.id,
        durationMinutes: 30,
        netFocusMinutes: 25,
        accuracyRate: 85,
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify metrics updated
      const updated = await prisma.studySession.findUnique({
        where: { id: session.id },
      });

      expect(updated.durationMinutes).toBe(30);
      expect(updated.netFocusMinutes).toBe(25);
      expect(updated.accuracyRate).toBe(85);
      expect(updated.focusScore).toBeCloseTo(83.33, 1); // (25/30)*100
      expect(updated.endTime).toBeTruthy();
    });

    it('should increment interruptions on session.heartbeat with blurred status', async () => {
      const session = await prisma.studySession.create({
        data: {
          userId,
          activityType: 'reading',
          startTime: new Date(),
        },
      });

      // Emit blur heartbeat
      eventEmitter.emit('session.heartbeat', {
        sessionId: session.id,
        status: 'blurred',
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const updated = await prisma.studySession.findUnique({
        where: { id: session.id },
      });

      expect(updated.interruptions).toBeGreaterThan(0);
    });
  });

  describe('Analytics Endpoints', () => {
    beforeEach(async () => {
      // Create sample sessions for analytics
      const now = new Date();
      await prisma.studySession.createMany({
        data: [
          {
            userId,
            activityType: 'game',
            startTime: new Date(now.setHours(14, 0, 0, 0)),
            endTime: new Date(now.setHours(14, 30, 0, 0)),
            durationMinutes: 30,
            netFocusMinutes: 25,
            focusScore: 83,
            accuracyRate: 90,
          },
          {
            userId,
            activityType: 'reading',
            startTime: new Date(now.setHours(15, 0, 0, 0)),
            endTime: new Date(now.setHours(15, 45, 0, 0)),
            durationMinutes: 45,
            netFocusMinutes: 40,
            focusScore: 89,
            accuracyRate: 75,
          },
        ],
      });
    });

    it('GET /analytics/hourly-performance should return hourly breakdown', async () => {
      const res = await request(app.getHttpServer())
        .get('/analytics/hourly-performance?days=30')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('hourlyBreakdown');
      expect(res.body).toHaveProperty('peakHours');
      expect(res.body.daysAnalyzed).toBe(30);
      expect(Array.isArray(res.body.hourlyBreakdown)).toBe(true);
    });

    it('GET /analytics/quality-overview should return aggregated metrics', async () => {
      const res = await request(app.getHttpServer())
        .get('/analytics/quality-overview?period=week')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.totalSessions).toBeGreaterThan(0);
      expect(res.body.avgAccuracy).toBeGreaterThan(0);
      expect(res.body.avgFocusScore).toBeGreaterThan(0);
    });
  });

  describe('Auto-Close Abandoned Sessions', () => {
    it('should close sessions older than threshold', async () => {
      // Create old session (2 hours ago)
      const oldTime = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const oldSession = await prisma.studySession.create({
        data: {
          userId,
          activityType: 'reading',
          startTime: oldTime,
        },
      });

      // Manually trigger cleanup (in real app, this would be a cron job)
      const sessionTrackingService = app.get('SessionTrackingService');
      await sessionTrackingService.autoCloseAbandonedSessions(30);

      // Verify session was closed
      const closed = await prisma.studySession.findUnique({
        where: { id: oldSession.id },
      });

      expect(closed.endTime).toBeTruthy();
      expect(closed.durationMinutes).toBeGreaterThan(0);
    });
  });
});
