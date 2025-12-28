// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { ContentService } from './content.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import { ActivityService } from './activity.service';
import { FamilyService } from '../../family/family.service';
import { ForbiddenException } from '@nestjs/common';

describe('ContentService', () => {
  let service: ContentService;
  let prisma: PrismaService;

  const mockPrisma = {
    content: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    familyMember: {
      findFirst: jest.fn(),
    },
    institutionMember: {
      findFirst: jest.fn(),
    },
  };

  const mockStorageService = {};
  const mockActivityService = { trackActivity: jest.fn().mockResolvedValue(true) };
  const mockFamilyService = { findAllForUser: jest.fn() };
  const mockConfigService = { get: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
        { provide: ActivityService, useValue: mockActivityService },
        { provide: FamilyService, useValue: mockFamilyService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ContentService>(ContentService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canAccessContent', () => {
    it('should allow access if user is the direct owner', async () => {
      mockPrisma.content.findUnique.mockResolvedValue({
        ownerType: 'USER',
        ownerId: 'user-123',
      });

      const result = await service.canAccessContent('content-1', 'user-123');
      expect(result).toBe(true);
    });

    it('should deny access if user is not the owner', async () => {
      mockPrisma.content.findUnique.mockResolvedValue({
        ownerType: 'USER',
        ownerId: 'other-user',
      });

      const result = await service.canAccessContent('content-1', 'user-123');
      expect(result).toBe(false);
    });

    it('should allow access if user is family member for FAMILY content', async () => {
      mockPrisma.content.findUnique.mockResolvedValue({
        ownerType: 'FAMILY',
        ownerId: 'fam-123',
      });
      mockPrisma.familyMember.findFirst.mockResolvedValue({ id: 'member-1' });

      const result = await service.canAccessContent('content-1', 'user-123');
      expect(result).toBe(true);
      expect(mockPrisma.familyMember.findFirst).toHaveBeenCalledWith({
        where: { familyId: 'fam-123', userId: 'user-123' },
      });
    });

    it('should deny access if user is not family member for FAMILY content', async () => {
      mockPrisma.content.findUnique.mockResolvedValue({
        ownerType: 'FAMILY',
        ownerId: 'fam-123',
      });
      mockPrisma.familyMember.findFirst.mockResolvedValue(null);

      const result = await service.canAccessContent('content-1', 'user-123');
      expect(result).toBe(false);
    });

    it('should allow access if user is institution member for INSTITUTION content', async () => {
      mockPrisma.content.findUnique.mockResolvedValue({
        ownerType: 'INSTITUTION',
        ownerId: 'inst-123',
      });
      mockPrisma.institutionMember.findFirst.mockResolvedValue({ id: 'member-1' });

      const result = await service.canAccessContent('content-1', 'user-123');
      expect(result).toBe(true);
    });

    it('should fallback to ownerUserId check if ownerType missing', async () => {
      mockPrisma.content.findUnique.mockResolvedValue({
        ownerUserId: 'user-123',
        // no ownerType/ownerId
      });

      const result = await service.canAccessContent('content-1', 'user-123');
      expect(result).toBe(true);
    });
  });

  describe('uploadContent', () => {
    it('should set ownerType based on scope (USER)', async () => {
      const mockFile = { mimetype: 'application/pdf' };
      const dto = { title: 'Test', scopeType: 'USER', originalLanguage: 'EN' };
      
      // Mock internal calls
      jest.spyOn(service as any, 'getContentType').mockReturnValue('DOCUMENT');
      mockPrisma.content.create.mockResolvedValue({ id: 'content-1', title: 'Test' });

      await service.uploadContent('user-123', mockFile, dto, { id: 'file-1' });

      expect(mockPrisma.content.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ownerType: 'USER',
            ownerId: 'user-123',
          }),
        })
      );
    });

    it('should set ownerType based on scope (INSTITUTION)', async () => {
      const mockFile = { mimetype: 'application/pdf' };
      const dto = { title: 'Test', scopeType: 'INSTITUTION', scopeId: 'inst-123', originalLanguage: 'EN' };
      
      jest.spyOn(service as any, 'getContentType').mockReturnValue('DOCUMENT');
      mockPrisma.content.create.mockResolvedValue({ id: 'content-1' });

      await service.uploadContent('user-123', mockFile, dto, { id: 'file-1' });

      expect(mockPrisma.content.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ownerType: 'INSTITUTION',
            ownerId: 'inst-123',
          }),
        })
      );
    });
  });
});
