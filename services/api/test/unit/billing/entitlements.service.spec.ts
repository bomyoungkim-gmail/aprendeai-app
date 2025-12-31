import { Test, TestingModule } from "@nestjs/testing";
import {
  EntitlementsService,
  FREE_LIMITS,
} from "../../../src/billing/entitlements.service";
import { SubscriptionService } from "../../../src/billing/subscription.service";
import { PrismaService } from "../../../src/prisma/prisma.service";

describe("EntitlementsService (Unit)", () => {
  let service: EntitlementsService;
  let prisma: PrismaService;

  const mockPrisma = {
    users: {
      findUnique: jest.fn(),
    },
    entitlement_snapshots: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
    plans: {
      findUnique: jest.fn(),
    },
  };

  const mockSubscriptionService = {
    getActiveSubscription: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntitlementsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SubscriptionService, useValue: mockSubscriptionService },
      ],
    }).compile();

    service = module.get<EntitlementsService>(EntitlementsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("computeEntitlements", () => {
    it("should return FREE limits if no subscriptions found", async () => {
      mockPrisma.users.findUnique.mockResolvedValue({
        id: "user-free",
        institution_members: null,
        family_members: [],
        subscriptions: [],
      });
      // Mock Plan lookup for fallback
      mockPrisma.plans.findUnique.mockResolvedValue({
        code: "FREE",
        entitlements: { limits: FREE_LIMITS },
      });

      const result = await service.computeEntitlements("user-free");
      expect(result.source).toBe("FREE");
      expect(result.planType).toBe("FREE");
      expect(result.limits).toEqual(FREE_LIMITS);
    });

    it("should return ORG limits if user has active institution subscription", async () => {
      mockPrisma.users.findUnique.mockResolvedValue({
        id: "user-org",
        institution_members: {
          status: "ACTIVE",
          institutions: {
            subscriptions: [
              {
                status: "ACTIVE",
                plans: {
                  type: "INSTITUTION",
                  entitlements: {
                    limits: { seats: 100 },
                    features: { sso: true },
                  },
                },
              },
            ],
          },
        },
        family_members: [],
        subscriptions: [],
      });

      const result = await service.computeEntitlements("user-org");
      expect(result.source).toBe("ORG");
      expect(result.planType).toBe("INSTITUTION");
      expect(result.limits).toHaveProperty("seats", 100);
      expect(result.features).toHaveProperty("sso", true);
    });

    it("should return FAMILY limits if no Org but active Family subscription", async () => {
      mockPrisma.users.findUnique.mockResolvedValue({
        id: "user-family",
        institution_members: null,
        family_members: [
          {
            status: "ACTIVE",
            families: {
              subscriptions: [
                {
                  status: "ACTIVE",
                  plans: {
                    type: "FAMILY",
                    entitlements: {
                      limits: { members: 5 },
                      features: { kidsFields: true },
                    },
                  },
                },
              ],
            },
          },
        ],
        subscriptions: [],
      });

      const result = await service.computeEntitlements("user-family");
      expect(result.source).toBe("FAMILY");
      expect(result.planType).toBe("FAMILY");
    });
  });
});
