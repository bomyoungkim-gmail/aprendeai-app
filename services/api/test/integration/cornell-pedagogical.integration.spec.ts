import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';
import { CornellModule } from '../../src/cornell/cornell.module';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { TestAuthHelper, createTestUser } from '../helpers/auth.helper';
import { ROUTES } from '../../src/common/constants';

describe('Cornell Pedagogical Endpoints (Integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authHelper: TestAuthHelper;
  let authToken: string;
  let testContentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CornellModule, PrismaModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    authHelper = new TestAuthHelper(process.env.JWT_SECRET || 'test-secret');

    const testUser = createTestUser({ id: 'integration-test-user' });
    authToken = authHelper.generateAuthHeader(testUser);
  });

  afterAll(async () => {
    // Cleanup test data
    if (testContentId) {
      await prismaService.contentPedagogicalData.deleteMany({
        where: { contentId: testContentId },
      });
      await prismaService.content.deleteMany({
        where: { id: testContentId },
      });
    }
    await app.close();
  });

  beforeEach(async () => {
    // Create test content
    const content = await prismaService.content.create({
      data: {
        title: 'Test Educational Content',
        type: 'PDF',

        ownerUserId: 'integration-test-user',
      } as Prisma.ContentUncheckedCreateInput,
    });
    testContentId = content.id;
  });

  afterEach(async () => {
    // Clean up after each test
    if (testContentId) {
      await prismaService.contentPedagogicalData.deleteMany({
        where: { contentId: testContentId },
      });
      await prismaService.gameResult.deleteMany({
        where: { contentId: testContentId },
      });
    }
  });

  describe('POST /cornell/contents/:id/pedagogical', () => {
    it('should create pedagogical data for content', async () => {
      const pedagogicalData = {
        vocabularyTriage: {
          words: [
            { word: 'Photosynthesis', definition: 'Process of converting light to energy', difficulty: 'medium' },
          ],
        },
        socraticQuestions: [
          {
            sectionId: 'intro',
            questions: [{ question: 'What is the main process?', type: 'INFERENCE' }],
          },
        ],
        quizQuestions: [
          {
            sectionId: 'intro',
            questions: [
              { question: 'What is photosynthesis?', options: ['A', 'B', 'C'], correct: 0 },
            ],
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post(`/cornell/contents/${testContentId}/pedagogical`)
        .set('Authorization', authToken)
        .send(pedagogicalData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.contentId).toBe(testContentId);
      expect(response.body.vocabularyTriage).toEqual(pedagogicalData.vocabularyTriage);
    });

    it('should update existing pedagogical data (upsert)', async () => {
      // First creation
      const initialData = {
        vocabularyTriage: { words: [{ word: 'Initial', definition: 'First version' }] },
      };

      await request(app.getHttpServer())
        .post(`/cornell/contents/${testContentId}/pedagogical`)
        .set('Authorization', authToken)
        .send(initialData)
        .expect(201);

      // Update
      const updatedData = {
        vocabularyTriage: { words: [{ word: 'Updated', definition: 'Second version' }] },
      };

      const response = await request(app.getHttpServer())
        .post(`/cornell/contents/${testContentId}/pedagogical`)
        .set('Authorization', authToken)
        .send(updatedData)
        .expect(201);

      expect(response.body.vocabularyTriage.words[0].word).toBe('Updated');
    });

    it('should reject unauthorized requests', async () => {
      await request(app.getHttpServer())
        .post(`/cornell/contents/${testContentId}/pedagogical`)
        .send({ vocabularyTriage: {} })
        .expect(401);
    });
  });

  describe('GET /cornell/contents/:id/context', () => {
    beforeEach(async () => {
      // Create pedagogical data for testing
      await prismaService.contentPedagogicalData.create({
        data: {
          contentId: testContentId,
          vocabularyTriage: { words: [] },
          processingVersion: 'v1.0',
        },
      });
    });

    it('should retrieve pedagogical context', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cornell/contents/${testContentId}/context`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('pedagogicalData');
      expect(response.body.pedagogicalData).toHaveProperty('contentId', testContentId);
    });

    it('should return null pedagogicalData if none exists', async () => {
      // Delete the created data
      await prismaService.contentPedagogicalData.deleteMany({
        where: { contentId: testContentId },
      });

      const response = await request(app.getHttpServer())
        .get(`/cornell/contents/${testContentId}/context`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.pedagogicalData).toBeNull();
    });

    it('should reject unauthorized requests', async () => {
      await request(app.getHttpServer())
        .get(`/cornell/contents/${testContentId}/context`)
        .expect(401);
    });
  });

  describe('Full Flow: Worker -> API -> Storage', () => {
    it('should handle complete pedagogical enrichment flow', async () => {
      // Simulate worker calling API to save enrichment
      const enrichmentData = {
        vocabularyTriage: {
          words: [
            { word: 'Ecosystem', definition: 'Biological community', difficulty: 'medium' },
          ],
        },
        socraticQuestions: [
          {
            sectionId: 'chapter1',
            questions: [
              { question: 'How do organisms interact?', type: 'APPLICATION', difficulty: 'hard' },
            ],
          },
        ],
        quizQuestions: [],
        tabooCards: [{ targetWord: 'Ecosystem', forbiddenWords: ['environment', 'nature'], hint: 'Community' }],
        bossFightConfig: { vocabList: ['Ecosystem'], difficulty: 'medium', rounds: 3 },
        processingVersion: 'v1.0',
      };

      // Step 1: Worker saves data
      const saveResponse = await request(app.getHttpServer())
        .post(`/cornell/contents/${testContentId}/pedagogical`)
        .set('Authorization', authToken)
        .send(enrichmentData)
        .expect(201);

      expect(saveResponse.body).toHaveProperty('id');

      // Step 2: Frontend retrieves context
      const contextResponse = await request(app.getHttpServer())
        .get(`/cornell/contents/${testContentId}/context`)
        .set('Authorization', authToken)
        .expect(200);

      expect(contextResponse.body.pedagogicalData.vocabularyTriage).toEqual(
        enrichmentData.vocabularyTriage
      );
      expect(contextResponse.body.pedagogicalData.tabooCards).toEqual(enrichmentData.tabooCards);
    });
  });
});
