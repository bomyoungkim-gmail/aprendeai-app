import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockConfig = {
    get: jest.fn().mockReturnValue('secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('validate', () => {
    const mockDbUser = {
      id: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
      role: 'TEACHER', // Legacy DB field
      systemRole: 'USER',
      contextRole: 'TEACHER',
      activeInstitutionId: 'inst-123',
      settings: {},
    };

    it('should return null if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await strategy.validate({ sub: 'user-123' });
      expect(result).toBeNull();
    });

    it('should preserve legacy role from payload if present (Backward Compat)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockDbUser);
      
      const payload = {
        sub: 'user-123',
        role: 'ADMIN', // JWT says ADMIN (maybe old token)
      };

      const result = await strategy.validate(payload);
      
      expect(result.role).toBe('ADMIN'); // Should use payload role
      // Note: In a real migration, we might prefer DB source of truth, 
      // but the Strategy implementation we wrote explicitly spreads payload fields
    });

    it('should preserve new role fields from payload if present', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockDbUser);
      
      const payload = {
        sub: 'user-123',
        systemRole: 'ADMIN', // JWT overrides DB
        contextRole: 'STUDENT',
        activeInstitutionId: 'other-inst',
      };

      const result = await strategy.validate(payload);
      
      expect(result.systemRole).toBe('ADMIN');
      expect(result.contextRole).toBe('STUDENT');
      expect(result.activeInstitutionId).toBe('other-inst');
    });

    it('should include extension scopes if present', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockDbUser);
      
      const payload = {
        sub: 'user-123',
        scopes: ['read:content'],
        clientId: 'extension-client',
      };

      const result = await strategy.validate(payload);
      
      expect(result.scopes).toEqual(['read:content']);
      expect(result.clientId).toBe('extension-client');
    });
  });
});
