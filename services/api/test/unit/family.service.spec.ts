import { Test, TestingModule } from '@nestjs/testing';
import { FamilyService } from '../../src/family/family.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { SubscriptionService } from '../../src/billing/subscription.service';
import { UsageTrackingService } from '../../src/billing/usage-tracking.service';
import { EnforcementService } from '../../src/billing/enforcement.service';
import { EmailService } from '../../src/email/email.service';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { FamilyRole, FamilyMemberStatus } from '@prisma/client';

describe('FamilyService (Unit)', () => {
  let service: FamilyService;
  let prismaService: jest.Mocked<PrismaService>;
  let subscriptionService: jest.Mocked<SubscriptionService>;
  let emailService: jest.Mocked<EmailService>;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    family: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    familyMember: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockSubscriptionService = {
    getActiveSubscription: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FamilyService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SubscriptionService, useValue: mockSubscriptionService },
        { provide: UsageTrackingService, useValue: {} },
        { provide: EnforcementService, useValue: {} },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<FamilyService>(FamilyService);
    prismaService = module.get(PrismaService) as jest.Mocked<PrismaService>;
    subscriptionService = module.get(SubscriptionService) as jest.Mocked<SubscriptionService>;
    emailService = module.get(EmailService) as jest.Mocked<EmailService>;

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('inviteMember()', () => {
    const familyId = 'family-123';
    const ownerId = 'owner-user-id';
    const mockFamily = {
      id: familyId,
      ownerId,
      name: 'Test Family',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create placeholder user for non-existent email', async () => {
      const dto = { email: 'newuser@test.com', displayName: 'New User' };
      
      // Setup: family exists, user doesn't exist
      prismaService.family.findUnique.mockResolvedValue(mockFamily);
      prismaService.user.findUnique.mockResolvedValue(null);
      
      const createdUser = {
        id: 'new-user-id',
        email: dto.email,
        name: dto.displayName,
        passwordHash: 'PENDING_INVITE',
        role: 'COMMON_USER' as any,
        schoolingLevel: 'UNDERGRADUATE' as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      prismaService.user.create.mockResolvedValue(createdUser as any);
      prismaService.familyMember.findUnique.mockResolvedValue(null);
      prismaService.familyMember.create.mockResolvedValue({
        familyId,
        userId: createdUser.id,
        role: FamilyRole.MEMBER,
        status: FamilyMemberStatus.ACTIVE,
        createdAt: new Date(),
      } as any);

      await service.inviteMember(ownerId, familyId, dto);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: dto.email,
          name: dto.displayName,
          passwordHash: 'PENDING_INVITE',
          role: 'COMMON_USER',
          schoolingLevel: 'UNDERGRADUATE',
        }),
      });
    });

    it('should add existing user to family', async () => {
      const dto = { email: 'existing@test.com' };
      const existingUser = {
        id: 'existing-user-id',
        email: dto.email,
        name: 'Existing User',
        role: 'COMMON_USER' as any,
        schoolingLevel: 'UNDERGRADUATE' as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.family.findUnique.mockResolvedValue(mockFamily);
      prismaService.user.findUnique.mockResolvedValue(existingUser as any);
      prismaService.familyMember.findUnique.mockResolvedValue(null);
      prismaService.familyMember.create.mockResolvedValue({
        familyId,
        userId: existingUser.id,
        role: FamilyRole.MEMBER,
        status: FamilyMemberStatus.ACTIVE,
        createdAt: new Date(),
      } as any);

      await service.inviteMember(ownerId, familyId, dto);

      expect(prismaService.user.create).not.toHaveBeenCalled();
      expect(prismaService.familyMember.create).toHaveBeenCalledWith({
        data: {
          familyId,
          userId: existingUser.id,
          role: FamilyRole.MEMBER,
          status: FamilyMemberStatus.ACTIVE,
        },
      });
    });

    it('should set default role to MEMBER', async () => {
      const dto = { email: 'test@test.com' };
      const user = { id: 'user-id', email: dto.email } as any;

      prismaService.family.findUnique.mockResolvedValue(mockFamily);
      prismaService.user.findUnique.mockResolvedValue(user);
      prismaService.familyMember.findUnique.mockResolvedValue(null);
      prismaService.familyMember.create.mockResolvedValue({
        role: FamilyRole.MEMBER,
      } as any);

      await service.inviteMember(ownerId, familyId, dto);

      expect(prismaService.familyMember.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: FamilyRole.MEMBER,
        }),
      });
    });

    it('should throw if user already in family', async () => {
      const dto = { email: 'existing@test.com' };
      const user = { id: 'user-id', email: dto.email } as any;

      prismaService.family.findUnique.mockResolvedValue(mockFamily);
      prismaService.user.findUnique.mockResolvedValue(user);
      prismaService.familyMember.findUnique.mockResolvedValue({
        familyId,
        userId: user.id,
        role: FamilyRole.MEMBER,
        status: FamilyMemberStatus.ACTIVE,
      } as any);

      await expect(service.inviteMember(ownerId, familyId, dto)).rejects.toThrow(BadRequestException);
    });

    it('should send invitation email', async () => {
      const dto = { email: 'newuser@test.com' };
      const user = { id: 'new-user-id', email: dto.email } as any;

      prismaService.family.findUnique.mockResolvedValue(mockFamily);
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(user);
      prismaService.familyMember.findUnique.mockResolvedValue(null);
      prismaService.familyMember.create.mockResolvedValue({} as any);

      await service.inviteMember(ownerId, familyId, dto);

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: dto.email,
          template: 'family-invitation',
        })
      );
    });

    it('should throw ForbiddenException if not owner', async () => {
      const dto = { email: 'test@test.com' };
      const nonOwnerId = 'not-owner';

      prismaService.family.findUnique.mockResolvedValue(mockFamily);

      await expect(service.inviteMember(nonOwnerId, familyId, dto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('transferOwnership()', () => {
    const familyId = 'family-123';
    const currentOwnerId = 'current-owner-id';
    const newOwnerId = 'new-owner-id';

    const mockFamily = {
      id: familyId,
      ownerId: currentOwnerId,
      name: 'Test Family',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update family ownerId', async () => {
      prismaService.family.findUnique.mockResolvedValue(mockFamily);
      prismaService.familyMember.findUnique.mockResolvedValue({
        familyId,
        userId: newOwnerId,
        role: FamilyRole.MEMBER,
        status: FamilyMemberStatus.ACTIVE,
        createdAt: new Date(),
      } as any);

      await service.transferOwnership(currentOwnerId, familyId, { newOwnerId });

      expect(prismaService.family.update).toHaveBeenCalledWith({
        where: { id: familyId },
        data: { ownerId: newOwnerId },
      });
    });

    it('should downgrade old owner to ADMIN', async () => {
      prismaService.family.findUnique.mockResolvedValue(mockFamily);
      prismaService.familyMember.findUnique.mockResolvedValue({
        userId: newOwnerId,
        role: FamilyRole.MEMBER,
      } as any);

      await service.transferOwnership(currentOwnerId, familyId, { newOwnerId });

      expect(prismaService.familyMember.update).toHaveBeenCalledWith({
        where: {
          familyId_userId: { familyId, userId: currentOwnerId },
        },
        data: { role: 'ADMIN' as any },
      });
    });

    it('should upgrade new owner to OWNER', async () => {
      prismaService.family.findUnique.mockResolvedValue(mockFamily);
      prismaService.familyMember.findUnique.mockResolvedValue({
        userId: newOwnerId,
        role: FamilyRole.MEMBER,
      } as any);

      await service.transferOwnership(currentOwnerId, familyId, { newOwnerId });

      expect(prismaService.familyMember.update).toHaveBeenCalledWith({
        where: {
          familyId_userId: { familyId, userId: newOwnerId },
        },
        data: { role: FamilyRole.OWNER },
      });
    });

    it('should throw if new owner not in family', async () => {
      prismaService.family.findUnique.mockResolvedValue(mockFamily);
      prismaService.familyMember.findUnique.mockResolvedValue(null);

      await expect(
        service.transferOwnership(currentOwnerId, familyId, { newOwnerId })
      ).rejects.toThrow(BadRequestException);
    });

    it('should use transaction for atomicity', async () => {
      prismaService.family.findUnique.mockResolvedValue(mockFamily);
      prismaService.familyMember.findUnique.mockResolvedValue({
        userId: newOwnerId,
        role: FamilyRole.MEMBER,
      } as any);

      await service.transferOwnership(currentOwnerId, familyId, { newOwnerId });

      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if not current owner', async () => {
      const notOwnerId = 'not-owner';
      prismaService.family.findUnique.mockResolvedValue(mockFamily);

      await expect(
        service.transferOwnership(notOwnerId, familyId, { newOwnerId })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('setPrimaryFamily()', () => {
    const userId = 'user-123';
    const familyId = 'family-123';

    it('should update user settings with primaryFamilyId', async () => {
      prismaService.familyMember.findUnique.mockResolvedValue({
        familyId,
        userId,
        role: FamilyRole.MEMBER,
        status: FamilyMemberStatus.ACTIVE,
      } as any);

      prismaService.user.update.mockResolvedValue({
        id: userId,
        settings: { primaryFamilyId: familyId },
      } as any);

      await service.setPrimaryFamily(userId, familyId);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          settings: expect.objectContaining({
            primaryFamilyId: familyId,
          }),
        },
      });
    });

    it('should throw if user not member of family', async () => {
      prismaService.familyMember.findUnique.mockResolvedValue(null);

      await expect(service.setPrimaryFamily(userId, familyId)).rejects.toThrow(BadRequestException);
    });

    it('should handle user with no existing settings', async () => {
      prismaService.familyMember.findUnique.mockResolvedValue({
        familyId,
        userId,
        role: FamilyRole.MEMBER,
      } as any);

      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        settings: null,
      } as any);

      await service.setPrimaryFamily(userId, familyId);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          settings: { primaryFamilyId: familyId },
        },
      });
    });
  });

  describe('resolveBillingHierarchy()', () => {
    const userId = 'user-123';

    it('should return primary family when set', async () => {
      const primaryFamilyId = 'primary-family';
      const mockUser = {
        id: userId,
        settings: { primaryFamilyId },
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      subscriptionService.getActiveSubscription.mockResolvedValue({
        scopeType: 'FAMILY',
        scopeId: primaryFamilyId,
      } as any);

      const result = await service.resolveBillingHierarchy(userId);

      expect(result.scopeType).toBe('FAMILY');
      expect(result.scopeId).toBe(primaryFamilyId);
    });

    it('should return owned family when no primary set', async () => {
      const ownedFamilyId = 'owned-family';
      
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        settings: null,
      } as any);

      prismaService.family.findFirst.mockResolvedValue({
        id: ownedFamilyId,
        ownerId: userId,
      } as any);

      subscriptionService.getActiveSubscription.mockResolvedValue({
        scopeType: 'FAMILY',
        scopeId: ownedFamilyId,
      } as any);

      const result = await service.resolveBillingHierarchy(userId);

      expect(result.scopeType).toBe('FAMILY');
      expect(result.scopeId).toBe(ownedFamilyId);
    });

    it('should return first joined family as fallback', async () => {
      const firstFamilyId = 'first-family';

      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        settings: null,
      } as any);

      prismaService.family.findFirst
        .mockResolvedValueOnce(null) // No owned family
        .mockResolvedValueOnce({ id: firstFamilyId } as any); // First joined family

      subscriptionService.getActiveSubscription.mockResolvedValue({
        scopeType: 'FAMILY',
        scopeId: firstFamilyId,
      } as any);

      const result = await service.resolveBillingHierarchy(userId);

      expect(result.scopeType).toBe('FAMILY');
      expect(result.scopeId).toBe(firstFamilyId);
    });

    it('should return user scope if no families', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: userId,
        settings: null,
      } as any);

      prismaService.family.findFirst.mockResolvedValue(null);

      subscriptionService.getActiveSubscription.mockResolvedValue({
        scopeType: 'USER',
        scopeId: userId,
      } as any);

      const result = await service.resolveBillingHierarchy(userId);

      expect(result.scopeType).toBe('USER');
      expect(result.scopeId).toBe(userId);
    });
  });

  describe('deleteFamily()', () => {
    const userId = 'owner-id';
    const familyId = 'family-123';

    it('should delete family and all members', async () => {
      prismaService.family.findUnique.mockResolvedValue({
        id: familyId,
        ownerId: userId,
      } as any);

      await service.deleteFamily(userId, familyId);

      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(prismaService.familyMember.deleteMany).toHaveBeenCalledWith({
        where: { familyId },
      });
      expect(prismaService.family.delete).toHaveBeenCalledWith({
        where: { id: familyId },
      });
    });

    it('should throw ForbiddenException if not owner', async () => {
      prismaService.family.findUnique.mockResolvedValue({
        id: familyId,
        ownerId: 'different-user',
      } as any);

      await expect(service.deleteFamily(userId, familyId)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if family does not exist', async () => {
      prismaService.family.findUnique.mockResolvedValue(null);

      await expect(service.deleteFamily(userId, familyId)).rejects.toThrow(NotFoundException);
    });
  });
});
