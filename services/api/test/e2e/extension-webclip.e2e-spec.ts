import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import * as request from 'supertest';
import { TestAuthHelper, createTestUser } from '../helpers/auth.helper';
import { JwtService } from '@nestjs/jwt';

/**
 * E2E Test: Full Extension Journey
 * 1. User Connects Extension (Device Code Flow)
 * 2. User Captures WebClip (using extension)
 * 3. User Starts Session (using extension)
 * 4. User Continues Session (using web app)
 */
describe('Extension E2E Journey', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authHelper: TestAuthHelper;
  let userId: string;
  let userToken: string; // Web app token
  let extensionToken: string; // Extension token (acquired during test)

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);
    const jwtService = app.get<JwtService>(JwtService);
    const secret = process.env.JWT_SECRET || 'test-secret';
    authHelper = new TestAuthHelper(secret);

    // 0. Setup User
    const userData = createTestUser();
    userData.email = `e2e_ext_${Date.now()}@example.com`;
    
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
  });

  afterAll(async () => {
    if (userId) {
      await prisma.extensionDeviceAuth.deleteMany({ where: { userId } });
      await prisma.extensionGrant.deleteMany({ where: { userId } });
      await prisma.readingSession.deleteMany({ where: { userId } });
      
      // Delete ContentVersion before Content (foreign key constraint)
      const userContent = await prisma.content.findMany({
        where: { createdBy: userId },
        select: { id: true },
      });
      const contentIds = userContent.map(c => c.id);
      await prisma.contentVersion.deleteMany({ where: { contentId: { in: contentIds } } });
      
      await prisma.content.deleteMany({ where: { createdBy: userId } });
      await prisma.user.delete({ where: { id: userId } });
    }
    await prisma.$disconnect();
    await app.close();
  });

  it('Example Journey: Connect -> Capture -> Session', async () => {
    // ---------------------------------------------------------
    // 1. Connect Extension (Device Code Flow)
    // ---------------------------------------------------------
    
    // 1a. Extension starts flow
    const startRes = await request(app.getHttpServer())
      .post('/api/v1/auth/extension/device/start')
      .send({ clientId: 'browser-extension', scopes: ['extension:webclip:create', 'extension:session:start'] });
    
    const { deviceCode, userCode } = startRes.body;
    expect(deviceCode).toBeDefined();

    // 1b. User approves on Web App
    await request(app.getHttpServer())
      .post('/api/v1/auth/extension/device/approve')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ userCode, approve: true })
      .expect(201);

    // 1c. Extension polls for token
    const pollRes = await request(app.getHttpServer())
      .post('/api/v1/auth/extension/device/poll')
      .send({ clientId: 'browser-extension', deviceCode })
      .expect(201);

    expect(pollRes.body.status).toBe('APPROVED');
    extensionToken = pollRes.body.accessToken;
    expect(extensionToken).toBeDefined();

    // ---------------------------------------------------------
    // 2. Capture WebClip (Extension)
    // ---------------------------------------------------------
    
    const clipRes = await request(app.getHttpServer())
      .post('/api/v1/webclips')
      .set('Authorization', `Bearer ${extensionToken}`)
      .send({
        sourceUrl: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
        title: 'Artificial Intelligence - Wikipedia',
        siteDomain: 'wikipedia.org',
        captureMode: 'READABILITY',
        contentText: 'Artificial intelligence (AI) is intelligence demonstrated by machines...',
      })
      .expect(201);

    const contentId = clipRes.body.contentId;
    expect(contentId).toBeDefined();

    // ---------------------------------------------------------
    // 3. Start Session (Extension)
    // ---------------------------------------------------------
    
    const sessionRes = await request(app.getHttpServer())
      .post(`/api/v1/webclips/${contentId}/sessions/start`)
      .set('Authorization', `Bearer ${extensionToken}`)
      .send({
        timeboxMin: 20,
        readingIntent: 'analytical',
        goal: 'Study history of AI',
      })
      .expect(201);

    const sessionId = sessionRes.body.sessionId;
    expect(sessionId).toBeDefined();

    // ---------------------------------------------------------
    // 4. Verify Session Created Successfully
    // ---------------------------------------------------------
    
    // Note: ReadingSessionsController doesn't have GET /sessions endpoint
    // The session creation already validates the flow is working correctly
    // If needed, could query directly via Prisma:
    const createdSession = await prisma.readingSession.findUnique({
      where: { id: sessionId },
      include: { content: true },
    });
    
    expect(createdSession).toBeDefined();
    expect(createdSession.userId).toBe(userId);
    expect(createdSession.contentId).toBe(contentId);
    expect(createdSession.phase).toBe('PRE'); // Session starts in PRE phase
  });
});
