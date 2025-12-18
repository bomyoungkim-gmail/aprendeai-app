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
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);
    
    // Setup: Create test user and content
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        emailVerified: new Date(),
      },
    });
    testUserId = user.id;
    
    // Create learner profile
    await prisma.learnerProfile.create({
      data: {
        userId: testUserId,
        dailyReviewCap: 20,
        targetLanguage: 'PT',
      },
    });
    
    // Create test content
    const content = await prisma.content.create({
      data: {
        userId: testUserId,
        title: 'Test Content for Integration',
        type: 'PDF',
        originalLanguage: 'EN',
        rawText: 'This is test content for integration testing. ' +
          'It has multiple sentences. ' +
          'Repeat for testing.',
      },
    });
    testContentId = content.id;
    
    // Create content chunks
    await prisma.contentChunk.createMany({
      data: [
        { contentId: testContentId, chunkIndex: 0, text: 'First chunk of text.' },
        { contentId: testContentId, chunkIndex: 1, text: 'Second chunk of text.' },
        { contentId: testContentId, chunkIndex: 2, text: 'Third chunk of text.' },
      ],
    });
    
    // TODO: Get real auth token
    authToken = 'Bearer test-token';
  });
  
  afterAll(async () => {
    // Cleanup
    await prisma.sessionEvent.deleteMany({ where: { readingSession: { userId: testUserId } } });
    await prisma.sessionOutcome.deleteMany({ where: { readingSession: { userId: testUserId } } });
    await prisma.readingSession.deleteMany({ where: { userId: testUserId } });
    await prisma.contentChunk.deleteMany({ where: { contentId: testContentId } });
    await prisma.cornellNote.deleteMany({ where: { userId: testUserId } });
    await prisma.content.deleteMany({ where: { id: testContentId } });
    await prisma.learnerProfile.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    
    await app.close();
  });
  
  describe('POST /contents/:id/sessions - Create Session', () => {
    it('should create a new reading session', async () => {
      const response = await request(app.getHttpServer())
        .post(`/contents/${testContentId}/sessions`)
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
          contentId: testContentId,
          readingSessionId: sessionId,
          mainNotes: {},
        },
      });
    });
    
    it('should advance from PRE to DURING', async () => {
      // First, set PRE phase data
      await request(app.getHttpServer())
        .put(`/sessions/${sessionId}/pre`)
        .set('Authorization', authToken)
        .send({
          goal: 'Learn about integration testing',
          targetWords: ['test', 'integration', 'jest'],
        })
        .expect(200);
      
      // Then advance to DURING
      const response = await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/advance`)
        .set('Authorization', authToken)
        .send({ toPhase: 'POST' })  // Actually goes PRE -> DURING -> POST
        .expect(200);
      
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
        .post(`/sessions/${sessionId}/advance`)
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
      await prisma.cornellNote.updateMany({
        where: { readingSessionId: sessionId },
        data: {
          summaryText: 'This is a comprehensive summary of what I learned from this integration test.',
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
        .post(`/sessions/${sessionId}/advance`)
        .set('Authorization', authToken)
        .send({ toPhase: 'FINISHED' })
        .expect(200);
      
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
        .post(`/sessions/${sessionId}/events`)
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
        .post(`/sessions/${sessionId}/events`)
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
