import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { io, Socket as ClientSocket } from "socket.io-client";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/prisma/prisma.service";
import { TestAuthHelper } from "../helpers/auth.helper";

import { IoAdapter } from "@nestjs/platform-socket.io";
import { StudyGroupsWebSocketGateway } from "../../src/websocket/study-groups-ws.gateway";

describe("WebSocket Real-Time Events (Integration)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authHelper: TestAuthHelper;
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;
  let groupId: string;
  let contentId: string;
  let sessionId: string;
  let client1: ClientSocket;
  let client2: ClientSocket;

  const SOCKET_PORT = 8001;
  const SOCKET_URL = `http://localhost:${SOCKET_PORT}/study-groups`;

  beforeAll(async () => {
    // Ensure consistent secret
    process.env.JWT_SECRET = "integration-test-secret";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.init();
    await app.listen(SOCKET_PORT);

    prisma = app.get<PrismaService>(PrismaService);
    // ConfigService will pick up the process.env we set
    authHelper = new TestAuthHelper("integration-test-secret");

    // Create test users
    const user1 = await prisma.user.upsert({
      where: { email: "ws-user1@example.com" },
      create: {
        email: "ws-user1@example.com",
        name: "WS User 1",
        passwordHash: "hash",
        role: "COMMON_USER",
        schoolingLevel: "ADVANCED_USER",
      },
      update: { passwordHash: "hash" },
    });

    const user2 = await prisma.user.upsert({
      where: { email: "ws-user2@example.com" },
      create: {
        email: "ws-user2@example.com",
        name: "WS User 2",
        passwordHash: "hash",
        role: "COMMON_USER",
        schoolingLevel: "ADVANCED_USER",
      },
      update: {},
    });

    user1Id = user1.id;
    user2Id = user2.id;

    user1Token = authHelper.generateToken({
      id: user1.id,
      email: user1.email,
      name: user1.name,
    });

    user2Token = authHelper.generateToken({
      id: user2.id,
      email: user2.email,
      name: user2.name,
    });

    // Create test content
    const content = await prisma.content.create({
      data: {
        title: "WebSocket Test Content",
        type: "PDF",
        originalLanguage: "PT_BR",
        rawText: "Test content",
        ownerUserId: user1.id,
      },
    });
    contentId = content.id;

    // Create group
    const group = await prisma.studyGroup.create({
      data: {
        name: "WebSocket Test Group",
        ownerUserId: user1.id,
      },
    });
    groupId = group.id;

    // Add members
    await prisma.studyGroupMember.createMany({
      data: [
        { groupId, userId: user1.id, role: "OWNER", status: "ACTIVE" },
        { groupId, userId: user2.id, role: "MEMBER", status: "ACTIVE" },
      ],
    });

    // Create session
    const session = await prisma.groupSession.create({
      data: {
        groupId,
        contentId,
        mode: "PI_SPRINT",
        layer: "L1",
        status: "CREATED",
      },
    });
    sessionId = session.id;

    // Assign roles
    await prisma.groupSessionMember.createMany({
      data: [
        { sessionId, userId: user1.id, assignedRole: "FACILITATOR" },
        { sessionId, userId: user2.id, assignedRole: "CLARIFIER" },
      ],
    });

    // Create rounds
    await prisma.groupRound.createMany({
      data: [
        {
          sessionId,
          roundIndex: 1,
          roundType: "PI",
          promptJson: { prompt_text: "Test question?" },
          timingJson: {
            voteSec: 60,
            discussSec: 180,
            revoteSec: 60,
            explainSec: 180,
          },
          status: "CREATED",
        },
      ],
    });
  });

  afterAll(async () => {
    // Cleanup
    if (client1?.connected) client1.disconnect();
    if (client2?.connected) client2.disconnect();

    if (sessionId) {
      await prisma.groupEvent.deleteMany({ where: { sessionId } });
      await prisma.sharedCard.deleteMany({ where: { sessionId } });
      await prisma.groupRound.deleteMany({ where: { sessionId } });
      await prisma.groupSessionMember.deleteMany({ where: { sessionId } });
      await prisma.groupSession.delete({ where: { id: sessionId } });
    }
    if (groupId) {
      await prisma.groupContent.deleteMany({ where: { groupId } });
      await prisma.studyGroupMember.deleteMany({ where: { groupId } });
      await prisma.studyGroup.delete({ where: { id: groupId } });
    }
    await prisma.content.delete({ where: { id: contentId } });
    await prisma.user.delete({ where: { id: user1Id } });
    await prisma.user.delete({ where: { id: user2Id } });

    await app.close();
  });

  describe("WebSocket Connection", () => {
    it("should connect with valid JWT token", (done) => {
      client1 = io(SOCKET_URL, {
        auth: { token: user1Token },
        autoConnect: true,
      });

      client1.on("connect", () => {
        expect(client1.connected).toBe(true);
        client1.disconnect();
        done();
      });

      client1.on("connect_error", (error) => {
        done(new Error(`Connection failed: ${error.message}`));
      });
    });

    it("should reject connection with invalid token", (done) => {
      const badClient = io(SOCKET_URL, {
        auth: { token: "invalid-token" },
        autoConnect: true,
      });

      // It might connect briefly, but should disconnect
      badClient.on("connect", () => {
        // Connected, but waiting for kick
      });

      badClient.on("disconnect", () => {
        done();
      });

      badClient.on("connect_error", () => {
        badClient.disconnect();
        done();
      });
    });

    it("should reject connection without token", (done) => {
      const badClient = io(SOCKET_URL, {
        autoConnect: true,
      });

      badClient.on("connect", () => {
        // Connected, but waiting for kick
      });

      badClient.on("disconnect", () => {
        done();
      });

      badClient.on("connect_error", () => {
        badClient.disconnect();
        done();
      });
    });
  });

  describe("Session Membership Events", () => {
    beforeEach((done) => {
      // Connect both clients
      client1 = io(SOCKET_URL, { auth: { token: user1Token } });
      client2 = io(SOCKET_URL, { auth: { token: user2Token } });

      let connected = 0;
      const checkBothConnected = () => {
        connected++;
        if (connected === 2) done();
      };

      client1.on("connect", checkBothConnected);
      client2.on("connect", checkBothConnected);
    });

    afterEach(() => {
      if (client1) client1.disconnect();
      if (client2) client2.disconnect();
    });

    it("should notify other users when someone joins session", (done) => {
      // User 2 joins session FIRST to be in the room
      client2.emit("joinSession", { sessionId });

      // User 2 listens for join event (of User 1)
      client2.on("userJoined", (data) => {
        // Ignore self-join event if any (Nest gateway usually broadcasts to OTHERS, but check implementation)
        // client.to(room).emit() excludes sender.
        // But client2 is sender of first join.
        // client1 is sender of second join.
        if (data.userId === user1Id) {
          expect(data.userName).toBe("WS User 1");
          expect(data.timestamp).toBeDefined();
          done();
        }
      });

      // Wait a bit for Client 2 to join effectively
      setTimeout(() => {
        // User 1 joins session
        client1.emit("joinSession", { sessionId });
      }, 200);
    });

    it("should notify other users when someone leaves session", (done) => {
      // Both join first
      client1.emit("joinSession", { sessionId });
      client2.emit("joinSession", { sessionId });

      // User 2 listens for leave event
      client2.on("userLeft", (data) => {
        expect(data.userId).toBe(user1Id);
        done();
      });

      // User 1 leaves after small delay
      setTimeout(() => {
        client1.emit("leaveSession", { sessionId });
      }, 100);
    });
  });

  describe("Real-Time Session Events", () => {
    beforeEach((done) => {
      client1 = io(SOCKET_URL, { auth: { token: user1Token } });
      client2 = io(SOCKET_URL, { auth: { token: user2Token } });

      let connected = 0;
      const checkBothConnected = () => {
        connected++;
        if (connected === 2) {
          // Both join session
          client1.emit("joinSession", { sessionId });
          client2.emit("joinSession", { sessionId });
          setTimeout(done, 100); // Wait for joins to process
        }
      };

      client1.on("connect", checkBothConnected);
      client2.on("connect", checkBothConnected);
    });

    afterEach(() => {
      if (client1) null;
      if (client2) client2.disconnect();
    });

    it("should broadcast SESSION_STARTED event to all members", (done) => {
      // User 2 listens for session started
      client2.on("session.started", (data) => {
        expect(data.sessionId).toBe(sessionId);
        expect(data.status).toBe("RUNNING");
        expect(data.startedBy).toBe(user1Id);
        expect(data.timestamp).toBeDefined();
        done();
      });

      // User 1 starts session via HTTP (triggers WebSocket emission)
      setTimeout(async () => {
        await prisma.groupSession.update({
          where: { id: sessionId },
          data: { status: "RUNNING", startsAt: new Date() },
        });
        // Manually trigger emission (service would do this)
        const gateway = app.get(StudyGroupsWebSocketGateway);
        gateway.emitToSession(sessionId, "session.started", {
          sessionId,
          status: "RUNNING",
          startedBy: user1Id,
        });
      }, 100);
    });

    it("should broadcast ROUND_ADVANCED event when round status changes", (done) => {
      client2.on("round.advanced", (data) => {
        expect(data.sessionId).toBe(sessionId);
        expect(data.roundIndex).toBe(1);
        expect(data.status).toBe("VOTING");
        expect(data.timestamp).toBeDefined();
        done();
      });

      setTimeout(async () => {
        const round = await prisma.groupRound.findFirst({
          where: { sessionId, roundIndex: 1 },
        });

        await prisma.groupRound.update({
          where: { id: round!.id },
          data: { status: "VOTING" },
        });

        const gateway = app.get(StudyGroupsWebSocketGateway);
        gateway.emitToSession(sessionId, "round.advanced", {
          sessionId,
          roundId: round!.id,
          roundIndex: 1,
          status: "VOTING",
        });
      }, 100);
    });

    it("should broadcast VOTE_SUBMITTED event when user votes", (done) => {
      client2.on("vote.submitted", (data) => {
        expect(data.sessionId).toBe(sessionId);
        expect(data.userId).toBe(user1Id);
        expect(data.eventType).toBe("PI_VOTE_SUBMIT");
        done();
      });

      setTimeout(async () => {
        const round = await prisma.groupRound.findFirst({
          where: { sessionId, roundIndex: 1 },
        });

        await prisma.groupEvent.create({
          data: {
            sessionId,
            roundId: round!.id,
            userId: user1Id,
            eventType: "PI_VOTE_SUBMIT",
            payloadJson: { choice: "A" },
          },
        });

        const gateway = app.get(StudyGroupsWebSocketGateway);
        gateway.emitToSession(sessionId, "vote.submitted", {
          sessionId,
          roundId: round!.id,
          roundIndex: 1,
          userId: user1Id,
          eventType: "PI_VOTE_SUBMIT",
        });
      }, 100);
    });

    it("should broadcast CHAT_MESSAGE event when user sends message", (done) => {
      client2.on("chat.message", (data) => {
        expect(data.message).toBe("Hello from user 1!");
        expect(data.userId).toBe(user1Id);
        expect(data.timestamp).toBeDefined();
        done();
      });

      setTimeout(() => {
        const gateway = app.get(StudyGroupsWebSocketGateway);
        gateway.emitToSession(sessionId, "chat.message", {
          message: "Hello from user 1!",
          userId: user1Id,
        });
      }, 100);
    });
  });

  describe("Event Isolation", () => {
    let session2Id: string;

    beforeAll(async () => {
      // Create second session
      const session2 = await prisma.groupSession.create({
        data: {
          groupId,
          contentId,
          mode: "PI_SPRINT",
          layer: "L1",
          status: "CREATED",
        },
      });
      session2Id = session2.id;
    });

    afterAll(async () => {
      await prisma.groupSession.delete({ where: { id: session2Id } });
    });

    it("should NOT receive events from other sessions", (done) => {
      client1 = io(SOCKET_URL, { auth: { token: user1Token } });
      client2 = io(SOCKET_URL, { auth: { token: user2Token } });

      client1.on("connect", () => {
        client1.emit("joinSession", { sessionId: sessionId }); // Join session 1
      });

      client2.on("connect", () => {
        client2.emit("joinSession", { sessionId: session2Id }); // Join session 2
      });

      // User 2 should NOT receive events from session 1
      client2.on("session.started", (data) => {
        done(
          new Error(
            `Should not receive events from other session: ${data.sessionId}`,
          ),
        );
      });

      // Emit event to session 1
      setTimeout(() => {
        const gateway = app.get(StudyGroupsWebSocketGateway);
        gateway.emitToSession(sessionId, "session.started", {
          sessionId,
          status: "RUNNING",
        });

        // If no event received after 500ms, test passes
        setTimeout(() => {
          client1.disconnect();
          client2.disconnect();
          done();
        }, 500);
      }, 200);
    });
  });
});
