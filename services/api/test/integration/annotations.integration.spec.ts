import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AppModule } from '../../src/app.module';

describe('Annotations Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testUserId: string;
  let testContentId: string;
  let testGroupId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Get auth token and setup test data
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    authToken = loginRes.body.access_token;
    testUserId = loginRes.body.user.id;

    // Create test content
    const content = await prisma.content.create({
      data: {
        title: 'Test Content for Annotations',
        type: 'PDF',
        originalLanguage: 'EN',
        rawText: 'This is test content for annotations. We will highlight and annotate this text.',
        ownerUserId: testUserId,
      },
    });
    testContentId = content.id;

    // Create test group
    const group = await prisma.studyGroup.create({
      data: {
        name: 'Test Annotation Group',
        ownerUserId: testUserId,
      },
    });
    testGroupId = group.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.annotation.deleteMany({
      where: { contentId: testContentId },
    });
    await prisma.content.delete({ where: { id: testContentId } });
    await prisma.studyGroup.delete({ where: { id: testGroupId } });
    await app.close();
  });

  describe('POST /contents/:contentId/annotations', () => {
    it('should create a highlight annotation', async () => {
      const res = await request(app.getHttpServer())
        .post(`/contents/${testContentId}/annotations`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'HIGHLIGHT',
          startOffset: 0,
          endOffset: 20,
          selectedText: 'This is test content',
          color: 'yellow',
          visibility: 'PRIVATE',
        })
        .expect(201);

      expect(res.body).toMatchObject({
        type: 'HIGHLIGHT',
        color: 'yellow',
        visibility: 'PRIVATE',
      });
      expect(res.body.id).toBeDefined();
    });

    it('should create a note annotation', async () => {
      const res = await request(app.getHttpServer())
        .post(`/contents/${testContentId}/annotations`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'NOTE',
          startOffset: 25,
          endOffset: 45,
          selectedText: 'highlight and annotate',
          text: 'This is my note about this section',
          visibility: 'PRIVATE',
        })
        .expect(201);

      expect(res.body.type).toBe('NOTE');
      expect(res.body.text).toBe('This is my note about this section');
    });

    it('should create a group annotation', async () => {
      const res = await request(app.getHttpServer())
        .post(`/contents/${testContentId}/annotations`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'HIGHLIGHT',
          startOffset: 50,
          endOffset: 60,
          selectedText: 'this text',
          color: 'green',
          visibility: 'GROUP',
          groupId: testGroupId,
        })
        .expect(201);

      expect(res.body.visibility).toBe('GROUP');
      expect(res.body.groupId).toBe(testGroupId);
    });
  });

  describe('GET /contents/:contentId/annotations', () => {
    it('should return all annotations for content', async () => {
      const res = await request(app.getHttpServer())
        .get(`/contents/${testContentId}/annotations`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('user');
    });

    it('should filter by groupId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/contents/${testContentId}/annotations?groupId=${testGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const groupAnnotations = res.body.filter((a: any) => a.groupId === testGroupId);
      expect(groupAnnotations.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /contents/:contentId/annotations/:id', () => {
    it('should update annotation text', async () => {
      // First create an annotation
      const createRes = await request(app.getHttpServer())
        .post(`/contents/${testContentId}/annotations`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'NOTE',
          startOffset: 0,
          endOffset: 10,
          text: 'Original text',
          visibility: 'PRIVATE',
        });

      const annotationId = createRes.body.id;

      // Then update it
      const updateRes = await request(app.getHttpServer())
        .put(`/contents/${testContentId}/annotations/${annotationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'Updated text' })
        .expect(200);

      expect(updateRes.body.text).toBe('Updated text');
    });
  });

  describe('DELETE /contents/:contentId/annotations/:id', () => {
    it('should delete annotation', async () => {
      // Create annotation
      const createRes = await request(app.getHttpServer())
        .post(`/contents/${testContentId}/annotations`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'HIGHLIGHT',
          startOffset: 0,
          endOffset: 5,
          color: 'blue',
          visibility: 'PRIVATE',
        });

      const annotationId = createRes.body.id;

      // Delete it
      await request(app.getHttpServer())
        .delete(`/contents/${testContentId}/annotations/${annotationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      const annotations = await prisma.annotation.findUnique({
        where: { id: annotationId },
      });
      expect(annotations).toBeNull();
    });
  });
});
