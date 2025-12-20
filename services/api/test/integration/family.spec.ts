import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Family Plan (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let ownerUserId: string;
  let familyId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up test data
    await prisma.familyMember.deleteMany({});
    await prisma.family.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { contains: '@family-test.com' } },
    });
  });

  afterAll(async () => {
    // Clean up after tests
    await prisma.familyMember.deleteMany({});
    await prisma.family.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { contains: '@family-test.com' } },
    });
    
    await app.close();
  });

  describe('Authentication Setup', () => {
    it('should register and login owner user', async () => {
      // Register
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'owner@family-test.com',
          password: 'Test123!@#',
          name: 'Family Owner',
          role: 'COMMON_USER',
          schoolingLevel: 'UNDERGRADUATE',
        })
        .expect(201);

      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'owner@family-test.com',
          password: 'Test123!@#',
        })
        .expect(200);

      authToken = loginResponse.body.accessToken;
      ownerUserId = loginResponse.body.user.id;
      
      expect(authToken).toBeDefined();
    });
  });

  describe('POST /families', () => {
    it('should create family with current user as owner', async () => {
      const response = await request(app.getHttpServer())
        .post('/families')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Family',
        })
        .expect(201);

      familyId = response.body.id;

      expect(response.body).toMatchObject({
        name: 'Test Family',
        ownerId: ownerUserId,
      });
    });

    it('should create owner membership record', async () => {
      const members = await prisma.familyMember.findMany({
        where: { familyId },
      });

      expect(members).toHaveLength(1);
      expect(members[0]).toMatchObject({
        userId: ownerUserId,
        role: 'OWNER',
        status: 'ACTIVE',
      });
    });

    it('should return family with members array', async () => {
      const response = await request(app.getHttpServer())
        .get(`/families/${familyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.members).toBeDefined();
      expect(response.body.members).toHaveLength(1);
      expect(response.body.members[0].role).toBe('OWNER');
    });
  });

  describe('GET /families', () => {
    it('should list all families user belongs to', async () => {
      const response = await request(app.getHttpServer())
        .get('/families')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Test Family');
    });
  });

  describe('POST /families/:id/invite', () => {
    it('should add existing user as GUARDIAN', async () => {
      // Create existing user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'existing@family-test.com',
          password: 'Test123!@#',
          name: 'Existing User',
          role: 'COMMON_USER',
          schoolingLevel: 'UNDERGRADUATE',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post(`/families/${familyId}/invite`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'existing@family-test.com',
          role: 'GUARDIAN',
        })
        .expect(201);

      expect(response.body.message).toContain('invited');

      // Verify membership created
      const existingUser = await prisma.user.findUnique({
        where: { email: 'existing@family-test.com' },
      });

      const membership = await prisma.familyMember.findUnique({
        where: {
          familyId_userId: {
            familyId,
            userId: existingUser.id,
          },
        },
      });

      expect(membership).toBeDefined();
      expect(membership.role).toBe('GUARDIAN');
    });

    it('should create placeholder user for new email', async () => {
      const response = await request(app.getHttpServer())
        .post(`/families/${familyId}/invite`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'newuser@family-test.com',
          displayName: 'New User',
          role: 'CHILD',
        })
        .expect(201);

      expect(response.body.message).toContain('invited');

      // Verify placeholder user created
      const newUser = await prisma.user.findUnique({
        where: { email: 'newuser@family-test.com' },
      });

      expect(newUser).toBeDefined();
      expect(newUser.passwordHash).toBe('PENDING_INVITE');
      expect(newUser.name).toBe('New User');
    });

    it('should reject duplicate invitations', async () => {
      await request(app.getHttpServer())
        .post(`/families/${familyId}/invite`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'existing@family-test.com',
          role: 'GUARDIAN',
        })
        .expect(400);
    });

    it('should only allow owner to invite members', async () => {
      // Login as non-owner
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'nonowner@family-test.com',
          password: 'Test123!@#',
          name: 'Non Owner',
          role: 'COMMON_USER',
          schoolingLevel: 'UNDERGRADUATE',
        });

      const nonOwnerLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonowner@family-test.com',
          password: 'Test123!@#',
        });

      const nonOwnerToken = nonOwnerLogin.body.accessToken;

      await request(app.getHttpServer())
        .post(`/families/${familyId}/invite`)
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .send({
          email: 'another@family-test.com',
          role: 'CHILD',
        })
        .expect(403);
    });
  });

  describe('POST /families/:id/transfer-ownership', () => {
    let memberUserId: string;

    beforeAll(async () => {
      const existingUser = await prisma.user.findUnique({
        where: { email: 'existing@family-test.com' },
      });
      memberUserId = existingUser.id;
    });

    it('should transfer ownership to existing member', async () => {
      const response = await request(app.getHttpServer())
        .post(`/families/${familyId}/transfer-ownership`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          newOwnerId: memberUserId,
        })
        .expect(200);

      expect(response.body.message).toContain('transferred');

      // Verify family ownerId updated
      const family = await prisma.family.findUnique({
        where: { id: familyId },
      });
      expect(family.ownerId).toBe(memberUserId);

      // Verify old owner downgraded to GUARDIAN
      const oldOwnerMembership = await prisma.familyMember.findUnique({
        where: {
          familyId_userId: { familyId, userId: ownerUserId },
        },
      });
      expect(oldOwnerMembership.role).toBe('GUARDIAN');

      // Verify new owner upgraded to OWNER
      const newOwnerMembership = await prisma.familyMember.findUnique({
        where: {
          familyId_userId: { familyId, userId: memberUserId },
        },
      });
      expect(newOwnerMembership.role).toBe('OWNER');
    });

    it('should prevent non-owner from transferring', async () => {
      // Try to transfer back using old owner token (now just a guardian)
      await request(app.getHttpServer())
        .post(`/families/${familyId}/transfer-ownership`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          newOwnerId: ownerUserId,
        })
        .expect(403);
    });

    afterAll(async () => {
      // Transfer ownership back for other tests
      const newOwnerLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'existing@family-test.com',
          password: 'Test123!@#',
        });

      await request(app.getHttpServer())
        .post(`/families/${familyId}/transfer-ownership`)
        .set('Authorization', `Bearer ${newOwnerLogin.body.accessToken}`)
        .send({
          newOwnerId: ownerUserId,
        })
        .expect(200);
    });
  });

  describe('POST /families/:id/primary', () => {
    it('should set family as primary for user', async () => {
      const response = await request(app.getHttpServer())
        .post(`/families/${familyId}/primary`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('primary');

      // Verify user settings updated
      const user = await prisma.user.findUnique({
        where: { id: ownerUserId },
      });

      expect(user.settings).toHaveProperty('primaryFamilyId', familyId);
    });

    it('should only allow family members to set as primary', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'outsider@family-test.com',
          password: 'Test123!@#',
          name: 'Outsider',
          role: 'COMMON_USER',
          schoolingLevel: 'UNDERGRADUATE',
        });

      const outsiderLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'outsider@family-test.com',
          password: 'Test123!@#',
        });

      await request(app.getHttpServer())
        .post(`/families/${familyId}/primary`)
        .set('Authorization', `Bearer ${outsiderLogin.body.accessToken}`)
        .expect(400);
    });
  });

  describe('GET /families/:id/billing-hierarchy', () => {
    it('should resolve to primary family', async () => {
      const response = await request(app.getHttpServer())
        .get(`/families/${familyId}/billing-hierarchy`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.scopeType).toBe('FAMILY');
      expect(response.body.scopeId).toBe(familyId);
    });

    it('should fall back to user scope if no families', async () => {
      const outsiderLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'outsider@family-test.com',
          password: 'Test123!@#',
        });

      const response = await request(app.getHttpServer())
        .get(`/families/any-id/billing-hierarchy`)
        .set('Authorization', `Bearer ${outsiderLogin.body.accessToken}`)
        .expect(200);

      expect(response.body.scopeType).toBe('USER');
    });
  });

  describe('DELETE /families/:id', () => {
    let tempFamilyId: string;

    beforeAll(async () => {
      // Create a temporary family to delete
      const response = await request(app.getHttpServer())
        .post('/families')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Temp Family',
        });

      tempFamilyId = response.body.id;
    });

    it('should delete family and all members', async () => {
      await request(app.getHttpServer())
        .delete(`/families/${tempFamilyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify family deleted
      const family = await prisma.family.findUnique({
        where: { id: tempFamilyId },
      });
      expect(family).toBeNull();

      // Verify members deleted
      const members = await prisma.familyMember.findMany({
        where: { familyId: tempFamilyId },
      });
      expect(members).toHaveLength(0);
    });

    it('should only allow owner to delete family', async () => {
      const newOwnerLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'existing@family-test.com',
          password: 'Test123!@#',
        });

      await request(app.getHttpServer())
        .delete(`/families/${familyId}`)
        .set('Authorization', `Bearer ${newOwnerLogin.body.accessToken}`)
        .expect(403);
    });

    it('should return 404 if family does not exist', async () => {
      await request(app.getHttpServer())
        .delete(`/families/non-existent-id`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Multi-Family Scenarios', () => {
    let secondFamilyId: string;

    it('should create second family', async () => {
      const response = await request(app.getHttpServer())
        .post('/families')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Second Family',
        })
        .expect(201);

      secondFamilyId = response.body.id;
      expect(response.body.name).toBe('Second Family');
    });

    it('should list both families', async () => {
      const response = await request(app.getHttpServer())
        .get('/families')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(2);
      const familyNames = response.body.map(f => f.name);
      expect(familyNames).toContain('Test Family');
      expect(familyNames).toContain('Second Family');
    });

    it('should switch primary family', async () => {
      await request(app.getHttpServer())
        .post(`/families/${secondFamilyId}/primary`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const user = await prisma.user.findUnique({
        where: { id: ownerUserId },
      });

      expect(user.settings['primaryFamilyId']).toBe(secondFamilyId);
    });

    it('should resolve billing to new primary family', async () => {
      const response = await request(app.getHttpServer())
        .get(`/families/${secondFamilyId}/billing-hierarchy`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.scopeId).toBe(secondFamilyId);
    });
  });
});
