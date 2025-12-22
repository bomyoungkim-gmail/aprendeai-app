import { Test, TestingModule } from '@nestjs/testing';
import { FamilyPolicyService } from './family-policy.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PromptLibraryService } from '../../prompts/prompt-library.service';
import { FamilyEventService } from '../../events/family-event.service';

describe('FamilyPolicyService', () => {
  let service: FamilyPolicyService;
  let prisma: PrismaService;

  const mockPrismaService = {
    familyPolicy: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockPromptLibrary = {
    getPrompt: jest.fn(),
  };

  const mockEventService = {
    logPolicySet: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FamilyPolicyService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PromptLibraryService, useValue: mockPromptLibrary },
        { provide: FamilyEventService, useValue: mockEventService },
      ],
    }).compile();

    service = module.get<FamilyPolicyService>(FamilyPolicyService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a family policy with defaults', async () => {
      const dto = {
        familyId: 'fam_123',
        learnerUserId: 'user_456',
      };

      const mockPolicy = {
        id: 'policy_1',
        ...dto,
        timeboxDefaultMin: 15,
        dailyMinMinutes: 15,
        privacyMode: 'AGGREGATED_ONLY',
      };

      mockPrismaService.familyPolicy.create.mockResolvedValue(mockPolicy);

      const result = await service.create(dto);

      expect(result).toEqual(mockPolicy);
      expect(mockPrismaService.familyPolicy.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          familyId: 'fam_123',
          learnerUserId: 'user_456',
          timeboxDefaultMin: 15,
        }),
        include: { family: true, learner: true },
      });
      expect(mockEventService.logPolicySet).toHaveBeenCalled();
    });

    it('should use provided values over defaults', async () => {
      const dto = {
        familyId: 'fam_123',
        learnerUserId: 'user_456',
        timeboxDefaultMin: 30,
        privacyMode: 'AGGREGATED_PLUS_TRIGGERS' as const,
      };

      mockPrismaService.familyPolicy.create.mockResolvedValue({ id: 'policy_1', ...dto });

      await service.create(dto);

      expect(mockPrismaService.familyPolicy.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          timeboxDefaultMin: 30,
          privacyMode: 'AGGREGATED_PLUS_TRIGGERS',
        }),
        include: { family: true, learner: true },
      });
    });
  });

  describe('getByFamilyAndLearner', () => {
    it('should retrieve policy', async () => {
      const mockPolicy = { id: 'policy_1', familyId: 'fam_123' };
      mockPrismaService.familyPolicy.findUnique.mockResolvedValue(mockPolicy);

      const result = await service.getByFamilyAndLearner('fam_123', 'user_456');

      expect(result).toEqual(mockPolicy);
      expect(mockPrismaService.familyPolicy.findUnique).toHaveBeenCalledWith({
        where: {
          familyId_learnerUserId: {
            familyId: 'fam_123',
            learnerUserId: 'user_456',
          },
        },
        include: { family: true, learner: true },
      });
    });

    it('should throw NotFoundException if policy not found', async () => {
      mockPrismaService.familyPolicy.findUnique.mockResolvedValue(null);

      await expect(
        service.getByFamilyAndLearner('fam_123', 'user_456'),
      ).rejects.toThrow('Policy not found');
    });
  });

  describe('getConfirmationPrompt', () => {
    it('should return confirmation prompt with interpolated values', async () => {
      const mockPolicy = {
        id: 'policy_1',
        timeboxDefaultMin: 20,
      };
      const mockPrompt = {
        key: 'FAM_CONTRACT_CONFIRM',
        nextPrompt: 'Combinado: 20 min...',
      };

      mockPrismaService.familyPolicy.findUnique.mockResolvedValue(mockPolicy);
      mockPromptLibrary.getPrompt.mockReturnValue(mockPrompt);

      const result = await service.getConfirmationPrompt('policy_1');

      expect(result).toEqual(mockPrompt);
      expect(mockPromptLibrary.getPrompt).toHaveBeenCalledWith(
        'FAM_CONTRACT_CONFIRM',
        { MIN: 20 },
      );
    });
  });
});
