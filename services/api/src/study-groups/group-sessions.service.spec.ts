import { Test, TestingModule } from '@nestjs/testing';
import { GroupSessionsService } from '../group-sessions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('GroupSessionsService', () => {
  let service: GroupSessionsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    $transaction: jest.fn(),
    studyGroup: {
      findUnique: jest.fn(),
    },
    groupSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    groupSessionMember: {
      createMany: jest.fn(),
      count: jest.fn(),
    },
    groupRound: {
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupSessionsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<GroupSessionsService>(GroupSessionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should validate minimum 2 members', async () => {
      const groupId = 'group1';
      const userId = 'user1';
      const dto = { contentId: 'content1', mode: 'PI_SPRINT', layer: 'L1', roundsCount: 3 };

      mockPrismaService.studyGroup.findUnique.mockResolvedValue({
        id: groupId,
        members: [{ userId, status: 'ACTIVE' }], // Only 1 member
      });

      await expect(service.createSession(groupId, userId, dto as any)).rejects.toThrow(BadRequestException);
    });

    it('should create session with rounds and role assignments using transaction', async () => {
      const groupId = 'group1';
      const userId = 'user1';
      const dto = { contentId: 'content1', mode: 'PI_SPRINT', layer: 'L1', roundsCount: 3 };

      const mockMembers = [
        { userId: 'alice', status: 'ACTIVE' },
        { userId: 'bob', status: 'ACTIVE' },
      ];

      mockPrismaService.studyGroup.findUnique.mockResolvedValue({
        id: groupId,
        members: mockMembers,
      });

      const mockSession = { id: 'session1', groupId, ...dto };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          groupSession: {
            create: jest.fn().mockResolvedValue(mockSession),
            count: jest.fn().mockResolvedValue(0), // No previous sessions
          },
          groupSessionMember: {
            createMany: jest.fn().mockResolvedValue({}),
          },
          groupRound: {
            createMany: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      const result = await service.createSession(groupId, userId, dto as any);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockSession);
    });
  });

  describe('assignRoles (Deterministic Rotation)', () => {
    it('should assign roles alphabetically by userId with offset 0', async () => {
      const members = [
        { userId: 'charlie', status: 'ACTIVE' },
        { userId: 'alice', status: 'ACTIVE' },
        { userId: 'bob', status: 'ACTIVE' },
      ];

      const mockTx = {
        groupSession: { count: jest.fn().mockResolvedValue(0) }, // offset = 0
        groupSessionMember: { createMany: jest.fn() },
      };

      const result = await service['assignRoles'](mockTx as any, 'session1', 'group1', members);

      // Should be sorted: alice, bob, charlie
      expect(result[0]).toMatchObject({ userId: 'alice', assignedRole: 'FACILITATOR' });
      expect(result[1]).toMatchObject({ userId: 'bob', assignedRole: 'TIMEKEEPER' });
      expect(result[2]).toMatchObject({ userId: 'charlie', assignedRole: 'CLARIFIER' });
    });

    it('should rotate roles with offset 1', async () => {
      const members = [
        { userId: 'alice', status: 'ACTIVE' },
        { userId: 'bob', status: 'ACTIVE' },
        { userId: 'charlie', status: 'ACTIVE' },
      ];

      const mockTx = {
        groupSession: { count: jest.fn().mockResolvedValue(1) }, // offset = 1 % 3 = 1
        groupSessionMember: { createMany: jest.fn() },
      };

      const result = await service['assignRoles'](mockTx as any, 'session1', 'group1', members);

      // Offset 1: roles rotate by 1 position
      expect(result[0]).toMatchObject({ userId: 'alice', assignedRole: 'SCRIBE' });
      expect(result[1]).toMatchObject({ userId: 'bob', assignedRole: 'FACILITATOR' });
      expect(result[2]).toMatchObject({ userId: 'charlie', assignedRole: 'TIMEKEEPER' });
    });

    it('should handle 2 members (circular rotation)', async () => {
      const members = [
        { userId: 'alice', status: 'ACTIVE' },
        { userId: 'bob', status: 'ACTIVE' },
      ];

      const mockTx = {
        groupSession: { count: jest.fn().mockResolvedValue(0) },
        groupSessionMember: { createMany: jest.fn() },
      };

      const result = await service['assignRoles'](mockTx as any, 'session1', 'group1', members);

      expect(result).toHaveLength(2);
      expect(result[0].assignedRole).toBe('FACILITATOR');
      expect(result[1].assignedRole).toBe('TIMEKEEPER');
    });

    it('should assign all 5 roles with 5+ members', async () => {
      const members = [
        { userId: 'alice', status: 'ACTIVE' },
        { userId: 'bob', status: 'ACTIVE' },
        { userId: 'charlie', status: 'ACTIVE' },
        { userId: 'diana', status: 'ACTIVE' },
        { userId: 'eve', status: 'ACTIVE' },
      ];

      const mockTx = {
        groupSession: { count: jest.fn().mockResolvedValue(0) },
        groupSessionMember: { createMany: jest.fn() },
      };

      const result = await service['assignRoles'](mockTx as any, 'session1', 'group1', members);

      expect(result).toHaveLength(5);
      const roles = result.map(r => r.assignedRole);
      expect(roles).toContain('FACILITATOR');
      expect(roles).toContain('TIMEKEEPER');
      expect(roles).toContain('CLARIFIER');
      expect(roles).toContain('CONNECTOR');
      expect(roles).toContain('SCRIBE');
    });

    it('should produce same results for same inputs (deterministic)', async () => {
      const members = [
        { userId: 'bob', status: 'ACTIVE' },
        { userId: 'alice', status: 'ACTIVE' },
      ];

      const mockTx = {
        groupSession: { count: jest.fn().mockResolvedValue(3) }, // offset = 3 % 2 = 1
        groupSessionMember: { createMany: jest.fn() },
      };

      const result1 = await service['assignRoles'](mockTx as any, 'session1', 'group1', members);
      const result2 = await service['assignRoles'](mockTx as any, 'session2', 'group1', members);

      expect(result1).toEqual(result2);
    });
  });

  describe('getDefaultTimers', () => {
    it('should return L1 timers for basic layer', () => {
      const timers = service['getDefaultTimers']('L1');

      expect(timers).toEqual({
        voteSec: 60,
        discussSec: 180,
        revoteSec: 60,
        explainSec: 180,
      });
    });

    it('should return L2/L3 timers for advanced layers', () => {
      const timersL2 = service['getDefaultTimers']('L2');
      const timersL3 = service['getDefaultTimers']('L3');

      expect(timersL2).toEqual({
        voteSec: 90,
        discussSec: 240,
        revoteSec: 90,
        explainSec: 240,
      });

      expect(timersL3).toEqual(timersL2);
    });
  });

  describe('startSession', () => {
    it('should update status to RUNNING and set startsAt', async () => {
      const sessionId = 'session1';
      const userId = 'user1';

      mockPrismaService.groupSession.findUnique.mockResolvedValue({
        id: sessionId,
        group: {
          members: [{ userId, status: 'ACTIVE' }],
        },
      });

      mockPrismaService.groupSession.update.mockResolvedValue({
        id: sessionId,
        status: 'RUNNING',
      });

      await service.startSession(sessionId, userId);

      expect(prisma.groupSession.update).toHaveBeenCalledWith({
        where: { id: sessionId },
        data: {
          status: 'RUNNING',
          startsAt: expect.any(Date),
        },
      });
    });
  });
});
