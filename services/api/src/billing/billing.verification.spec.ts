import { Test, TestingModule } from "@nestjs/testing";
import { EntitlementsService, FREE_LIMITS } from "./entitlements.service";
import { SubscriptionService } from "./subscription.service";
import { PrismaService } from "../prisma/prisma.service";

describe("EntitlementsService (Hierarchy Verification)", () => {
  let service: EntitlementsService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    entitlementSnapshot: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    plan: {
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

  it("should return FREE limits if no subscriptions found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-free",
      institutionMemberships: [],
      memberships: [], // Family
      subscriptions: [], // Individual
    });

    const result = await service.computeEntitlements("user-free");
    expect(result.source).toBe("FREE");
    expect(result.planType).toBe("FREE");
    expect(result.limits).toEqual(FREE_LIMITS);
  });

  it("should return ORG limits if user has active institution subscription", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-org",
      institutionMemberships: [
        {
          status: "ACTIVE",
          institution: {
            subscriptions: [
              {
                status: "ACTIVE",
                plan: {
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
      ],
      memberships: [],
      subscriptions: [],
    });

    const result = await service.computeEntitlements("user-org");
    expect(result.source).toBe("ORG");
    expect(result.planType).toBe("INSTITUTION");
    expect(result.limits).toHaveProperty("seats", 100);
    expect(result.features).toHaveProperty("sso", true);
  });

  it("should return FAMILY limits if no Org but active Family subscription", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-family",
      institutionMemberships: [],
      memberships: [
        {
          status: "ACTIVE",
          family: {
            subscriptions: [
              {
                status: "ACTIVE",
                plan: {
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

  it("should prioritize ORG over FAMILY and INDIVIDUAL", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-multi",
      institutionMemberships: [
        {
          status: "ACTIVE",
          institution: {
            subscriptions: [
              {
                status: "ACTIVE",
                plan: {
                  type: "INSTITUTION",
                  entitlements: { limits: { x: 999 } },
                },
              },
            ],
          },
        },
      ],
      memberships: [
        {
          status: "ACTIVE",
          family: {
            subscriptions: [
              {
                status: "ACTIVE",
                plan: { type: "FAMILY", entitlements: { limits: { x: 50 } } },
              },
            ],
          },
        },
      ],
      subscriptions: [
        {
          status: "ACTIVE",
          plan: {
            type: "INDIVIDUAL_PREMIUM",
            entitlements: { limits: { x: 10 } },
          },
        },
      ],
    });

    const result = await service.computeEntitlements("user-multi");
    expect(result.source).toBe("ORG");
    expect(result.limits).toHaveProperty("x", 999);
  });
});
