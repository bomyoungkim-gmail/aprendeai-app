import { Test, TestingModule } from "@nestjs/testing";
import { FamilyService } from "../../src/family/family.service";
import { PrismaService } from "../../src/prisma/prisma.service";
import { SubscriptionService } from "../../src/billing/subscription.service";
import { UsageTrackingService } from "../../src/billing/usage-tracking.service";
import { EnforcementService } from "../../src/billing/enforcement.service";
import { EmailService } from "../../src/email/email.service";

import { ScopeType } from "@prisma/client";

describe("FamilyService (Unit)", () => {
  let service: FamilyService;
  let prismaService: PrismaService;
  let subscriptionService: SubscriptionService;
  let emailService: EmailService;

  const mockPrismaService = {
    users: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    families: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
    family_members: {
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
    createInitialSubscription: jest.fn(),
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
    prismaService = module.get<PrismaService>(PrismaService);
    subscriptionService = module.get<SubscriptionService>(SubscriptionService);
    emailService = module.get<EmailService>(EmailService);

    jest.clearAllMocks();
  });

  describe("create()", () => {
    const userId = "user-123";
    const dto = { name: "New Family" };
    const createdFamily = {
      id: "family-id",
      name: dto.name,
      owner_user_id: userId,
      created_at: new Date(),
      updated_at: new Date(),
    };

    it("should create family and auto-set as primaryFamilyId", async () => {
      (prismaService.families.create as jest.Mock).mockResolvedValue(
        createdFamily,
      );

      (prismaService.users.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        settings: {},
      });

      await service.create(userId, dto);

      expect(prismaService.families.create).toHaveBeenCalled();
      expect(
        subscriptionService.createInitialSubscription,
      ).toHaveBeenCalledWith(
        ScopeType.FAMILY,
        createdFamily.id,
        expect.anything(),
      );

      expect(prismaService.users.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({
          settings: expect.objectContaining({
            primaryFamilyId: createdFamily.id,
          }),
        }),
      });
    });
  });

  describe("getFamilyForOwner", () => {
    it("should return family data with stats", async () => {
      const userId = "user-123";
      const familyId = "family-456";

      (prismaService.users.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        settings: { primaryFamilyId: familyId },
      });

      const mockFamily = {
        id: familyId,
        name: "Test Family",
        owner_user_id: userId,
        family_members: [
          {
            id: "m1",
            user_id: userId,
            role: "OWNER",
            status: "ACTIVE",
            users: { id: userId, name: "Owner" },
          },
          {
            id: "m2",
            user_id: "other",
            role: "CHILD",
            status: "ACTIVE",
            users: { id: "other", name: "Child" },
          },
        ],
      };

      (prismaService.families.findUnique as jest.Mock).mockResolvedValue(
        mockFamily,
      );

      const result = await service.getFamilyForOwner(userId);

      expect(result).toBeDefined();
      expect(result.id).toBe(familyId);
      expect(result.stats.totalMembers).toBe(2);
      expect(result.stats.activeMembers).toBe(2);
    });
  });

  describe("transferOwnership()", () => {
    const familyId = "f1";
    const currentOwnerId = "u1";
    const newOwnerId = "u2";

    const mockFamily = {
      id: familyId,
      owner_user_id: currentOwnerId,
      family_members: [
        { user_id: currentOwnerId, role: "OWNER" },
        { user_id: newOwnerId, role: "GUARDIAN" },
      ],
    };

    it("should transfer ownership successfully", async () => {
      (prismaService.families.findUnique as jest.Mock).mockResolvedValue(
        mockFamily,
      );

      await service.transferOwnership(familyId, currentOwnerId, newOwnerId);

      expect(prismaService.families.update).toHaveBeenCalledWith({
        where: { id: familyId },
        data: { owner_user_id: newOwnerId },
      });
    });
  });
});
