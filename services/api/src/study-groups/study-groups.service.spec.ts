import { Test, TestingModule } from '@nestjs/testing';
import { StudyGroupsService } from '../study-groups.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('StudyGroupsService', () => {
  let service: StudyGroupsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    $transaction: jest.fn(),
    studyGroup: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    studyGroupMember: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    groupContent: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudyGroupsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<StudyGroupsService>(StudyGroupsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createGroup', () => {
    it('should create group and add creator as OWNER with transaction', async () => {
      const userId = 'user1';
      const dto = { name: 'Test Group' };
      const mockGroup = { id: 'group1', ...dto, ownerUserId: userId };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          studyGroup: {
            create: jest.fn().mockResolvedValue(mockGroup),
          },
          studyGroupMember: {
            create: jest.fn().mockResolvedValue({ groupId: 'group1', userId, role: 'OWNER' }),
          },
        });
      });

      const result = await service.createGroup(userId, dto);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockGroup);
    });
  });

  describe('inviteMember', () => {
    const groupId = 'group1';
    const inviterId = 'owner1';
    const dto = { userId: 'user2', role: 'MEMBER' as any };

    beforeEach(() => {
      mockPrismaService.studyGroup.findUnique.mockResolvedValue({
        id: groupId,
        members: [
          { userId: inviterId, role: 'OWNER', status: 'ACTIVE' },
        ],
      });
    });

    it('should allow OWNER to invite', async () => {
      mockPrismaService.studyGroupMember.findFirst.mockResolvedValue(null);
      mockPrismaService.studyGroupMember.create.mockResolvedValue({});

      await service.inviteMember(groupId, inviterId, dto);

      expect(prisma.studyGroupMember.create).toHaveBeenCalledWith({
        data: {
          groupId,
          userId: dto.userId,
          role: dto.role,
          status: 'INVITED',
        },
      });
    });

    it('should allow MOD to invite', async () => {
      mockPrismaService.studyGroup.findUnique.mockResolvedValue({
        id: groupId,
        members: [{ userId: inviterId, role: 'MOD', status: 'ACTIVE' }],
      });
      mockPrismaService.studyGroupMember.findFirst.mockResolvedValue(null);
      mockPrismaService.studyGroupMember.create.mockResolvedValue({});

      await service.inviteMember(groupId, inviterId, dto);

      expect(prisma.studyGroupMember.create).toHaveBeenCalled();
    });

    it('should reject MEMBER invitation attempts', async () => {
      mockPrismaService.studyGroup.findUnique.mockResolvedValue({
        id: groupId,
        members: [{ userId: inviterId, role: 'MEMBER', status: 'ACTIVE' }],
      });

      await expect(service.inviteMember(groupId, inviterId, dto)).rejects.toThrow(ForbiddenException);
    });

    it('should reactivate REMOVED members', async () => {
      mockPrismaService.studyGroupMember.findFirst.mockResolvedValue({
        groupId,
        userId: dto.userId,
        status: 'REMOVED',
      });
      mockPrismaService.studyGroupMember.update.mockResolvedValue({});

      await service.inviteMember(groupId, inviterId, dto);

      expect(prisma.studyGroupMember.update).toHaveBeenCalledWith({
        where: { groupId_userId: { groupId, userId: dto.userId } },
        data: { status: 'INVITED', role: dto.role },
      });
    });
  });

  describe('removeMember', () => {
    const groupId = 'group1';
    const removerId = 'owner1';

    beforeEach(() => {
      mockPrismaService.studyGroup.findUnique.mockResolvedValue({
        id: groupId,
        members: [
          { userId: removerId, role: 'OWNER', status: 'ACTIVE' },
          { userId: 'user2', role: 'MEMBER', status: 'ACTIVE' },
        ],
      });
    });

    it('should prevent removing OWNER', async () => {
      await expect(service.removeMember(groupId, removerId, removerId)).rejects.toThrow(ForbiddenException);
    });

    it('should allow OWNER to remove MEMBER', async () => {
      mockPrismaService.studyGroupMember.update.mockResolvedValue({});

      await service.removeMember(groupId, removerId, 'user2');

      expect(prisma.studyGroupMember.update).toHaveBeenCalledWith({
        where: { groupId_userId: { groupId, userId: 'user2' } },
        data: { status: 'REMOVED' },
      });
    });

    it('should allow MOD to remove MEMBER', async () => {
      mockPrismaService.studyGroup.findUnique.mockResolvedValue({
        id: groupId,
        members: [
          { userId: removerId, role: 'MOD', status: 'ACTIVE' },
          { userId: 'user2', role: 'MEMBER', status: 'ACTIVE' },
        ],
      });
      mockPrismaService.studyGroupMember.update.mockResolvedValue({});

      await service.removeMember(groupId, removerId, 'user2');

      expect(prisma.studyGroupMember.update).toHaveBeenCalled();
    });
  });

  describe('addContent', () => {
    it('should allow ACTIVE members to add content', async () => {
      const groupId = 'group1';
      const userId = 'user1';
      const contentId = 'content1';

      mockPrismaService.studyGroup.findUnique.mockResolvedValue({
        id: groupId,
        members: [{ userId, status: 'ACTIVE' }],
      });
      mockPrismaService.groupContent.findFirst.mockResolvedValue(null);
      mockPrismaService.groupContent.create.mockResolvedValue({});

      await service.addContent(groupId, userId, contentId);

      expect(prisma.groupContent.create).toHaveBeenCalledWith({
        data: { groupId, contentId, addedByUserId: userId },
      });
    });

    it('should reject duplicate content', async () => {
      const groupId = 'group1';
      const userId = 'user1';
      const contentId = 'content1';

      mockPrismaService.studyGroup.findUnique.mockResolvedValue({
        id: groupId,
        members: [{ userId, status: 'ACTIVE' }],
      });
      mockPrismaService.groupContent.findFirst.mockResolvedValue({ groupId, contentId });

      await expect(service.addContent(groupId, userId, contentId)).rejects.toThrow();
    });
  });

  describe('removeContent', () => {
    it('should allow only OWNER/MOD to remove', async () => {
      const groupId = 'group1';
      const userId = 'owner1';
      const contentId = 'content1';

      mockPrismaService.studyGroup.findUnique.mockResolvedValue({
        id: groupId,
        members: [{ userId, role: 'OWNER', status: 'ACTIVE' }],
      });
      mockPrismaService.groupContent.delete.mockResolvedValue({});

      await service.removeContent(groupId, userId, contentId);

      expect(prisma.groupContent.delete).toHaveBeenCalledWith({
        where: { groupId_contentId: { groupId, contentId } },
      });
    });

    it('should reject MEMBER removal attempts', async () => {
      const groupId = 'group1';
      const userId = 'member1';
      const contentId = 'content1';

      mockPrismaService.studyGroup.findUnique.mockResolvedValue({
        id: groupId,
        members: [{ userId, role: 'MEMBER', status: 'ACTIVE' }],
      });

      await expect(service.removeContent(groupId, userId, contentId)).rejects.toThrow(ForbiddenException);
    });
  });
});
