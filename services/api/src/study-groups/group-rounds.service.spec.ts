import { Test, TestingModule } from '@nestjs/testing';
import { GroupRoundsService } from './group-rounds.service';
import { GroupSessionsService } from './group-sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, ForbiddenException } from '@nestjs/common';

describe('GroupRoundsService', () => {
  let service: GroupRoundsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    groupSession: {
      findUnique: jest.fn(),
    },
    groupRound: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    groupSessionMember: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    groupEvent: {
      create: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    sharedCard: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockSessionsService = {
    // Mock if needed
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupRoundsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: GroupSessionsService, useValue: mockSessionsService },
      ],
    }).compile();

    service = module.get<GroupRoundsService>(GroupRoundsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('advanceRound', () => {
    const sessionId = 'session1';
    const roundIndex = 1;
    const userId = 'facilitator1';

    beforeEach(() => {
      mockPrismaService.groupSession.findUnique.mockResolvedValue({
        id: sessionId,
        group: {
          members: [
            { userId, role: 'OWNER', status: 'ACTIVE' },
          ],
        },
        members: [
          { userId, assignedRole: 'FACILITATOR' },
        ],
        rounds: [
          { roundIndex: 1, id: 'round1', status: 'VOTING' },
        ],
      });
      mockPrismaService.groupRound.findFirst.mockResolvedValue({
        id: 'round1',
        roundIndex: 1,
        status: 'VOTING',
      });
    });

    it('should allow FACILITATOR to advance', async () => {
      mockPrismaService.groupSessionMember.count.mockResolvedValue(1);
      mockPrismaService.groupEvent.groupBy.mockResolvedValue([{ userId }]);
      mockPrismaService.groupRound.update.mockResolvedValue({ id: 'round1', status: 'DISCUSSING' });

      await service.advanceRound(sessionId, roundIndex, userId, 'DISCUSSING');

      expect(prisma.groupRound.update).toHaveBeenCalledWith({
        where: { id: 'round1' },
        data: { status: 'DISCUSSING' },
      });
    });

    it('should allow OWNER to advance', async () => {
      mockPrismaService.groupSession.findUnique.mockResolvedValue({
        id: sessionId,
        group: {
          members: [
            { userId: 'owner1', role: 'OWNER', status: 'ACTIVE' },
          ],
        },
        members: [
          { userId: '  owner1', assignedRole: 'TIMEKEEPER' }, // Not facilitator
        ],
        rounds: [
          { roundIndex: 1, id: 'round1', status: 'VOTING' },
        ],
      });

      mockPrismaService.groupSessionMember.count.mockResolvedValue(1);
      mockPrismaService.groupEvent.groupBy.mockResolvedValue([{ userId: 'owner1' }]);
      mockPrismaService.groupRound.update.mockResolvedValue({});

      await service.advanceRound(sessionId, roundIndex, 'owner1', 'DISCUSSING');

      expect(prisma.groupRound.update).toHaveBeenCalled();
    });

    it('should reject MEMBER advance attempts', async () => {
      mockPrismaService.groupSession.findUnique.mockResolvedValue({
        id: sessionId,
        group: {
          members: [
            { userId: 'member1', role: 'MEMBER', status: 'ACTIVE' },
          ],
        },
        members: [
          { userId: 'member1', assignedRole: 'TIMEKEEPER' },
        ],
        rounds: [
          { roundIndex: 1, id: 'round1', status: 'VOTING' },
        ],
      });

      await expect(
        service.advanceRound(sessionId, roundIndex, 'member1', 'DISCUSSING')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('validateTransition (Accountability Gates)', () => {
    const sessionId = 'session1';
    const roundId = 'round1';

    it('VOTING → DISCUSSING: should block if votes incomplete', async () => {
      mockPrismaService.groupSessionMember.count.mockResolvedValue(5); // 5 joined
      mockPrismaService.groupEvent.groupBy.mockResolvedValue([
        { userId: 'user1' },
        { userId: 'user2' },
        { userId: 'user3' },
      ]); // Only 3 voted

      await expect(
        service['validateTransition'](sessionId, roundId, 'DISCUSSING')
      ).rejects.toThrow(ConflictException);
    });

    it('VOTING → DISCUSSING: should pass if all voted', async () => {
      mockPrismaService.groupSessionMember.count.mockResolvedValue(3);
      mockPrismaService.groupEvent.groupBy.mockResolvedValue([
        { userId: 'user1' },
        { userId: 'user2' },
        { userId: 'user3' },
      ]);

      await expect(
        service['validateTransition'](sessionId, roundId, 'DISCUSSING')
      ).resolves.not.toThrow();
    });

    it('REVOTING → EXPLAINING: should block if revotes incomplete', async () => {
      mockPrismaService.groupSessionMember.count.mockResolvedValue(4);
      mockPrismaService.groupEvent.groupBy.mockResolvedValue([
        { userId: 'user1' },
      ]); // Only 1 revoted

      await expect(
        service['validateTransition'](sessionId, roundId, 'EXPLAINING')
      ).rejects.toThrow(ConflictException);
    });

    it('EXPLAINING → DONE: should block if no explanation', async () => {
      mockPrismaService.sharedCard.findFirst.mockResolvedValue(null);

      await expect(
        service['validateTransition'](sessionId, roundId, 'DONE')
      ).rejects.toThrow(ConflictException);
    });

    it('EXPLAINING → DONE: should pass with explanation', async () => {
      mockPrismaService.sharedCard.findFirst.mockResolvedValue({
        id: 'card1',
        roundId,
      });

      await expect(
        service['validateTransition'](sessionId, roundId, 'DONE')
      ).resolves.not.toThrow();
    });
  });

  describe('assertAllVoted (409 Response)', () => {
    const sessionId = 'session1';
    const roundId = 'round1';
    const eventType = 'PI_VOTE_SUBMIT';

    it('should throw 409 with correct metadata when votes incomplete', async () => {
      mockPrismaService.groupSessionMember.count.mockResolvedValue(5);
      mockPrismaService.groupEvent.groupBy.mockResolvedValue([
        { userId: 'user1' },
        { userId: 'user2' },
        { userId: 'user3' },
      ]);

      try {
        await service['assertAllVoted'](sessionId, roundId, eventType);
        fail('Should have thrown ConflictException');
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.getResponse()).toMatchObject({
          statusCode: 409,
          message: expect.stringContaining("2 member(s) haven't PI_VOTE_SUBMIT"),
          required: 5,
          current: 3,
          missing: 2,
        });
      }
    });

    it('should include missing count in error', async () => {
      mockPrismaService.groupSessionMember.count.mockResolvedValue(10);
      mockPrismaService.groupEvent.groupBy.mockResolvedValue([
        { userId: 'user1' },
      ]);

      try {
        await service['assertAllVoted'](sessionId, roundId, eventType);
      } catch (error) {
        const response = error.getResponse();
        expect(response.missing).toBe(9);
        expect(response.current).toBe(1);
        expect(response.required).toBe(10);
      }
    });
  });

  describe('submitEvent', () => {
    const sessionId = 'session1';
    const userId = 'user1';

    beforeEach(() => {
      mockPrismaService.groupSession.findUnique.mockResolvedValue({
        id: sessionId,
        rounds: [{ roundIndex: 1, id: 'round1', status: 'VOTING' }],
      });
      mockPrismaService.groupSessionMember.findFirst.mockResolvedValue({
        userId,
        attendanceStatus: 'JOINED',
        assignedRole: 'MEMBER',
      });
    });

    it('should validate JOINED membership', async () => {
      mockPrismaService.groupSessionMember.findFirst.mockResolvedValue(null);

      await expect(
        service.submitEvent(sessionId, userId, {
          roundIndex: 1,
          eventType: 'PI_VOTE_SUBMIT',
          payload: {},
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should validate SCRIBE for GROUP_EXPLANATION_SUBMIT', async () => {
      mockPrismaService.groupSessionMember.findFirst.mockResolvedValue({
        userId,
        attendanceStatus: 'JOINED',
        assignedRole: 'TIMEKEEPER', // Not SCRIBE
      });

      await expect(
        service.submitEvent(sessionId, userId, {
          roundIndex: 1,
          eventType: 'GROUP_EXPLANATION_SUBMIT',
          payload: {},
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create SharedCard on explanation submit', async () => {
      mockPrismaService.groupSessionMember.findFirst.mockResolvedValue({
        userId,
        attendanceStatus: 'JOINED',
        assignedRole: 'SCRIBE',
      });
      mockPrismaService.groupEvent.create.mockResolvedValue({});
      mockPrismaService.sharedCard.findFirst.mockResolvedValue(null);
      mockPrismaService.sharedCard.create.mockResolvedValue({});

      await service.submitEvent(sessionId, userId, {
        roundIndex: 1,
        eventType: 'GROUP_EXPLANATION_SUBMIT',
        payload: {
          group_choice: 'A',
          explanation: 'Because...',
          key_terms: ['term1'],
          linked_highlight_ids: [],
        },
      });

      expect(prisma.sharedCard.create).toHaveBeenCalled();
    });
  });

  describe('createSharedCard', () => {
    const sessionId = 'session1';
    const roundId = 'round1';
    const userId = 'scribe1';
    const payload = {
      group_choice: 'A',
      explanation: 'Group explanation',
      key_terms: ['term1', 'term2'],
      linked_highlight_ids: ['hl1'],
    };

    beforeEach(() => {
      mockPrismaService.groupSession.findUnique.mockResolvedValue({
        rounds: [
          { id: roundId, roundIndex: 1, promptJson: { prompt_text: 'Test prompt' } },
        ],
      });
    });

    it('should create new card', async () => {
      mockPrismaService.sharedCard.findFirst.mockResolvedValue(null);
      mockPrismaService.sharedCard.create.mockResolvedValue({});

      await service['createSharedCard'](sessionId, roundId, userId, payload);

      expect(prisma.sharedCard.create).toHaveBeenCalledWith({
        data: {
          sessionId,
          roundId,
          createdByUserId: userId,
          cardJson: {
            prompt: 'Test prompt',
            groupAnswer: 'A',
            explanation: 'Group explanation',
            keyTerms: ['term1', 'term2'],
            linkedHighlightIds: ['hl1'],
          },
        },
      });
    });

    it('should update existing card (idempotent)', async () => {
      mockPrismaService.sharedCard.findFirst.mockResolvedValue({
        id: 'card1',
        roundId,
      });
      mockPrismaService.sharedCard.update.mockResolvedValue({});

      await service['createSharedCard'](sessionId, roundId, userId, payload);

      expect(prisma.sharedCard.update).toHaveBeenCalledWith({
        where: { id: 'card1' },
        data: {
          cardJson: expect.any(Object),
        },
      });
    });
  });
});
