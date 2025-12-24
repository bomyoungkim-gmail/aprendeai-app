import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AppModule } from '../../src/app.module';
import * as bcrypt from 'bcrypt';

describe('Institution Admin Dashboard (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let institutionAdminId: string;
  let institutionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up
    await prisma.institutionMember.deleteMany({});
    await prisma.institution.deleteMany({ where: { name: { contains: 'Test Institution Admin' } } });
    await prisma.user.deleteMany({ where: { email: { contains: '@inst-admin-test.com' } } });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Setup: Create Institution Admin', () => {
    it('should register institution admin user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'admin@inst-admin-test.com',
          password: 'Test123!',
          name: 'Test Admin',
        })
        .expect(201);

      expect(res.body).toHaveProperty('access_token');
      authToken = res.body.access_token;
      institutionAdminId = res.body.user.id;
    });

    it('should create institution', async () => {
      const institution = await prisma.institution.create({
        data: {
          name: 'Test Institution Admin School',
          type: 'SCHOOL',
          city: 'Test City',
          state: 'TC',
        },
      });
      institutionId = institution.id;

      // Make user an INSTITUTION_ADMIN
      await prisma.institutionMember.create({
        data: {
          institutionId,
          userId: institutionAdminId,
          role: 'INSTITUTION_ADMIN',
          status: 'ACTIVE',
        },
      });

      // Update user role
      await prisma.user.update({
        where: { id: institutionAdminId },
        data: { role: 'INSTITUTION_ADMIN' },
      });

      expect(institution).toBeDefined();
    });
  });

  describe('GET /institutions/my-institution', () => {
    it('should return institution data with stats', async () => {
      // Add some test data
      await prisma.institutionInvite.create({
        data: {
          institutionId,
          email: 'invited@test.com',
          role: 'TEACHER',
          token: 'test-token-123',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          inviterId: institutionAdminId,
        },
      });

      await prisma.institutionDomain.create({
        data: {
          institutionId,
          domain: '@test-admin.edu',
          autoApprove: true,
          defaultRole: 'STUDENT',
        },
      });

      const res = await request(app.getHttpServer())
        .get('/institutions/my-institution')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: institutionId,
        name: 'Test Institution Admin School',
        type: 'SCHOOL',
        city: 'Test City',
        state: 'TC',
      });

      expect(res.body).toHaveProperty('memberCount');
      expect(res.body).toHaveProperty('activeInvites');
      expect(res.body).toHaveProperty('pendingApprovals');
      expect(res.body).toHaveProperty('domains');

      expect(res.body.memberCount).toBeGreaterThanOrEqual(1);
      expect(res.body.activeInvites).toBeGreaterThanOrEqual(1);
      expect(res.body.domains).toContain('@test-admin.edu');
    });

    it('should return 401 for unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get('/institutions/my-institution')
        .expect(401);
    });

    it('should return error for non-institution-admin users', async () => {
      // Create a regular user
      const regularUserRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'regular@inst-admin-test.com',
          password: 'Test123!',
          name: 'Regular User',
        })
        .expect(201);

      const regularUserToken = regularUserRes.body.access_token;

      const res = await request(app.getHttpServer())
        .get('/institutions/my-institution')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(500); // Should return error because user is not an institution admin

      expect(res.body.message).toContain('User is not an institution admin');
    });
  });
});
