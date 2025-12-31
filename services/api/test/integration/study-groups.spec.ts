import { ShareContextType, ContextRole } from "@prisma/client";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/prisma/prisma.service";
import { TestAuthHelper } from "../helpers/auth.helper";
import { apiUrl } from "../helpers/routes";

describe("Study Groups API (Integration)", () => {
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
    app.setGlobalPrefix("api/v1"); // Match production
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    const configService = app.get<ConfigService>(ConfigService);

    // Initialize auth helper with real JWT secret
    const jwtSecret =
      configService.get<string>("JWT_SECRET") || "test-secret-key";
    authHelper = new TestAuthHelper(jwtSecret);

    // Create test user
    const testUser = await prisma.users.upsert({
      where: { email: "test-groups@example.com" },
      create: {
        email: "test-groups@example.com",
        name: "Test User",
        password_hash: "hash", // In real test, use bcrypt
        last_context_role: ContextRole.STUDENT,
        schooling_level: "ADULT",
        status: "ACTIVE",
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
    const testContent = await prisma.contents.create({
      data: {
        id: "test-content-1",
        title: "Test Content for Groups",
        type: "PDF",
        users_owner: { connect: { id: userId } },
        original_language: "EN",
        raw_text: "Test content for groups",
      },
    });

    contentId = testContent.id;
  });

  afterAll(async () => {
    // Cleanup
    if (groupId) {
      // Delete in correct order for foreign keys
      await prisma.group_chat_messages.deleteMany({
        where: {
          session_id: {
            in: await prisma.group_sessions
              .findMany({ where: { group_id: groupId } })
              .then((s) => s.map((x) => x.id)),
          },
        },
      });
      await prisma.group_events.deleteMany({
        where: {
          session_id: {
            in: await prisma.group_sessions
              .findMany({ where: { group_id: groupId } })
              .then((s) => s.map((x) => x.id)),
          },
        },
      });
      await prisma.shared_cards.deleteMany({
        where: {
          session_id: {
            in: await prisma.group_sessions
              .findMany({ where: { group_id: groupId } })
              .then((s) => s.map((x) => x.id)),
          },
        },
      });
      await prisma.group_rounds.deleteMany({
        where: {
          session_id: {
            in: await prisma.group_sessions
              .findMany({ where: { group_id: groupId } })
              .then((s) => s.map((x) => x.id)),
          },
        },
      });
      await prisma.group_session_members.deleteMany({
        where: {
          session_id: {
            in: await prisma.group_sessions
              .findMany({ where: { group_id: groupId } })
              .then((s) => s.map((x) => x.id)),
          },
        },
      });
      await prisma.group_sessions.deleteMany({ where: { group_id: groupId } });
      await prisma.content_shares.deleteMany({
        where: {
          context_id: groupId,
          context_type: ShareContextType.STUDY_GROUP,
        },
      });
      await prisma.study_group_members.deleteMany({
        where: { group_id: groupId },
      });

      await prisma.study_groups.delete({ where: { id: groupId } });
    } else {
      // Fallback cleanup by email to avoid FX violations if groupId was never set
      const testUser = await prisma.users.findUnique({
        where: { email: "owner-groups@example.com" },
      });
      if (testUser) {
        await prisma.study_groups.deleteMany({
          where: { owner_user_id: testUser.id },
        });
      }
    }

    // Cleanup extra contents
    await prisma.contents
      .deleteMany({
        where: {
          id: { in: [contentId, "test-content-2"] },
        },
      })
      .catch(() => {});

    // Delete users last
    await prisma.users.deleteMany({
      where: {
        email: {
          in: ["owner-groups@example.com", "member2-groups@example.com"],
        },
      },
    });

    await app.close();
  });

  describe("Groups Management", () => {
    it("POST /groups - should create group", async () => {
      const res = await request(app.getHttpServer())
        .post(apiUrl("groups"))
        .set("Authorization", authToken)
        .send({ name: "Integration Test Group" })
        .expect(201);

      expect(res.body).toHaveProperty("id");
      expect(res.body.name).toBe("Integration Test Group");
      expect(res.body.owner_user_id).toBe(userId);

      groupId = res.body.id;
    });

    it("GET /groups - should list user groups", async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl("groups"))
        .set("Authorization", authToken)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body.some((g: any) => g.id === groupId)).toBe(true);
    });

    it("GET /groups/:groupId - should get group details", async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl(`groups/${groupId}`))
        .set("Authorization", authToken)
        .expect(200);

      expect(res.body.id).toBe(groupId);
      expect(res.body.name).toBe("Integration Test Group");
      expect(res.body.study_group_members).toBeDefined();
      expect(res.body.study_group_members.length).toBeGreaterThan(0);
      expect(res.body.study_group_members[0].role).toBe("OWNER");
    });

    it("POST /groups/:groupId/members/invite - should invite member", async () => {
      // Create another test user
      const user2 = await prisma.users.upsert({
        where: { email: "user2-groups@example.com" },
        create: {
          email: "user2-groups@example.com",
          name: "User 2",
          password_hash: "hash",
          last_context_role: ContextRole.STUDENT,
          schooling_level: "ADVANCED_USER",
          status: "ACTIVE",
        },
        update: {},
      });

      await request(app.getHttpServer())
        .post(apiUrl(`groups/${groupId}/members/invite`))
        .set("Authorization", authToken)
        .send({ user_id: user2.id, role: "MEMBER" })
        .expect(201);

      // Verify member was invited
      const member = await prisma.study_group_members.findUnique({
        where: { group_id_user_id: { group_id: groupId, user_id: user2.id } },
      });

      expect(member).toBeDefined();
      expect(member!.status).toBe("INVITED");

      // Cleanup
      await prisma.study_group_members.delete({
        where: { group_id_user_id: { group_id: groupId, user_id: user2.id } },
      });
      await prisma.users.delete({ where: { id: user2.id } });
    });

    it("POST /groups/:groupId/contents - should add content", async () => {
      await request(app.getHttpServer())
        .post(apiUrl(`groups/${groupId}/contents`))
        .set("Authorization", authToken)
        .send({ content_id: contentId })
        .expect(201);

      // Verify content was added
      const groupContent = await prisma.content_shares.findUnique({
        where: {
          content_id_context_type_context_id: {
            content_id: contentId,
            context_type: ShareContextType.STUDY_GROUP,
            context_id: groupId,
          },
        },
      });

      expect(groupContent).toBeDefined();
    });

    it("DELETE /groups/:groupId/contents/:contentId - should remove content", async () => {
      // Add another content first
      const content2 = await prisma.contents.upsert({
        where: { id: "test-content-2" },
        update: {},
        create: {
          id: "test-content-2",
          title: "Content 2",
          type: "PDF",
          users_owner: { connect: { id: userId } },
          original_language: "EN",
          raw_text: "Test content 2 text",
        },
      });

      await prisma.content_shares.create({
        data: {
          context_id: groupId,
          context_type: ShareContextType.STUDY_GROUP,
          content_id: content2.id,
          created_by: userId,
        },
      });

      await request(app.getHttpServer())
        .delete(apiUrl(`groups/${groupId}/contents/${content2.id}`))
        .set("Authorization", authToken)
        .expect(200);

      // Verify content was removed
      const groupContent = await prisma.content_shares.findUnique({
        where: {
          content_id_context_type_context_id: {
            content_id: content2.id,
            context_type: ShareContextType.STUDY_GROUP,
            context_id: groupId,
          },
        },
      });

      expect(groupContent).toBeNull();

      // Cleanup
      await prisma.contents.delete({ where: { id: content2.id } });
    });
  });

  describe("Group Sessions", () => {
    beforeAll(async () => {
      // Ensure we have at least 2 members for session creation
      const user2 = await prisma.users.upsert({
        where: { email: "member2-groups@example.com" },
        create: {
          email: "member2-groups@example.com",
          name: "Member 2",
          password_hash: "hash",
          last_context_role: ContextRole.STUDENT,
          schooling_level: "ADULT",
          status: "ACTIVE",
        },
        update: {},
      });

      await prisma.study_group_members.upsert({
        where: { group_id_user_id: { group_id: groupId, user_id: user2.id } },
        create: {
          group_id: groupId,
          user_id: user2.id,
          role: "MEMBER",
          status: "ACTIVE",
        },
        update: { status: "ACTIVE" },
      });
    });

    it("POST /group-sessions - should create session", async () => {
      const res = await request(app.getHttpServer())
        .post(apiUrl(`group-sessions?groupId=${groupId}`))
        .set("Authorization", authToken)
        .send({
          content_id: contentId,
          mode: "PI_SPRINT",
          layer: "L1",
          rounds_count: 2,
        })
        .expect(201);

      expect(res.body).toHaveProperty("id");
      expect(res.body.group_id).toBe(groupId);
      expect(res.body.content_id).toBe(contentId);
      expect(res.body.status).toBe("CREATED");
      expect(res.body.group_rounds).toBeDefined();
      expect(res.body.group_rounds.length).toBe(2);
      expect(res.body.group_session_members).toBeDefined();
      expect(res.body.group_session_members.length).toBeGreaterThanOrEqual(2);

      sessionId = res.body.id;

      // Verify role assignments
      const roles = res.body.group_session_members.map(
        (m: any) => m.assigned_role,
      );
      expect(roles).toContain("FACILITATOR");
    });

    it("GET /group-sessions/:sessionId - should get session details", async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl(`group-sessions/${sessionId}`))
        .set("Authorization", authToken)
        .expect(200);

      expect(res.body.id).toBe(sessionId);
      expect(res.body.group_rounds).toBeDefined();
    });

    it("PUT /group-sessions/:sessionId/start - should start session", async () => {
      await request(app.getHttpServer())
        .put(apiUrl(`group-sessions/${sessionId}/start`))
        .set("Authorization", authToken)
        .expect(200);

      // Verify session status changed
      const session = await prisma.group_sessions.findUnique({
        where: { id: sessionId },
      });

      expect(session!.status).toBe("RUNNING");
    });

    it("POST /group-sessions/:sessionId/events - should submit vote", async () => {
      await request(app.getHttpServer())
        .post(apiUrl(`group-sessions/${sessionId}/events`))
        .set("Authorization", authToken)
        .send({
          round_index: 1,
          event_type: "PI_VOTE_SUBMIT",
          payload: { choice: "A", rationale: "Because it makes sense" },
        })
        .expect(201);

      // Verify event was created
      const events = await prisma.group_events.findMany({
        where: { session_id: sessionId, event_type: "PI_VOTE_SUBMIT" },
      });

      expect(events.length).toBeGreaterThan(0);
    });

    it("POST /group-sessions/:sessionId/rounds/:roundIndex/advance - should block with 409 if incomplete", async () => {
      const res = await request(app.getHttpServer())
        .post(apiUrl(`group-sessions/${sessionId}/rounds/1/advance`))
        .set("Authorization", authToken)
        .send({ to_status: "DISCUSSING" })
        .expect(409);

      expect(res.body.statusCode).toBe(409);
      expect(res.body.message).toContain("haven't PI_VOTE_SUBMIT");
      expect(res.body).toHaveProperty("required");
      expect(res.body).toHaveProperty("current");
      expect(res.body).toHaveProperty("missing");
    });

    it("POST /group-sessions/:sessionId/rounds/:roundIndex/advance - should advance after all vote", async () => {
      // Get all members and submit votes for them
      const session = await prisma.group_sessions.findUnique({
        where: { id: sessionId },
        include: { group_session_members: true, group_rounds: true },
      });

      // Submit votes for all members who haven't voted
      for (const member of session!.group_session_members) {
        const events = await prisma.group_events.findMany({
          where: {
            session_id: sessionId,
            user_id: member.user_id,
            event_type: "PI_VOTE_SUBMIT",
          },
        });
        const hasVoted = events.some((e) => {
          // Manual check for round since direct filter might fail if relation not exposed in where input
          // But actually we want to check if they voted for round 1
          // We can check if round_id matches
          return true; // Simplified for now as we just create it if missing
        });

        if (!hasVoted) {
          await prisma.group_events.create({
            data: {
              id: "vote-event-custom",
              group_sessions: { connect: { id: sessionId } },
              user_id: member.user_id,
              group_rounds: { connect: { id: session!.group_rounds[0].id } },
              event_type: "PI_VOTE_SUBMIT",
              payload_json: { choice: "A" },
            },
          });
        }
      }

      await request(app.getHttpServer())
        .post(apiUrl(`group-sessions/${sessionId}/rounds/1/advance`))
        .set("Authorization", authToken)
        .send({ to_status: "DISCUSSING" })
        .expect(201);

      // Verify round status changed
      const round = await prisma.group_rounds.findFirst({
        where: { session_id: sessionId, round_index: 1 },
      });

      expect(round!.status).toBe("DISCUSSING");
    });

    it("GET /group-sessions/:sessionId/events - should get events", async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl(`group-sessions/${sessionId}/events?round_index=1`))
        .set("Authorization", authToken)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it("GET /group-sessions/:sessionId/shared-cards - should get shared cards", async () => {
      const res = await request(app.getHttpServer())
        .get(apiUrl(`group-sessions/${sessionId}/shared-cards`))
        .set("Authorization", authToken)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      // May be empty if no explanation submitted yet
    });
  });

  describe("Permission Tests", () => {
    it("should reject unauthorized access (no token)", async () => {
      await request(app.getHttpServer()).get(apiUrl("groups")).expect(401);
    });

    it("should reject MEMBER trying to invite", async () => {
      // Create a MEMBER user
      // Create a MEMBER user
      const memberUser = await prisma.users.upsert({
        where: { email: "member-only@example.com" },
        create: {
          email: "member-only@example.com",
          name: "Member Only",
          password_hash: "hash",
          last_context_role: ContextRole.STUDENT,
          schooling_level: "ADULT",
          status: "ACTIVE",
        },
        update: {},
      });

      await prisma.study_group_members.create({
        data: {
          group_id: groupId,
          user_id: memberUser.id,
          role: "MEMBER",
          status: "ACTIVE",
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
        .set("Authorization", memberToken)
        .send({ user_id: "some-user-id", role: "MEMBER" })
        .expect(403);

      // Cleanup
      await prisma.study_group_members.delete({
        where: {
          group_id_user_id: { group_id: groupId, user_id: memberUser.id },
        },
      });
      await prisma.users.delete({ where: { id: memberUser.id } });
    });

    it("should reject expired JWT token", async () => {
      const expiredToken = authHelper.generateExpiredToken({
        id: userId,
        email: "test-groups@example.com",
        name: "Test User",
      });

      await request(app.getHttpServer())
        .get(apiUrl("groups"))
        .set("Authorization", `Bearer ${expiredToken}`)
        .expect(401);
    });

    it("should reject invalid JWT token", async () => {
      await request(app.getHttpServer())
        .get(apiUrl("groups"))
        .set("Authorization", "Bearer invalid-token-12345")
        .expect(401);
    });
  });
});
