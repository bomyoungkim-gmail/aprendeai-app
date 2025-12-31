"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const institutions_service_1 = require("../../src/institutions/institutions.service");
const prisma_service_1 = require("../../src/prisma/prisma.service");
describe("InstitutionsService - getInstitutionForAdmin", () => {
    let service;
    let prisma;
    const mockPrisma = {
        institution_members: {
            findFirst: jest.fn(),
            count: jest.fn(),
        },
        institution_invites: {
            count: jest.fn(),
        },
        pending_user_approvals: {
            count: jest.fn(),
        },
        institution_domains: {
            findMany: jest.fn(),
        },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                institutions_service_1.InstitutionsService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: mockPrisma,
                },
            ],
        }).compile();
        service = module.get(institutions_service_1.InstitutionsService);
        prisma = module.get(prisma_service_1.PrismaService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it("should be defined", () => {
        expect(service).toBeDefined();
    });
    describe("getInstitutionForAdmin", () => {
        it("should return institution data with aggregated stats", async () => {
            const userId = "user-123";
            const institutionId = "inst-456";
            const mockInstitutionMember = {
                user_id: userId,
                institution_id: institutionId,
                role: "INSTITUTION_EDUCATION_ADMIN",
                status: "ACTIVE",
                institutions: {
                    id: institutionId,
                    name: "Test School",
                    type: "SCHOOL",
                    city: "São Paulo",
                    state: "SP",
                },
            };
            mockPrisma.institution_members.findFirst.mockResolvedValue(mockInstitutionMember);
            mockPrisma.institution_members.count.mockResolvedValue(45);
            mockPrisma.institution_invites.count.mockResolvedValue(3);
            mockPrisma.pending_user_approvals.count.mockResolvedValue(2);
            mockPrisma.institution_domains.findMany.mockResolvedValue([
                { domain: "@school.edu" },
                { domain: "@test.school.edu" },
            ]);
            const result = await service.getInstitutionForAdmin(userId);
            expect(result).toEqual({
                id: institutionId,
                name: "Test School",
                type: "SCHOOL",
                city: "São Paulo",
                state: "SP",
                memberCount: 45,
                activeInvites: 3,
                pendingApprovals: 2,
                domains: ["@school.edu", "@test.school.edu"],
            });
            expect(mockPrisma.institution_members.findFirst).toHaveBeenCalledWith({
                where: {
                    user_id: userId,
                    role: "INSTITUTION_EDUCATION_ADMIN",
                    status: "ACTIVE",
                },
                include: {
                    institutions: true,
                },
            });
            expect(mockPrisma.institution_members.count).toHaveBeenCalledWith({
                where: { institution_id: institutionId, status: "ACTIVE" },
            });
            expect(mockPrisma.institution_invites.count).toHaveBeenCalledWith({
                where: {
                    institution_id: institutionId,
                    used_at: null,
                    expires_at: { gt: expect.any(Date) },
                },
            });
            expect(mockPrisma.pending_user_approvals.count).toHaveBeenCalledWith({
                where: { institution_id: institutionId, status: "PENDING" },
            });
            expect(mockPrisma.institution_domains.findMany).toHaveBeenCalledWith({
                where: { institution_id: institutionId },
                select: { domain: true },
            });
        });
        it("should throw error if user is not an institution admin", async () => {
            const userId = "user-123";
            mockPrisma.institution_members.findFirst.mockResolvedValue(null);
            await expect(service.getInstitutionForAdmin(userId)).rejects.toThrow("Insufficient permissions");
            expect(mockPrisma.institution_members.findFirst).toHaveBeenCalledWith({
                where: {
                    user_id: userId,
                    role: "INSTITUTION_EDUCATION_ADMIN",
                    status: "ACTIVE",
                },
                include: {
                    institutions: true,
                },
            });
        });
        it("should return zero counts when no data exists", async () => {
            const userId = "user-123";
            const institutionId = "inst-456";
            const mockInstitutionMember = {
                user_id: userId,
                institution_id: institutionId,
                role: "INSTITUTION_EDUCATION_ADMIN",
                status: "ACTIVE",
                institutions: {
                    id: institutionId,
                    name: "Empty School",
                    type: "SCHOOL",
                },
            };
            mockPrisma.institution_members.findFirst.mockResolvedValue(mockInstitutionMember);
            mockPrisma.institution_members.count.mockResolvedValue(0);
            mockPrisma.institution_invites.count.mockResolvedValue(0);
            mockPrisma.pending_user_approvals.count.mockResolvedValue(0);
            mockPrisma.institution_domains.findMany.mockResolvedValue([]);
            const result = await service.getInstitutionForAdmin(userId);
            expect(result.memberCount).toBe(0);
            expect(result.activeInvites).toBe(0);
            expect(result.pendingApprovals).toBe(0);
            expect(result.domains).toEqual([]);
        });
    });
});
//# sourceMappingURL=institutions-service.spec.js.map