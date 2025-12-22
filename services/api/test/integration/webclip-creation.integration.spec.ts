import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import * as request from 'supertest';
import { TestAuthHelper, createTestUser } from '../helpers/auth.helper';
import { JwtService } from '@nestjs/jwt';

describe('WebClip Creation Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authHelper: TestAuthHelper;
  let userId: string;
  let extensionToken: string;
  let userToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
    
    // Auth Helper
    const jwtService = app.get<JwtService>(JwtService);
    const secret = process.env.JWT_SECRET || 'test-secret';
    authHelper = new TestAuthHelper(secret);

    // Create User
    const userData = createTestUser();
    userData.email = `webclip_test_${Date.now()}@example.com`;
    
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        passwordHash: 'hash',
        role: 'COMMON_USER',
        status: 'ACTIVE',
        schoolingLevel: 'HIGHER_EDUCATION',
      },
    });
    
    userId = user.id;
    userToken = authHelper.generateToken({ ...userData, id: user.id });

    // Generate Extension Token (simulating device flow result)
    // Manually create JWT with specific scopes
    extensionToken = jwtService.sign({
      sub: userId,
      email: userData.email,
      role: 'COMMON_USER', // Usually not present in extension token, but good for guard compat
      scopes: ['extension:webclip:create', 'extension:session:start'],
      clientId: 'browser-extension',
    });
  });

  afterAll(async () => {
    if (userId) {
      await prisma.content.deleteMany({ where: { createdBy: userId } });
      await prisma.readingSession.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    }
    await prisma.$disconnect();
    await app.close();
  });

  describe('WebClip Creation', () => {
    it('should create WebClip with valid extension token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/webclips')
        .set('Authorization', `Bearer ${extensionToken}`)
        .send({
          sourceUrl: 'https://example.com/article',
          title: 'Test Article',
          siteDomain: 'example.com',
          captureMode: 'READABILITY',
          contentText: 'Full article content here...',
          selectionText: 'Only selected text',
          languageHint: 'PT',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe('WEB_CLIP');
      expect(response.body.metadata.sourceUrl).toBe('https://example.com/article');
    });

    it('should reject creation without required scope', async () => {
      // Create token without webclip scope
      const jwtService = app.get<JwtService>(JwtService);
      const weakToken = jwtService.sign({
        sub: userId,
        scopes: ['extension:session:start'], // Missing webclip:create
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/webclips')
        .set('Authorization', `Bearer ${weakToken}`)
        .send({
          sourceUrl: 'https://example.com',
          title: 'Fail',
          siteDomain: 'example.com',
          captureMode: 'SELECTION',
        });

      expect(response.status).toBe(403); // Forbidden
    });
  });

  describe('Session Start', () => {
    let contentId: string;

    beforeAll(async () => {
      // Create content first
      const content = await prisma.content.create({
        data: {
          type: 'WEB_CLIP',
          title: 'Session Content',
          creator: { connect: { id: userId } },
          scopeType: 'USER',
          originalLanguage: 'PT_BR',
          rawText: 'Test content for session',
        },
      });
      contentId = content.id;
    });

    it('should start session with valid extension token', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/webclips/${contentId}/sessions/start`)
        .set('Authorization', `Bearer ${extensionToken}`)
        .send({
          timeboxMin: 15,
          readingIntent: 'inspectional',
          goal: 'Understand the main idea',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('initialPrompt');
      expect(response.body.initialPrompt).toContain('15 minutos');
    });
  });
});
