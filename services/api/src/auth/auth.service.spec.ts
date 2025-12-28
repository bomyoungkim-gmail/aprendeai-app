// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { FeatureFlagsService } from '../common/feature-flags.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { StorageService } from '../cornell/services/storage.service';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { SubscriptionService } from '../billing/subscription.service';
import { InstitutionInviteService } from '../institutions/institution-invite.service';
import { InstitutionDomainService } from '../institutions/institution-domain.service';
import { ApprovalService } from '../institutions/approval.service';

describe('AuthService', () => {
  let service: AuthService;
  let featureFlagsService: FeatureFlagsService;
  let jwtService: JwtService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockFeatureFlags = {
    isEnabled: jest.fn(),
  };

  const mockJwt = {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn(),
  };

  // Mock other dependencies
  const mockUsersService = { findOne: jest.fn() };
  const mockSubscriptionService = {};
  const mockEmailService = {};
  const mockInviteService = {};
  const mockDomainService = {};
  const mockApprovalService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FeatureFlagsService, useValue: mockFeatureFlags },
        { provide: JwtService, useValue: mockJwt },
        { provide: UsersService, useValue: mockUsersService },
        { provide: SubscriptionService, useValue: mockSubscriptionService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: InstitutionInviteService, useValue: mockInviteService },
        { provide: InstitutionDomainService, useValue: mockDomainService },
        { provide: ApprovalService, useValue: mockApprovalService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    featureFlagsService = module.get<FeatureFlagsService>(FeatureFlagsService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const mockUser = {
      id: 'user-123',
      email: 'user@example.com',
      role: 'TEACHER',
      systemRole: 'USER',
      contextRole: 'TEACHER',
      activeInstitutionId: 'inst-123',
    };

    it('should generate legacy payload when feature flag is disabled', async () => {
      mockFeatureFlags.isEnabled.mockResolvedValue(false);

      await service.login(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-123',
          email: 'user@example.com',
          role: 'TEACHER',
        })
      );
      // Should NOT contain new fields
      expect(jwtService.sign).not.toHaveBeenCalledWith(
        expect.objectContaining({
          systemRole: expect.anything(),
          contextRole: expect.anything(),
        })
      );
    });

    it('should generate dual payload when feature flag is enabled', async () => {
      mockFeatureFlags.isEnabled.mockResolvedValue(true);
      // Note: AuthService accesses snake_case properties from raw DB user object in some places
      // but mocks usually return camelCase. The service code maps snake_case -> camelCase payload
      // Let's ensure the mock user has snake_case props if the service reads them
      const dbUser = {
        ...mockUser,
        system_role: 'USER',
        context_role: 'TEACHER',
        active_institution_id: 'inst-123',
      };

      await service.login(dbUser);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-123',
          email: 'user@example.com',
          systemRole: 'USER',
          contextRole: 'TEACHER',
          activeInstitutionId: 'inst-123',
        })
      );
    });
  });

  describe('refreshAccessToken', () => {
    const mockUser = {
      id: 'user-123',
      email: 'user@example.com',
      role: 'TEACHER',
      system_role: 'USER',
      context_role: 'TEACHER',
      active_institution_id: 'inst-123',
      refreshToken: 'valid-refresh-token',
    };

    it('should refresh with legacy payload when flag disabled', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockFeatureFlags.isEnabled.mockResolvedValue(false);
      mockJwt.verify.mockReturnValue({ sub: 'user-123' });

      await service.refreshAccessToken('valid-refresh-token');

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'TEACHER',
        })
      );
      expect(jwtService.sign).not.toHaveBeenCalledWith(
        expect.objectContaining({
          contextRole: expect.anything(),
        })
      );
    });

    it('should refresh with dual payload when flag enabled', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockFeatureFlags.isEnabled.mockResolvedValue(true);
      mockJwt.verify.mockReturnValue({ sub: 'user-123' });

      await service.refreshAccessToken('valid-refresh-token');

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          systemRole: 'USER',
          contextRole: 'TEACHER',
          activeInstitutionId: 'inst-123',
        })
      );
    });
  });

  describe('switchContext', () => {
    it('should update activeInstitutionId and return new token', async () => {
      const dbUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'TEACHER',
        system_role: 'USER',
        context_role: 'TEACHER',
        active_institution_id: 'new-inst-id',
      };

      mockPrisma.user.update.mockResolvedValue(dbUser);
      mockFeatureFlags.isEnabled.mockResolvedValue(true);

      const result = await service.switchContext('user-123', 'new-inst-id');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { activeInstitutionId: 'new-inst-id' },
        select: expect.any(Object),
      });
      
      expect(result).toHaveProperty('access_token');
    });
  });
});
