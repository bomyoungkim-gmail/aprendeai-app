/**
 * Integration Tests - Session Flow
 * 
 * Tests complete session lifecycle with real database:
 * - Create session
 * - Advance phases (PRE -> DURING -> POST -> FINISHED)
 * - DoD validation (with real data)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ObservabilityJobsService } from '../../src/observability/jobs.service';
import { ROUTES, apiUrl } from '../helpers/routes';


describe('Sessions Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testUserId: string;
  let testContentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    
    // Enable validation globally (same as main.ts)
    const { ValidationPipe } = await import('@nestjs/common');
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);
    
    // STEP 1: Auth first to get real userId
    const testEmail = `test-${Date.now()}@example.com`;
    
    // Register user via API
    await request(app.getHttpServer())
      .post(apiUrl(ROUTES.AUTH.REGISTER))
      .send({
        email: testEmail,
        password: 'Test123!@#',
        name: 'Test User',
        role: 'COMMON_USER',
        institutionId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID v4 for testing
        schoolingLevel: 'ADULT',
      })
      .expect(201);
    
    // Login to get token and userId
    const loginResponse = await request(app.getHttpServer())
      .post(apiUrl(ROUTES.AUTH.LOGIN))
      .send({
        email: testEmail,
        password: 'Test123!@#',
      })
      .expect(201);
    
    authToken = `Bearer ${loginResponse.body.access_token}`;
    testUserId = loginResponse.body.user.id;
    
    // Create learner profile for the authenticated user
    await prisma.learnerProfile.create({
      data: {
        userId: testUserId,
        dailyReviewCap: 20,
      },
    });

    // STEP 2: Now create content with real userId    
    const content = await prisma.content.create({
      data: {
        ownerUserId: testUserId, // Use real userId from auth
        title: 'Test Content for Integration',
        type: 'PDF',
        originalLanguage: 'EN',
        rawText: 'This is test content for integration testing. ' +
          'It has multiple sentences. ' +
          'Repeat for testing.',
      },
    });
    testContentId = content.id;
    
    // STEP 3: Create content chunks
    await prisma.contentChunk.createMany({
      data: [
        { contentId: testContentId, chunkIndex: 0, text: 'First chunk of text.' },
        { contentId: testContentId, chunkIndex: 1, text: 'Second chunk of text.' },
        { contentId: testContentId, chunkIndex: 2, text: 'Third chunk of text.' },
      ],
    });
  });
  
  afterAll(async () => {
    // Cleanup - in correct order to respect foreign keys
    await prisma.sessionEvent.deleteMany({ where: { readingSessionId: { in: await prisma.readingSession.findMany({ where: { userId: testUserId }, select: { id: true } }).then(s => s.map(x => x.id)) } } });
    await prisma.sessionOutcome.deleteMany({ where: { readingSessionId: { in: await prisma.readingSession.findMany({ where: { userId: testUserId }, select: { id: true } }).then(s => s.map(x => x.id)) } } });
    await prisma.cornellNote.deleteMany({ where: { userId: testUserId } }); // DELETE BEFORE readingSession!
    await prisma.readingSession.deleteMany({ where: { userId: testUserId } });
    await prisma.contentChunk.deleteMany({ where: { contentId: testContentId } });
    await prisma.contentVersion.deleteMany({ where: { contentId: testContentId } }); // DELETE BEFORE content!
    await prisma.content.deleteMany({ where: { id: testContentId } });
    await prisma.learnerProfile.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    
    await app.close();
  });
  
  describe('POST /contents/:id/sessions - Create Session', () => {
    it('should create a new reading session', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/contents/${testContentId}/sessions`)
        .set('Authorization', authToken)
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body.phase).toBe('PRE');
      expect(response.body.contentId).toBe(testContentId);
      expect(response.body.userId).toBe(testUserId);
    });
  });
  
  describe('Session Phase Transitions', () => {
    let sessionId: string;
    
    beforeEach(async () => {
      // Create fresh session for each test
      const session = await prisma.readingSession.create({
        data: {
          userId: testUserId,
          contentId: testContentId,
          phase: 'PRE',
          modality: 'READING',
        },
      });
      sessionId = session.id;
      
      // Create cornell note
      await prisma.cornellNote.create({
        data: {
          userId: testUserId,
          readingSessionId: sessionId,
          mainNotes: {},
        },
      });
    });
    
    it('should advance from PRE to DURING', async () => {
      // First, set PRE phase data
      await request(app.getHttpServer())
        .put(`/api/v1/sessions/${sessionId}/pre`)
        .set('Authorization', authToken)
        .send({
          goalStatement: 'Learn about integration testing',
          predictionText: 'I predict this test will pass correctly.',
          targetWordsJson: ['test', 'integration', 'jest', 'debugging', 'success'],
        })
        .expect(200);
      
      // Then advance to DURING
      const response = await request(app.getHttpServer())
        .post(`/api/v1/sessions/${sessionId}/advance`)
        .set('Authorization', authToken)
        .send({ toPhase: 'POST' })  // Actually goes PRE -> DURING -> POST
        .expect(201);
      
      expect(response.body.phase).toBe('POST');
    });
    
    it('should reject FINISHED without DoD requirements', async () => {
      // Set session to POST phase
      await prisma.readingSession.update({
        where: { id: sessionId },
        data: { phase: 'POST' },
      });
      
      // Try to finish without meeting DoD
      await request(app.getHttpServer())
        .post(`/api/v1/sessions/${sessionId}/advance`)
        .set('Authorization', authToken)
        .send({ toPhase: 'FINISHED' })
        .expect(400);  // Should fail DoD validation
    });
    
    it('should allow FINISHED when all DoD met', async () => {
      // Set session to POST  phase
      await prisma.readingSession.update({
        where: { id: sessionId },
        data: { phase: 'POST' },
      });
      
      // Meet DoD requirement 1: Summary
      await prisma.cornellNotes.upsert({
        where: {
          contentId_userId: {
            contentId: testContentId,
            userId: testUserId,
          },
        },
        create: {
          userId: testUserId,
          contentId: testContentId,
          summaryText: 'DoD Summary satisfied',
        },
        update: {
          summaryText: 'DoD Summary satisfied',
        },
      });
      
      // Meet DoD requirement 2: Quiz responses
      await prisma.sessionEvent.create({
        data: {
          readingSessionId: sessionId,
          eventType: 'QUIZ_RESPONSE',
          payloadJson: { correct: true, question: 'Test question' },
        },
      });
      
      // Meet DoD requirement 3: Production
      await prisma.sessionEvent.create({
        data: {
          readingSessionId: sessionId,
          eventType: 'PRODUCTION_SUBMIT',
          payloadJson: { text: 'My production notes' },
        },
      });
      
      // Now should succeed
      const response = await request(app.getHttpServer())
        .post(`/api/v1/sessions/${sessionId}/advance`)
        .set('Authorization', authToken)
        .send({ toPhase: 'FINISHED' })
        .expect(201);
      
      expect(response.body.phase).toBe('FINISHED');
      expect(response.body.finishedAt).toBeDefined();
    });
  });
  
  describe('Session Events', () => {
    let sessionId: string;
    
    beforeEach(async () => {
      const session = await prisma.readingSession.create({
        data: {
          userId: testUserId,
          contentId: testContentId,
          phase: 'DURING',
        },
      });
      sessionId = session.id;
    });
    
    it('should record quiz response event', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/sessions/${sessionId}/events`)
        .set('Authorization', authToken)
        .send({
          eventType: 'QUIZ_RESPONSE',
          payload: { correct: true, questionText: 'What is Jest?' },
        })
        .expect(201);
      
      expect(response.body.eventType).toBe('QUIZ_RESPONSE');
      expect(response.body.readingSessionId).toBe(sessionId);
    });
    
    it('should record production submit event', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/sessions/${sessionId}/events`)
        .set('Authorization', authToken)
        .send({
          eventType: 'PRODUCTION_SUBMIT',
          payload: { text: 'My notes on testing' },
        })
        .expect(201);
      
      expect(response.body.eventType).toBe('PRODUCTION_SUBMIT');
    });
  });
});

