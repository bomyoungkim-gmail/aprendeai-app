import { Test, TestingModule } from '@nestjs/testing';
import { EntitlementsService } from './entitlements.service';
import { PrismaService } from '../prisma/prisma.service';
import { FamilyService } from '../family/family.service';
import { ScopeType } from '@prisma/client';

describe('EntitlementsService', () => {
  let service: EntitlementsService;
  let prisma: PrismaService;

  const mockPrisma = {
    entitlementSnapshot: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    subscription: {
      findFirst: jest.fn(),
    },
    institutionMember: {
      findFirst: jest.fn(),
    },
  };

  const mockFamilyService = {
    findAllForUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntitlementsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FamilyService, useValue: mockFamilyService },
      ],
    }).compile();

    service = module.get<EntitlementsService>(EntitlementsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEntitlement', () => {
    it('should return valid snapshot for USER scope', async () => {
      mockPrisma.entitlementSnapshot.findFirst.mockResolvedValueOnce({
        id: 'snap-1',
        scopeType: 'USER',
        scopeId: 'user-123',
        expiresAt: new Date(Date.now() + 86400000), // Future
      });

      const result = await service.getEntitlement('user-123', 'USER', 'user-123');
      
      expect(result.id).toBe('snap-1');
      expect(mockPrisma.entitlementSnapshot.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          scopeType: 'USER',
          scopeId: 'user-123',
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should fallback to USER scope if FAMILY scope missing', async () => {
      // First call for FAMILY returns null
      mockPrisma.entitlementSnapshot.findFirst.mockResolvedValueOnce(null);
      
      // Recursive call for USER returns snapshot
      mockPrisma.entitlementSnapshot.findFirst.mockResolvedValueOnce({
        id: 'snap-user',
        scopeType: 'USER',
      });

      const result = await service.getEntitlement('user-123', 'FAMILY', 'fam-123');
      
      expect(result.id).toBe('snap-user');
      expect(mockPrisma.entitlementSnapshot.findFirst).toHaveBeenCalledTimes(2);
    });

    it('should refresh if snapshot is expired', async () => {
      mockPrisma.entitlementSnapshot.findFirst.mockResolvedValueOnce({
        expiresAt: new Date(Date.now() - 1000), // Past
      });

      // Mock refresh result (simplified)
      const refreshSpy = jest.spyOn(service, 'refreshSnapshot').mockResolvedValue('refreshed-snapshot' as any);

      const result = await service.getEntitlement('user-123');
      
      expect(refreshSpy).toHaveBeenCalledWith('user-123');
      expect(result).toBe('refreshed-snapshot');
    });
  });
});
