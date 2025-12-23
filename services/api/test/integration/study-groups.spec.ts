import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TestAuthHelper, createTestUser } from '../helpers/auth.helper';
import { ROUTES, apiUrl } from '../helpers/routes';

describe('Study Groups API (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authHelper: TestAuthHelper;
  let authToken: string;
  let userId: string;
  let groupId: string;
  let contentId: string;
  let sessionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1'); // Match production
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    const configService = app.get<ConfigService>(ConfigService);

    // Initialize auth helper with real JWT secret
    const jwtSecret = configService.get<string>('JWT_SECRET') || 'test-secret-key';
    authHelper = new TestAuthHelper(jwtSecret);

    // Create test user
    const testUser = await prisma.user.upsert({
      where: { email: 'test-groups@example.com' },
      create: {
        email: 'test-groups@example.com',
        name: 'Test User',
        passwordHash: 'hash', // In real test, use bcrypt
        role: 'COMMON_USER',
        schoolingLevel: 'ADULT',
        status: 'ACTIVE',
      },
      update: {},
    });

    userId = testUser.id;

    // Generate real JWT token
    authToken = authHelper.generateAuthHeader({
      id: testUser.id,
      email: testUser.email,
      name: testUser.name,
    });

    // Create test content
    const testContent = await prisma.content.create({
      data: {
        title: 'Test Content for Groups',
        type: 'PDF',
        ownerUserId: userId,
        originalLanguage: 'EN',
        rawText: 'Test content for groups',
      },
    });

    contentId = testContent.id;
  });

  afterAll(async () => {
    // Cleanup
    if (groupId) {
      await prisma.groupEvent.deleteMany({ where: { sessionId: { in: await prisma.groupSession.findMany({ where: { groupId } }).then(s => s.map(x => x.id)) } } });
      await prisma.sharedCard.deleteMany({ where: { sessionId: { in: await prisma.groupSession.findMany({ where: { groupId } }).then(s => s.map(x => x.id)) } } });
      await prisma.groupRound.deleteMany({ where: { sessionId: { in: await prisma.groupSession.findMany({ where: { groupId } }).then(s => s.map(x => x.id)) } } });
      await prisma.groupSessionMember.deleteMany({ where: { sessionId: { in: await prisma.groupSession.findMany({ where: { groupId } }).then(s => s.map(x => x.id)) } } });
      await prisma.groupSession.deleteMany({ where: { groupId } });
      await prisma.groupContent.deleteMany({ where: { groupId } });
      await prisma.studyGroupMember.deleteMany({ where: { groupId } });
      await prisma.studyGroup.delete({ where: { id: groupId } });
    }
    await prisma.content.delete({ where: { id: contentId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.user.deleteMany({ where: { email: 'member2-groups@example.com' } });

    await app.close();
  });

  describe('Groups Management', () => {
    it('POST /groups - should create group', async () => {
      const res = await request(app.getHttpServer())
        .post(apiUrl('groups'))
        .set('Authorization', authToken)
        .send({ name: 'Integration Test Group' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Integration Test Group');
      expect(res.body.ownerUserId).toBe(userId);

      groupId = res.body.id;
    });

    it('GET /groups - should list user groups', async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl('groups'))
        .set('Authorization', authToken)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body.some((g: any) => g.id === groupId)).toBe(true);
    });

    it('GET /groups/:groupId - should get group details', async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl(`groups/${groupId}`))
        .set('Authorization', authToken)
        .expect(200);

      expect(res.body.id).toBe(groupId);
      expect(res.body.name).toBe('Integration Test Group');
      expect(res.body.members).toBeDefined();
      expect(res.body.members.length).toBeGreaterThan(0);
      expect(res.body.members[0].role).toBe('OWNER');
    });

    it('POST /groups/:groupId/members/invite - should invite member', async () => {
      // Create another test user
      const user2 = await prisma.user.upsert({
        where: { email: 'user2-groups@example.com' },
        create: {
          email: 'user2-groups@example.com',
          name: 'User 2',
          passwordHash: 'hash',
          role: 'COMMON_USER',
          schoolingLevel: 'ADVANCED_USER',
          status: 'ACTIVE',
        },
        update: {},
      });

      await request(app.getHttpServer())
        .post(apiUrl(`groups/${groupId}/members/invite`))
        .set('Authorization', authToken)
        .send({ userId: user2.id, role: 'MEMBER' })
        .expect(201);

      // Verify member was invited
      const member = await prisma.studyGroupMember.findUnique({
        where: { groupId_userId: { groupId, userId: user2.id } },
      });

      expect(member).toBeDefined();
      expect(member!.status).toBe('INVITED');

      // Cleanup
      await prisma.studyGroupMember.delete({
        where: { groupId_userId: { groupId, userId: user2.id } },
      });
      await prisma.user.delete({ where: { id: user2.id } });
    });

    it('POST /groups/:groupId/contents - should add content', async () => {
      await request(app.getHttpServer())
        .post(apiUrl(`groups/${groupId}/contents`))
        .set('Authorization', authToken)
        .send({ contentId })
        .expect(201);

      // Verify content was added
      const groupContent = await prisma.groupContent.findUnique({
        where: { groupId_contentId: { groupId, contentId } },
      });

      expect(groupContent).toBeDefined();
    });

    it('DELETE /groups/:groupId/contents/:contentId - should remove content', async () => {
      // Add another content first
      const content2 = await prisma.content.create({
        data: {
          title: 'Content 2',
          type: 'PDF',
          ownerUserId: userId,
          originalLanguage: 'EN',
          rawText: 'Test content 2 text',
        },
      });

      await prisma.groupContent.create({
        data: { groupId, contentId: content2.id, addedByUserId: userId },
      });

      await request(app.getHttpServer())
        .delete(apiUrl(`groups/${groupId}/contents/${content2.id}`))
        .set('Authorization', authToken)
        .expect(200);

      // Verify content was removed
      const groupContent = await prisma.groupContent.findUnique({
        where: { groupId_contentId: { groupId, contentId: content2.id } },
      });

      expect(groupContent).toBeNull();

      // Cleanup
      await prisma.content.delete({ where: { id: content2.id } });
    });
  });

  describe('Group Sessions', () => {
    beforeAll(async () => {
      // Ensure we have at least 2 members for session creation
      const user2 = await prisma.user.upsert({
        where: { email: 'member2-groups@example.com' },
        create: {
          email: 'member2-groups@example.com',
          name: 'Member 2',
          passwordHash: 'hash',
          role: 'COMMON_USER',
          schoolingLevel: 'ADULT',
          status: 'ACTIVE',
        },
        update: {},
      });

      await prisma.studyGroupMember.upsert({
        where: { groupId_userId: { groupId, userId: user2.id } },
        create: {
          groupId,
          userId: user2.id,
          role: 'MEMBER',
          status: 'ACTIVE',
        },
        update: { status: 'ACTIVE' },
      });
    });

    it('POST /group-sessions - should create session', async () => {
      const res = await request(app.getHttpServer())
        .post(apiUrl(`group-sessions?groupId=${groupId}`))
        .set('Authorization', authToken)
        .send({
          contentId,
          mode: 'PI_SPRINT',
          layer: 'L1',
          roundsCount: 2,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.groupId).toBe(groupId);
      expect(res.body.contentId).toBe(contentId);
      expect(res.body.status).toBe('CREATED');
      expect(res.body.rounds).toBeDefined();
      expect(res.body.rounds.length).toBe(2);
      expect(res.body.members).toBeDefined();
      expect(res.body.members.length).toBeGreaterThanOrEqual(2);

      sessionId = res.body.id;

      // Verify role assignments
      const roles = res.body.members.map((m: any) => m.assignedRole);
      expect(roles).toContain('FACILITATOR');
    });

    it('GET /group-sessions/:sessionId - should get session details', async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl(`group-sessions/${sessionId}`))
        .set('Authorization', authToken)
        .expect(200);

      expect(res.body.id).toBe(sessionId);
      expect(res.body.rounds).toBeDefined();
    });

    it('PUT /group-sessions/:sessionId/start - should start session', async () => {
      await request(app.getHttpServer())
        .put(apiUrl(`group-sessions/${sessionId}/start`))
        .set('Authorization', authToken)
        .expect(200);

      // Verify session status changed
      const session = await prisma.groupSession.findUnique({
        where: { id: sessionId },
      });

      expect(session!.status).toBe('RUNNING');
    });

    it('POST /group-sessions/:sessionId/events - should submit vote', async () => {
      await request(app.getHttpServer())
        .post(apiUrl(`group-sessions/${sessionId}/events`))
        .set('Authorization', authToken)
        .send({
          roundIndex: 1,
          eventType: 'PI_VOTE_SUBMIT',
          payload: { choice: 'A', rationale: 'Because it makes sense' },
        })
        .expect(201);

      // Verify event was created
      const events = await prisma.groupEvent.findMany({
        where: { sessionId, eventType: 'PI_VOTE_SUBMIT' },
      });

      expect(events.length).toBeGreaterThan(0);
    });

    it('POST /group-sessions/:sessionId/rounds/:roundIndex/advance - should block with 409 if incomplete', async () => {
      const res = await request(app.getHttpServer())
        .post(apiUrl(`group-sessions/${sessionId}/rounds/1/advance`))
        .set('Authorization', authToken)
        .send({ toStatus: 'DISCUSSING' })
        .expect(409);

      expect(res.body.statusCode).toBe(409);
      expect(res.body.message).toContain("haven't PI_VOTE_SUBMIT");
      expect(res.body).toHaveProperty('required');
      expect(res.body).toHaveProperty('current');
      expect(res.body).toHaveProperty('missing');
    });

    it('POST /group-sessions/:sessionId/rounds/:roundIndex/advance - should advance after all vote', async () => {
      // Get all members and submit votes for them
      const session = await prisma.groupSession.findUnique({
        where: { id: sessionId },
        include: { members: true, rounds: true },
      });

      // Submit votes for all members who haven't voted
      for (const member of session!.members) {
        const hasVoted = await prisma.groupEvent.findFirst({
          where: {
            sessionId,
            userId: member.userId,
            eventType: 'PI_VOTE_SUBMIT',
            round: { roundIndex: 1 },
          },
        });

        if (!hasVoted) {
          await prisma.groupEvent.create({
            data: {
              sessionId,
              userId: member.userId,
              roundId: session!.rounds[0].id,
              eventType: 'PI_VOTE_SUBMIT',
              payloadJson: { choice: 'A' },
            },
          });
        }
      }

      await request(app.getHttpServer())
        .post(apiUrl(`group-sessions/${sessionId}/rounds/1/advance`))
        .set('Authorization', authToken)
        .send({ toStatus: 'DISCUSSING' })
        .expect(201);

      // Verify round status changed
      const round = await prisma.groupRound.findFirst({
        where: { sessionId, roundIndex: 1 },
      });

      expect(round!.status).toBe('DISCUSSING');
    });

    it('GET /group-sessions/:sessionId/events - should get events', async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl(`group-sessions/${sessionId}/events?roundIndex=1`))
        .set('Authorization', authToken)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('GET /group-sessions/:sessionId/shared-cards - should get shared cards', async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl(`group-sessions/${sessionId}/shared-cards`))
        .set('Authorization', authToken)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      // May be empty if no explanation submitted yet
    });
  });

  describe('Permission Tests', () => {
    it('should reject unauthorized access (no token)', async () => {
      await request(app.getHttpServer())
        .get(apiUrl('groups'))
        .expect(401);
    });

    it('should reject MEMBER trying to invite', async () => {
      // Create a MEMBER user
      // Create a MEMBER user
      const memberUser = await prisma.user.upsert({
        where: { email: 'member-only@example.com' },
        create: {
          email: 'member-only@example.com',
          name: 'Member Only',
          passwordHash: 'hash',
          role: 'COMMON_USER',
          schoolingLevel: 'ADULT',
          status: 'ACTIVE',
        },
        update: {},
      });

      await prisma.studyGroupMember.create({
        data: {
          groupId,
          userId: memberUser.id,
          role: 'MEMBER',
          status: 'ACTIVE',
        },
      });

      // Generate real JWT for member user
      const memberToken = authHelper.generateAuthHeader({
        id: memberUser.id,
        email: memberUser.email,
        name: memberUser.name,
      });

      await request(app.getHttpServer())
        .post(apiUrl(`groups/${groupId}/members/invite`))
        .set('Authorization', memberToken)
        .send({ userId: 'some-user-id', role: 'MEMBER' })
        .expect(403);

      // Cleanup
      await prisma.studyGroupMember.delete({
        where: { groupId_userId: { groupId, userId: memberUser.id } },
      });
      await prisma.user.delete({ where: { id: memberUser.id } });
    });

    it('should reject expired JWT token', async () => {
      const expiredToken = authHelper.generateExpiredToken({
        id: userId,
        email: 'test-groups@example.com',
        name: 'Test User',
      });

      await request(app.getHttpServer())
        .get(apiUrl('groups'))
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should reject invalid JWT token', async () => {
      await request(app.getHttpServer())
        .get(apiUrl('groups'))
        .set('Authorization', 'Bearer invalid-token-12345')
        .expect(401);
    });
  });
});

