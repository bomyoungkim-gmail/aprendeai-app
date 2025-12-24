import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ROUTES, apiUrl } from '../../src/common/constants/routes.constants';

describe('Institutional Registration (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let adminUserId: string;
  let institutionId: string;
  let inviteToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');

    const { ValidationPipe } = await import('@nestjs/common');
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    // Clean up test data
    await prisma.institutionMember.deleteMany({});
    await prisma.institutionInvite.deleteMany({});
    await prisma.institutionDomain.deleteMany({});
    await prisma.pendingUserApproval.deleteMany({});
    await prisma.institution.deleteMany({ where: { name: { contains: 'Test Institution' } } });
    await prisma.user.deleteMany({ where: { email: { contains: '@inst-test.com' } } });
    
    // Ensure FREE plan exists
    await prisma.plan.upsert({
      where: { code: 'FREE' },
      update: {},
      create: {
        code: 'FREE',
        name: 'Free Plan',
        description: 'Basic access',
        entitlements: {},
        monthlyPrice: 0,
        yearlyPrice: 0,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.institutionMember.deleteMany({});
    await prisma.institutionInvite.deleteMany({});
    await prisma.institutionDomain.deleteMany({});
    await prisma.pendingUserApproval.deleteMany({});
    await prisma.institution.deleteMany({ where: { name: { contains: 'Test Institution' } } });
    await prisma.user.deleteMany({ where: { email: { contains: '@inst-test.com' } } });

    await app.close();
  });

  describe('Setup: Create Admin User and Institution', () => {
    it('should register admin user', async () => {
      await request(app.getHttpServer())
        .post(apiUrl(ROUTES.AUTH.REGISTER))
        .send({
          email: 'admin@inst-test.com',
          password: 'Test123!@#',
          name: 'Institution Admin',
          role: 'ADMIN',
        })
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.AUTH.LOGIN))
        .send({
          email: 'admin@inst-test.com',
          password: 'Test123!@#',
        })
        .expect(201);

      adminToken = loginResponse.body.access_token;
      adminUserId = loginResponse.body.user.id;

      expect(adminToken).toBeDefined();
    });

    it('should create institution', async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.INSTITUTIONS.CREATE))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Institution',
          type: 'SCHOOL',
          city: 'São Paulo',
          state: 'SP',
          requiresApproval: false,
        })
        .expect(201);

      institutionId = response.body.id;
      expect(response.body.name).toBe('Test Institution');
    });
  });

  describe('POST /institutions/:id/invites - Invite Flow', () => {
    it('should create institution invite', async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.INSTITUTIONS.CREATE_INVITE(institutionId)))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'teacher@inst-test.com',
          role: 'TEACHER',
          expiresInDays: 7,
        })
        .expect(201);

      expect(response.body).toHaveProperty('inviteUrl');
      expect(response.body.email).toBe('teacher@inst-test.com');

      // Extract token from URL
      const urlMatch = response.body.inviteUrl.match(/token=([^&]+)/);
      inviteToken = urlMatch ? urlMatch[1] : null;
      expect(inviteToken).toBeDefined();
    });

    it('should register user with invite token', async () => {
      const registerResponse = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.AUTH.REGISTER))
        .send({
          email: 'teacher@inst-test.com',
          password: 'Test123!@#',
          name: 'Teacher User',
        })
        .query({ inviteToken }) // Pass token as query param
        .expect(201);

      expect(registerResponse.body.email).toBe('teacher@inst-test.com');

      // Verify InstitutionMember was created
      const member = await prisma.institutionMember.findFirst({
        where: {
          userId: registerResponse.body.id,
          institutionId,
        },
      });

      expect(member).toBeDefined();
      expect(member.role).toBe('TEACHER');
      expect(member.status).toBe('ACTIVE');
    });

    it('should mark invite as used', async () => {
      const invite = await prisma.institutionInvite.findUnique({
        where: { token: inviteToken },
      });

      expect(invite.usedAt).not.toBeNull();
    });
  });

  describe('POST /institutions/:id/domains - Domain Flow', () => {
    it('should add domain with auto-approve', async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.INSTITUTIONS.ADD_DOMAIN(institutionId)))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          domain: '@inst-test.com',
          autoApprove: true,
          defaultRole: 'STUDENT',
        })
        .expect(201);

      expect(response.body.domain).toBe('@inst-test.com');
      expect(response.body.autoApprove).toBe(true);
    });

    it('should auto-approve registration for domain email', async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.AUTH.REGISTER))
        .send({
          email: 'student@inst-test.com',
          password: 'Test123!@#',
          name: 'Student User',
        })
        .expect(201);

      expect(response.body.email).toBe('student@inst-test.com');

      // Verify InstitutionMember was created with default role
      const member = await prisma.institutionMember.findFirst({
        where: {
          userId: response.body.id,
          institutionId,
        },
      });

      expect(member).toBeDefined();
      expect(member.role).toBe('STUDENT');
      expect(member.status).toBe('ACTIVE');
    });
  });

  describe('POST /institutions/:id/pending - Manual Approval Flow', () => {
    let pendingApprovalId: string;

    beforeAll(async () => {
      // Update institution to require approval
      await prisma.institution.update({
        where: { id: institutionId },
        data: { requiresApproval: true },
      });

      // Update domain to NOT auto-approve
      await prisma.institutionDomain.update({
        where: { domain: '@inst-test.com' },
        data: { autoApprove: false },
      });
    });

    it('should create pending approval instead of user', async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.AUTH.REGISTER))
        .send({
          email: 'pending@inst-test.com',
          password: 'Test123!@#',
          name: 'Pending User',
        })
        .expect(201);

      expect(response.body.status).toBe('pending_approval');
      expect(response.body.approvalId).toBeDefined();

      pendingApprovalId = response.body.approvalId;

      // Verify PendingUserApproval was created
      const pending = await prisma.pendingUserApproval.findUnique({
        where: { id: pendingApprovalId },
      });

      expect(pending).toBeDefined();
      expect(pending.email).toBe('pending@inst-test.com');
      expect(pending.status).toBe('PENDING');
    });

    it('should list pending approvals', async () => {
      const response = await request(app.getHttpServer())
        .get(apiUrl(ROUTES.INSTITUTIONS.PENDING(institutionId)))
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('email', 'pending@inst-test.com');
    });

    it('should approve pending user', async () => {
      await request(app.getHttpServer())
        .post(apiUrl(ROUTES.INSTITUTIONS.PROCESS_APPROVAL(institutionId, pendingApprovalId)))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          approve: true,
        })
        .expect(200);

      // Verify User was created
      const user = await prisma.user.findUnique({
        where: { email: 'pending@inst-test.com' },
      });

      expect(user).toBeDefined();
      expect(user.status).toBe('ACTIVE');

      // Verify InstitutionMember was created
      const member = await prisma.institutionMember.findFirst({
        where: {
          userId: user.id,
          institutionId,
        },
      });

      expect(member).toBeDefined();
      expect(member.status).toBe('ACTIVE');

      // Verify approval status updated
      const approval = await prisma.pendingUserApproval.findUnique({
        where: { id: pendingApprovalId },
      });

      expect(approval.status).toBe('APPROVED');
      expect(approval.reviewedBy).toBe(adminUserId);
    });
  });

  describe('DELETE /institutions/:id/invites/:inviteId - Cancel Invite', () => {
    let cancelInviteId: string;

    beforeAll(async () => {
      // Create invite to cancel
      const response = await request(app.getHttpServer())
        .post(apiUrl(ROUTES.INSTITUTIONS.CREATE_INVITE(institutionId)))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'cancelled@inst-test.com',
          role: 'TEACHER',
        })
        .expect(201);

      cancelInviteId = response.body.id;
    });

    it('should cancel invitation', async () => {
      await request(app.getHttpServer())
        .delete(apiUrl(ROUTES.INSTITUTIONS.CANCEL_INVITE(institutionId, cancelInviteId)))
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify invite was deleted
      const invite = await prisma.institutionInvite.findUnique({
        where: { id: cancelInviteId },
      });

      expect(invite).toBeNull();
    });
  });

  describe('GET /institutions/:id/invites - List Invites', () => {
    it('should list all invites for institution', async () => {
      const response = await request(app.getHttpServer())
        .get(apiUrl(ROUTES.INSTITUTIONS.INVITES(institutionId)))
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Should have teacher@inst-test.com invite (used)
      const teacherInvite = response.body.find(i => i.email === 'teacher@inst-test.com');
      expect(teacherInvite).toBeDefined();
      expect(teacherInvite.usedAt).not.toBeNull();
    });
  });

  describe('GET /institutions/:id/domains - List Domains', () => {
    it('should list all domains for institution', async () => {
      const response = await request(app.getHttpServer())
        .get(apiUrl(ROUTES.INSTITUTIONS.DOMAINS(institutionId)))
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].domain).toBe('@inst-test.com');
    });
  });
});
