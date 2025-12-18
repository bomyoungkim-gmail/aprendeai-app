/**
 * Integration Tests - Review & SRS
 * 
 * Tests vocabulary review and SRS system with real database:
 * - Queue retrieval
 * - SRS stage transitions
 * - Due date updates
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { addDays, subDays } from 'date-fns';

describe('Review & SRS Integration Tests', () => {
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
    
    // Setup test user
    const user = await prisma.user.create({
      data: {
        email: `review-test-${Date.now()}@example.com`,
        name: 'Review Test User',
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
        title: 'Review Test Content',
        type: 'PDF',
        originalLanguage: 'EN',
        rawText: 'Content for vocab review testing.',
      },
    });
    testContentId = content.id;
    
    authToken = 'Bearer test-token';
  });
  
  afterAll(async () => {
    // Cleanup
    await prisma.vocabAttempt.deleteMany({ where: { userId: testUserId } });
    await prisma.userVocabulary.deleteMany({ where: { userId: testUserId } });
    await prisma.content.deleteMany({ where: { id: testContentId } });
    await prisma.learnerProfile.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await app.close();
  });
  
  describe('GET /review/queue - Queue Retrieval', () => {
    beforeEach(async () => {
      // Clean vocab
      await prisma.userVocabulary.deleteMany({ where: { userId: testUserId } });
    });
    
    it('should return empty queue when no due items', async () => {
      const response = await request(app.getHttpServer())
        .get('/review/queue')
        .set('Authorization', authToken)
        .expect(200);
      
      expect(response.body).toEqual([]);
    });
    
    it('should return due vocabulary items', async () => {
      // Create due vocab (dueAt is in the past)
      await prisma.userVocabulary.create({
        data: {
          userId: testUserId,
          contentId: testContentId,
          word: 'test',
          language: 'EN',
          srsStage: 'D1',
          dueAt: subDays(new Date(), 1),  // Due yesterday
        },
      });
      
      const response = await request(app.getHttpServer())
        .get('/review/queue')
        .set('Authorization', authToken)
        .expect(200);
      
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].word).toBe('test');
      expect(response.body[0].srsStage).toBe('D1');
    });
    
    it('should NOT return future items', async () => {
      await prisma.userVocabulary.create({
        data: {
          userId: testUserId,
          contentId: testContentId,
          word: 'future',
          language: 'EN',
          srsStage: 'D3',
          dueAt: addDays(new Date(), 5),  // Due in 5 days
        },
      });
      
      const response = await request(app.getHttpServer())
        .get('/review/queue')
        .set('Authorization', authToken)
        .expect(200);
      
      expect(response.body).toEqual([]);
    });
    
    it('should respect daily review cap', async () => {
      // Create 25 due items (cap is 20)
      const promises = [];
      for (let i = 0; i < 25; i++) {
        promises.push(
          prisma.userVocabulary.create({
            data: {
              userId: testUserId,
              contentId: testContentId,
              word: `word${i}`,
              language: 'EN',
              srsStage: 'D1',
              dueAt: subDays(new Date(), 1),
            },
          })
        );
      }
      await Promise.all(promises);
      
      const response = await request(app.getHttpServer())
        .get('/review/queue')
        .set('Authorization', authToken)
        .expect(200);
      
      expect(response.body.length).toBeLessThanOrEqual(20);
    });
  });
  
  describe('POST /review/attempt - SRS Transitions', () => {
    let vocabId: string;
    
    beforeEach(async () => {
      // Create fresh vocab item
      const vocab = await prisma.userVocabulary.create({
        data: {
          userId: testUserId,
          contentId: testContentId,
          word: 'attempt-test',
          language: 'EN',
          srsStage: 'NEW',
          dueAt: new Date(),
        },
      });
      vocabId = vocab.id;
    });
    
    it('should transition NEW + OK -> D1', async () => {
      const response = await request(app.getHttpServer())
        .post('/review/attempt')
        .set('Authorization', authToken)
        .send({
          vocabItemId: vocabId,
          result: 'OK',
        })
        .expect(200);
      
      expect(response.body.srsStage).toBe('D1');
      expect(response.body.dueAt).toBeDefined();
    });
    
    it('should transition with FAIL -> D1 (reset)', async () => {
      // First advance to D7
      await prisma.userVocabulary.update({
        where: { id: vocabId },
        data: { srsStage: 'D7' },
      });
      
      const response = await request(app.getHttpServer())
        .post('/review/attempt')
        .set('Authorization', authToken)
        .send({
          vocabItemId: vocabId,
          result: 'FAIL',
        })
        .expect(200);
      
      expect(response.body.srsStage).toBe('D1');
      expect(response.body.lapseCount).toBeGreaterThan(0);
    });
    
    it('should update due date correctly for D30', async () => {
      // Set to D14
      await prisma.userVocabulary.update({
        where: { id: vocabId },
        data: { srsStage: 'D14' },
      });
      
      const beforeAttempt = new Date();
      
      const response = await request(app.getHttpServer())
        .post('/review/attempt')
        .set('Authorization', authToken)
        .send({
          vocabItemId: vocabId,
          result: 'OK',  // D14 + OK -> D30
        })
        .expect(200);
      
      expect(response.body.srsStage).toBe('D30');
      
      const dueDate = new Date(response.body.dueAt);
      const expectedDue = addDays(beforeAttempt, 30);
      
      // Should be ~30 days from now (allow 1 day tolerance)
      const diffDays = Math.abs(dueDate.getTime() - expectedDue.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeLessThan(1);
    });
    
    it('should record attempt in history', async () => {
      await request(app.getHttpServer())
        .post('/review/attempt')
        .set('Authorization', authToken)
        .send({
          vocabItemId: vocabId,
          result: 'OK',
        })
        .expect(200);
      
      const attempts = await prisma.vocabAttempt.findMany({
        where: { vocabItemId },
      });
      
      expect(attempts.length).toBeGreaterThan(0);
      expect(attempts[0].result).toBe('OK');
    });
  });
  
  describe('SRS Edge Cases', () => {
    let vocabId: string;
    
    beforeEach(async () => {
      const vocab = await prisma.userVocabulary.create({
        data: {
          userId: testUserId,
          contentId: testContentId,
          word: 'edge-case',
          language: 'EN',
          srsStage: 'MASTERED',
          dueAt: new Date(),
        },
      });
      vocabId = vocab.id;
    });
    
    it('should keep MASTERED on OK', async () => {
      const response = await request(app.getHttpServer())
        .post('/review/attempt')
        .set('Authorization', authToken)
        .send({
          vocabItemId: vocabId,
          result: 'OK',
        })
        .expect(200);
      
      expect(response.body.srsStage).toBe('MASTERED');
    });
    
    it('should regress MASTERED on FAIL', async () => {
      const response = await request(app.getHttpServer())
        .post('/review/attempt')
        .set('Authorization', authToken)
        .send({
          vocabItemId: vocabId,
          result: 'FAIL',
        })
        .expect(200);
      
      expect(response.body.srsStage).toBe('D1');
    });
  });
});
