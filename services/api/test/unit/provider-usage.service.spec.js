"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const provider_usage_service_1 = require("../../src/observability/provider-usage.service");
const prisma_service_1 = require("../../src/prisma/prisma.service");
describe("ProviderUsageService", () => {
    let service;
    let prisma;
    const mockPrismaService = {
        provider_usage: {
            create: jest.fn(),
            aggregate: jest.fn(),
            findMany: jest.fn(),
            groupBy: jest.fn(),
            deleteMany: jest.fn(),
        },
        users: {
            findUnique: jest.fn(),
        },
        family_members: {
            findFirst: jest.fn(),
        },
        $queryRaw: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                provider_usage_service_1.ProviderUsageService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();
        service = module.get(provider_usage_service_1.ProviderUsageService);
        prisma = module.get(prisma_service_1.PrismaService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe("trackUsage", () => {
        it("should track usage with granular token data", async () => {
            const usageData = {
                provider: "educator_agent",
                operation: "turn",
                tokens: 100,
                promptTokens: 60,
                completionTokens: 40,
                costUsd: 0.001,
                userId: "user-123",
                familyId: "family-456",
                feature: "educator_chat",
                metadata: { sessionId: "session-789" },
            };
            mockPrismaService.provider_usage.create.mockResolvedValue(Object.assign(Object.assign({ id: "usage-1" }, usageData), { timestamp: new Date() }));
            await service.trackUsage(usageData);
            expect(mockPrismaService.provider_usage.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    provider: "educator_agent",
                    operation: "turn",
                    prompt_tokens: 60,
                    completion_tokens: 40,
                    total_tokens: 100,
                    cost_usd: 0.001,
                    user_id: "user-123",
                    family_id: "family-456",
                    feature: "educator_chat",
                }),
            });
        });
        it("should handle missing optional fields gracefully", async () => {
            const minimalData = {
                provider: "test-provider",
                operation: "test-op",
                tokens: 50,
            };
            mockPrismaService.provider_usage.create.mockResolvedValue(Object.assign(Object.assign({ id: "usage-2" }, minimalData), { timestamp: new Date() }));
            await service.trackUsage(minimalData);
            expect(mockPrismaService.provider_usage.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    provider: "test-provider",
                    operation: "test-op",
                    feature: "unknown",
                }),
            });
        });
        it("should not throw on database error", async () => {
            mockPrismaService.provider_usage.create.mockRejectedValue(new Error("Database error"));
            await expect(service.trackUsage({
                provider: "test",
                operation: "test",
                tokens: 10,
            })).resolves.not.toThrow();
        });
        it("should map costUsd correctly when only costUsd is provided", async () => {
            const data = {
                provider: "openai",
                operation: "completion",
                tokens: 100,
                costUsd: 0.005,
            };
            mockPrismaService.provider_usage.create.mockResolvedValue(Object.assign({ id: "usage-3" }, data));
            await service.trackUsage(data);
            expect(mockPrismaService.provider_usage.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    cost_usd: 0.005,
                }),
            });
        });
    });
    describe("getUsageStats", () => {
        it("should return aggregated statistics", async () => {
            const from = new Date("2025-12-01");
            const to = new Date("2025-12-31");
            mockPrismaService.provider_usage.aggregate.mockResolvedValue({
                _count: 10,
                _sum: { tokens: 1000, cost_usd: 0.05 },
                _avg: { latency: 1200, cost_usd: 0.005 },
            });
            const stats = await service.getUsageStats({ from, to });
            expect(stats).toEqual({
                totalCalls: 10,
                totalTokens: 1000,
                totalCost: 0.05,
                avgLatency: 1200,
                avgCost: 0.005,
            });
            expect(mockPrismaService.provider_usage.aggregate).toHaveBeenCalledWith({
                where: { timestamp: { gte: from, lte: to } },
                _sum: { tokens: true, cost_usd: true },
                _count: true,
                _avg: { latency: true, cost_usd: true },
            });
        });
    });
    describe("getUsageByProvider", () => {
        it("should group usage by provider", async () => {
            const mockUsageData = [
                {
                    provider: "openai",
                    operation: "completion",
                    tokens: 100,
                    cost_usd: 0.01,
                    latency: 1000,
                },
                {
                    provider: "openai",
                    operation: "completion",
                    tokens: 150,
                    cost_usd: 0.015,
                    latency: 1200,
                },
                {
                    provider: "anthropic",
                    operation: "completion",
                    tokens: 200,
                    cost_usd: 0.02,
                    latency: 1100,
                },
            ];
            mockPrismaService.provider_usage.findMany.mockResolvedValue(mockUsageData);
            const result = await service.getUsageByProvider(new Date("2025-12-01"), new Date("2025-12-31"));
            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({
                provider: "openai",
                calls: 2,
                tokens: 250,
            });
            expect(result[1]).toMatchObject({
                provider: "anthropic",
                calls: 1,
                tokens: 200,
            });
        });
    });
});
//# sourceMappingURL=provider-usage.service.spec.js.map