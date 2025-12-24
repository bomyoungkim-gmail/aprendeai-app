import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AppModule } from '../../src/app.module';

describe('Sprint 1: Media Content (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Create test user and get token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'maria@example.com', password: 'demo123' });
    
    authToken = loginResponse.body.accessToken;
    testUserId = loginResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('ContentType Enum - VIDEO/AUDIO', () => {
    it('should create VIDEO content with duration', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Video Content',
          type: 'VIDEO',
          originalLanguage: 'PT_BR',
          rawText: 'Video transcription here',
          duration: 300, // 5 minutes
        })
        .expect(201);

      expect(response.body).toMatchObject({
        title: 'Test Video Content',
        type: 'VIDEO',
        duration: 300,
      });

      // Cleanup
      await prisma.content.delete({ where: { id: response.body.id } });
    });

    it('should create AUDIO content with duration', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Audio Content',
          type: 'AUDIO',
          originalLanguage: 'PT_BR',
          rawText: 'Audio transcription',
          duration: 180, // 3 minutes
        })
        .expect(201);

      expect(response.body).toMatchObject({
        title: 'Test Audio Content',
        type: 'AUDIO',
        duration: 180,
      });

      // Cleanup
      await prisma.content.delete({ where: { id: response.body.id } });
    });

    it('should reject invalid content type', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Invalid Content',
          type: 'INVALID_TYPE',
          originalLanguage: 'PT_BR',
          rawText: 'Text',
        })
        .expect(400);
    });
  });

  describe('Duration Field', () => {
    it('should accept null duration for non-media content', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'PDF Document',
          type: 'PDF',
          originalLanguage: 'PT_BR',
          rawText: 'Document text',
        })
        .expect(201);

      expect(response.body.duration).toBeNull();

      // Cleanup
      await prisma.content.delete({ where: { id: response.body.id } });
    });

    it('should update duration field', async () => {
      // Create content
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Video to Update',
          type: 'VIDEO',
          originalLanguage: 'PT_BR',
          rawText: 'Transcript',
          duration: 100,
        });

      const contentId = createResponse.body.id;

      // Update duration
      const updateResponse = await request(app.getHttpServer())
        .patch(`/api/v1/content/${contentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ duration: 200 })
        .expect(200);

      expect(updateResponse.body.duration).toBe(200);

      // Cleanup
      await prisma.content.delete({ where: { id: contentId } });
    });
  });

  describe('File.storageKey Exposure', () => {
    it('should expose file.storageKey in GET /content/:id', async () => {
      // Create file record
      const file = await prisma.file.create({
        data: {
          storageProvider: 'LOCAL',
          storageKey: 'test-video-12345.mp4',
          mimeType: 'video/mp4',
          sizeBytes: BigInt(1024000),
          checksumSha256: 'abc123',
          originalFilename: 'my-video.mp4',
        },
      });

      // Create content with file
      const content = await prisma.content.create({
        data: {
          title: 'Video with File',
          type: 'VIDEO',
          originalLanguage: 'PT_BR',
          rawText: 'Transcript',
          duration: 150,
          fileId: file.id,
        },
      });

      // GET content
      const response = await request(app.getHttpServer())
        .get(`/api/v1/content/${content.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.file).toBeDefined();
      expect(response.body.file.storageKey).toBe('test-video-12345.mp4');
      expect(response.body.file.mimeType).toBe('video/mp4');

      // Cleanup
      await prisma.content.delete({ where: { id: content.id } });
      await prisma.file.delete({ where: { id: file.id } });
    });
  });

  describe('Static File Serving', () => {
    it('should serve files from /api/uploads/', async () => {
      // Note: This assumes a test file exists at uploads/test.txt
      // In real scenario, you'd create the file programmatically
      const response = await request(app.getHttpServer())
        .get('/api/uploads/test.txt')
        .expect(200);

      // Basic check that file serving works
      expect(response.text).toBeDefined();
    });
  });
});
