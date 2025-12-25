import { Test, TestingModule } from "@nestjs/testing";
import { BulkService } from "./bulk.service";
import { PrismaService } from "../prisma/prisma.service";

describe("BulkService", () => {
  let service: BulkService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    institutionMember: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BulkService>(BulkService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("bulkInviteFromCSV", () => {
    it("should process valid CSV and invite users", async () => {
      const csvData = "email,name,role\ntest@example.com,Test User,STUDENT";
      const buffer = Buffer.from(csvData);

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
      });
      mockPrismaService.institutionMember.create.mockResolvedValue({});

      const result = await service.bulkInviteFromCSV("inst-1", buffer);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockPrismaService.institutionMember.create).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      const csvData = "email,name,role\n,Invalid User,STUDENT"; // Missing email
      const buffer = Buffer.from(csvData);

      const result = await service.bulkInviteFromCSV("inst-1", buffer);

      expect(result.failed).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("bulkApprovePending", () => {
    it("should approve multiple users", async () => {
      mockPrismaService.institutionMember.update.mockResolvedValue({});

      const result = await service.bulkApprovePending(
        "inst-1",
        ["user-1", "user-2"],
        "approve",
      );

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(mockPrismaService.institutionMember.update).toHaveBeenCalledTimes(
        2,
      );
    });

    it("should reject multiple users", async () => {
      mockPrismaService.institutionMember.delete.mockResolvedValue({});

      const result = await service.bulkApprovePending(
        "inst-1",
        ["user-1", "user-2"],
        "reject",
      );

      expect(result.success).toBe(2);
      expect(mockPrismaService.institutionMember.delete).toHaveBeenCalledTimes(
        2,
      );
    });
  });

  describe("exportMembersCSV", () => {
    it("should export members as CSV", async () => {
      mockPrismaService.institutionMember.findMany.mockResolvedValue([
        {
          user: {
            id: "user-1",
            email: "test1@example.com",
            name: "User 1",
          },
          role: "STUDENT",
          status: "ACTIVE",
          joinedAt: new Date("2024-01-01"),
        },
        {
          user: {
            id: "user-2",
            email: "test2@example.com",
            name: "User 2",
          },
          role: "TEACHER",
          status: "ACTIVE",
          joinedAt: new Date("2024-01-02"),
        },
      ]);

      const csv = await service.exportMembersCSV("inst-1");

      expect(csv).toContain("Email,Name,Role,Status,Joined");
      expect(csv).toContain("test1@example.com");
      expect(csv).toContain("test2@example.com");
      expect(csv).toContain("STUDENT");
      expect(csv).toContain("TEACHER");
    });
  });
});
