"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const family_service_1 = require("../../src/family/family.service");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const subscription_service_1 = require("../../src/billing/subscription.service");
const usage_tracking_service_1 = require("../../src/billing/usage-tracking.service");
const enforcement_service_1 = require("../../src/billing/enforcement.service");
const email_service_1 = require("../../src/email/email.service");
const client_1 = require("@prisma/client");
describe("FamilyService (Unit)", () => {
    let service;
    let prismaService;
    let subscriptionService;
    let emailService;
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
        const module = await testing_1.Test.createTestingModule({
            providers: [
                family_service_1.FamilyService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: subscription_service_1.SubscriptionService, useValue: mockSubscriptionService },
                { provide: usage_tracking_service_1.UsageTrackingService, useValue: {} },
                { provide: enforcement_service_1.EnforcementService, useValue: {} },
                { provide: email_service_1.EmailService, useValue: mockEmailService },
            ],
        }).compile();
        service = module.get(family_service_1.FamilyService);
        prismaService = module.get(prisma_service_1.PrismaService);
        subscriptionService = module.get(subscription_service_1.SubscriptionService);
        emailService = module.get(email_service_1.EmailService);
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
            prismaService.families.create.mockResolvedValue(createdFamily);
            prismaService.users.findUnique.mockResolvedValue({
                id: userId,
                settings: {},
            });
            await service.create(userId, dto);
            expect(prismaService.families.create).toHaveBeenCalled();
            expect(subscriptionService.createInitialSubscription).toHaveBeenCalledWith(client_1.ScopeType.FAMILY, createdFamily.id, expect.anything());
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
            prismaService.users.findUnique.mockResolvedValue({
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
            prismaService.families.findUnique.mockResolvedValue(mockFamily);
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
            prismaService.families.findUnique.mockResolvedValue(mockFamily);
            await service.transferOwnership(familyId, currentOwnerId, newOwnerId);
            expect(prismaService.families.update).toHaveBeenCalledWith({
                where: { id: familyId },
                data: { owner_user_id: newOwnerId },
            });
        });
    });
});
//# sourceMappingURL=family.service.spec.js.map