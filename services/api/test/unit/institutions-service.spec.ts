import { Test, TestingModule } from "@nestjs/testing";
import { InstitutionsService } from "../../src/institutions/institutions.service";
import { PrismaService } from "../../src/prisma/prisma.service";

describe("InstitutionsService - getInstitutionForAdmin", () => {
  let service: InstitutionsService;
  let prisma: PrismaService;

  const mockPrisma = {
    institutionMember: {
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    institutionInvite: {
      count: jest.fn(),
    },
    pendingUserApproval: {
      count: jest.fn(),
    },
    institutionDomain: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstitutionsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<InstitutionsService>(InstitutionsService);
    prisma = module.get<PrismaService>(PrismaService);
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
        userId,
        institutionId,
        role: "INSTITUTION_ADMIN",
        status: "ACTIVE",
        institution: {
          id: institutionId,
          name: "Test School",
          type: "SCHOOL",
          city: "São Paulo",
          state: "SP",
        },
      };

      mockPrisma.institutionMember.findFirst.mockResolvedValue(
        mockInstitutionMember,
      );
      mockPrisma.institutionMember.count.mockResolvedValue(45);
      mockPrisma.institutionInvite.count.mockResolvedValue(3);
      mockPrisma.pendingUserApproval.count.mockResolvedValue(2);
      mockPrisma.institutionDomain.findMany.mockResolvedValue([
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

      expect(mockPrisma.institutionMember.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          role: "INSTITUTION_ADMIN",
          status: "ACTIVE",
        },
        include: {
          institution: true,
        },
      });

      expect(mockPrisma.institutionMember.count).toHaveBeenCalledWith({
        where: { institutionId, status: "ACTIVE" },
      });

      expect(mockPrisma.institutionInvite.count).toHaveBeenCalledWith({
        where: {
          institutionId,
          usedAt: null,
          expiresAt: { gt: expect.any(Date) },
        },
      });

      expect(mockPrisma.pendingUserApproval.count).toHaveBeenCalledWith({
        where: { institutionId, status: "PENDING" },
      });

      expect(mockPrisma.institutionDomain.findMany).toHaveBeenCalledWith({
        where: { institutionId },
        select: { domain: true },
      });
    });

    it("should throw error if user is not an institution admin", async () => {
      const userId = "user-123";

      mockPrisma.institutionMember.findFirst.mockResolvedValue(null);

      await expect(service.getInstitutionForAdmin(userId)).rejects.toThrow(
        "User is not an institution admin",
      );

      expect(mockPrisma.institutionMember.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          role: "INSTITUTION_ADMIN",
          status: "ACTIVE",
        },
        include: {
          institution: true,
        },
      });
    });

    it("should return zero counts when no data exists", async () => {
      const userId = "user-123";
      const institutionId = "inst-456";

      const mockInstitutionMember = {
        userId,
        institutionId,
        role: "INSTITUTION_ADMIN",
        status: "ACTIVE",
        institution: {
          id: institutionId,
          name: "Empty School",
          type: "SCHOOL",
        },
      };

      mockPrisma.institutionMember.findFirst.mockResolvedValue(
        mockInstitutionMember,
      );
      mockPrisma.institutionMember.count.mockResolvedValue(0);
      mockPrisma.institutionInvite.count.mockResolvedValue(0);
      mockPrisma.pendingUserApproval.count.mockResolvedValue(0);
      mockPrisma.institutionDomain.findMany.mockResolvedValue([]);

      const result = await service.getInstitutionForAdmin(userId);

      expect(result.memberCount).toBe(0);
      expect(result.activeInvites).toBe(0);
      expect(result.pendingApprovals).toBe(0);
      expect(result.domains).toEqual([]);
    });
  });
});
