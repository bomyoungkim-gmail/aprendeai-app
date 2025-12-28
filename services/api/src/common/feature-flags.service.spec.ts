// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagsService } from './feature-flags.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FeatureFlagsService', () => {
  let service: FeatureFlagsService;
  let prisma: PrismaService;

  const mockPrisma = {
    feature_flags: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<FeatureFlagsService>(FeatureFlagsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isEnabled', () => {
    it('should return true when user-specific flag is enabled', async () => {
      mockPrisma.feature_flags.findFirst.mockResolvedValueOnce({
        key: 'test.flag',
        enabled: true,
        scope_type: 'USER',
        scope_id: 'user-123',
      });

      const result = await service.isEnabled('test.flag', 'user-123');
      
      expect(result).toBe(true);
      expect(mockPrisma.feature_flags.findFirst).toHaveBeenCalledWith({
        where: {
          key: 'test.flag',
          scope_type: 'USER',
          scope_id: 'user-123',
          enabled: true,
        },
      });
    });

    it('should check institution flag when user flag not found', async () => {
      mockPrisma.feature_flags.findFirst
        .mockResolvedValueOnce(null) // USER check
        .mockResolvedValueOnce({
          key: 'test.flag',
          enabled: true,
          scope_type: 'INSTITUTION',
          scope_id: 'inst-123',
        });

      const result = await service.isEnabled('test.flag', 'user-123', 'inst-123');
      
      expect(result).toBe(true);
      expect(mockPrisma.feature_flags.findFirst).toHaveBeenCalledTimes(2);
    });

    it('should fall back to GLOBAL flag when user and institution not found', async () => {
      mockPrisma.feature_flags.findFirst
        .mockResolvedValueOnce(null) // USER check
        .mockResolvedValueOnce(null) // INSTITUTION check
        .mockResolvedValueOnce(null) // DEV check
        .mockResolvedValueOnce({
          key: 'test.flag',
          enabled: true,
          scope_type: 'GLOBAL',
        });

      const result = await service.isEnabled('test.flag', 'user-123', 'inst-123');
      
      expect(result).toBe(true);
    });

    it('should return false when no flag is found', async () => {
      mockPrisma.feature_flags.findFirst.mockResolvedValue(null);

      const result = await service.isEnabled('nonexistent.flag');
      
      expect(result).toBe(false);
    });

    it('should check DEV scope in development environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      mockPrisma.feature_flags.findFirst
        .mockResolvedValueOnce(null) // USER
        .mockResolvedValueOnce(null) // INSTITUTION
        .mockResolvedValueOnce({
          key: 'test.flag',
          enabled: true,
          scope_type: 'DEV',
        });

      const result = await service.isEnabled('test.flag');
      
      expect(result).toBe(true);
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('isEnabledSync', () => {
    it('should return default value', () => {
      expect(service.isEnabledSync('test.flag', true)).toBe(true);
      expect(service.isEnabledSync('test.flag', false)).toBe(false);
    });
  });

  describe('getEnabledFlags', () => {
    it('should return unique enabled flags for user and institution', async () => {
      mockPrisma.feature_flags.findMany.mockResolvedValueOnce([
        { key: 'flag1' },
        { key: 'flag2' },
        { key: 'flag1' }, // duplicate
      ]);

      const result = await service.getEnabledFlags('user-123', 'inst-123');
      
      expect(result).toEqual(['flag1', 'flag2']);
    });

    it('should query correct scopes', async () => {
      mockPrisma.feature_flags.findMany.mockResolvedValueOnce([]);

      await service.getEnabledFlags('user-123', 'inst-123');
      
      expect(mockPrisma.feature_flags.findMany).toHaveBeenCalledWith({
        where: {
          enabled: true,
          OR: [
            { scope_type: 'GLOBAL' },
            { scope_type: 'DEV' },
            { scope_type: 'STAGING' },
            { scope_type: 'USER', scope_id: 'user-123' },
            { scope_type: 'INSTITUTION', scope_id: 'inst-123' },
          ],
        },
        select: { key: true },
      });
    });
  });

  describe('enableFlag', () => {
    it('should upsert flag with correct values', async () => {
      mockPrisma.feature_flags.upsert.mockResolvedValueOnce({});

      await service.enableFlag('test.flag', 'USER', 'user-123');
      
      expect(mockPrisma.feature_flags.upsert).toHaveBeenCalled();
    });

    it('should default to GLOBAL scope', async () => {
      mockPrisma.feature_flags.upsert.mockResolvedValueOnce({});

      await service.enableFlag('test.flag');
      
      const call = mockPrisma.feature_flags.upsert.mock.calls[0][0];
      expect(call.where.key_scope_type_scope_id.scope_type).toBe('GLOBAL');
    });
  });

  describe('disableFlag', () => {
    it('should update flag to disabled', async () => {
      mockPrisma.feature_flags.updateMany.mockResolvedValueOnce({});

      await service.disableFlag('test.flag', 'USER', 'user-123');
      
      expect(mockPrisma.feature_flags.updateMany).toHaveBeenCalledWith({
        where: {
          key: 'test.flag',
          scope_type: 'USER',
          scope_id: 'user-123',
        },
        data: {
          enabled: false,
          updated_at: expect.any(Date),
        },
      });
    });
  });
});
