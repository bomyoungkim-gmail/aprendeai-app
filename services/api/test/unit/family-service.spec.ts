import { Test, TestingModule } from '@nestjs/testing';
import { FamilyService } from '../../src/family/family.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { SubscriptionService } from '../../src/billing/subscription.service';
import { UsageTrackingService } from '../../src/billing/usage-tracking.service';

describe('FamilyService - Unit Tests', () => {
  let service: FamilyService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    familyMember: {
      findFirst: jest.fn(),
    },
    family: {
      findUnique: jest.fn(),
    },
  };

  const mockSubscriptionService = {};
  const mockUsageTrackingService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FamilyService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SubscriptionService, useValue: mockSubscriptionService },
        { provide: UsageTrackingService, useValue: mockUsageTrackingService },
      ],
    }).compile();

    service = module.get<FamilyService>(FamilyService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFamilyForOwner', () => {
    it('should return family data with stats for user with primary family', async () => {
      const userId = 'user-123';
      const familyId = 'family-456';

      // Mock user with primary family in settings
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        settings: { primaryFamilyId: familyId },
      });

      // Mock family data
      const mockFamily = {
        id: familyId,
        name: 'Test Family',
        ownerId: userId,
        members: [
          { id: 'member-1', userId, role: 'OWNER', status: 'ACTIVE', user: { id: userId, name: 'Owner', email: 'owner@test.com' } },
          { id: 'member-2', userId: 'user-789', role: 'CHILD', status: 'ACTIVE', user: { id: 'user-789', name: 'Child', email: 'child@test.com' } },
          { id: 'member-3', userId: 'user-999', role: 'GUARDIAN', status: 'INVITED', user: { id: 'user-999', name: 'Parent', email: 'parent@test.com' } },
        ],
      };

      mockPrismaService.family.findUnique.mockResolvedValue(mockFamily);

      const result = await service.getFamilyForOwner(userId);

      expect(result).toBeDefined();
      expect(result.id).toBe(familyId);
      expect(result.name).toBe('Test Family');
      expect(result.stats.totalMembers).toBe(3);
      expect(result.stats.activeMembers).toBe(2);
      expect(result.stats.plan).toBe('Free');
    });

    it('should find first active family if no primary family is set', async () => {
      const userId = 'user-123';
      const familyId = 'family-789';

      // Mock user without primary family
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        settings: {},
      });

      // Mock familyMember lookup
      mockPrismaService.familyMember.findFirst.mockResolvedValue({
        id: 'member-1',
        familyId,
        userId,
        role: 'OWNER',
        status: 'ACTIVE',
      });

      // Mock family data
      const mockFamily = {
        id: familyId,
        name: 'Fallback Family',
        ownerId: userId,
        members: [
          { id: 'member-1', userId, role: 'OWNER', status: 'ACTIVE', user: { id: userId, name: 'Owner', email: 'owner@test.com' } },
        ],
      };

      mockPrismaService.family.findUnique.mockResolvedValue(mockFamily);

      const result = await service.getFamilyForOwner(userId);

      expect(result).toBeDefined();
      expect(result.id).toBe(familyId);
      expect(result.stats.totalMembers).toBe(1);
      expect(result.stats.activeMembers).toBe(1);
    });

    it('should return null if user has no family', async () => {
      const userId = 'user-without-family';

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        settings: {},
      });

      mockPrismaService.familyMember.findFirst.mockResolvedValue(null);

      const result = await service.getFamilyForOwner(userId);

      expect(result).toBeNull();
    });

    it('should handle zero active members correctly', async () => {
      const userId = 'user-123';
      const familyId = 'family-456';

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        settings: { primaryFamilyId: familyId },
      });

      const mockFamily = {
        id: familyId,
        name: 'Pending Family',
        ownerId: userId,
        members: [
          { id: 'member-1', userId, role: 'OWNER', status: 'INVITED', user: { id: userId, name: 'Owner', email: 'owner@test.com' } },
          { id: 'member-2', userId: 'user-789', role: 'CHILD', status: 'INVITED', user: { id: 'user-789', name: 'Child', email: 'child@test.com' } },
        ],
      };

      mockPrismaService.family.findUnique.mockResolvedValue(mockFamily);

      const result = await service.getFamilyForOwner(userId);

      expect(result).toBeDefined();
      expect(result.stats.totalMembers).toBe(2);
      expect(result.stats.activeMembers).toBe(0);
    });
  });
});
