import { Test, TestingModule } from "@nestjs/testing";
import { TransferMissionsService } from "./transfer-missions.service";
import { ITransferMissionRepository } from "./domain/transfer-mission.repository.interface";

describe("TransferMissionsService", () => {
  let service: TransferMissionsService;
  let repository: jest.Mocked<ITransferMissionRepository>;

  const mockFindAll = jest.fn();
  const mockFindById = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferMissionsService,
        {
          provide: ITransferMissionRepository,
          useValue: {
            findAll: mockFindAll,
            findById: mockFindById,
            create: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TransferMissionsService>(TransferMissionsService);
    repository = module.get(
      ITransferMissionRepository,
    ) as jest.Mocked<ITransferMissionRepository>;
  });

  describe("listMissions", () => {
    it("should return all GLOBAL missions when no scope provided", async () => {
      const mockMissions = [
        {
          id: "1",
          type: "HUGGING",
          title: "Hugging (Contexto-alvo)",
          scopeType: "GLOBAL",
          isActive: true,
        },
        {
          id: "2",
          type: "BRIDGING",
          title: "Bridging (Princípio abstrato)",
          scopeType: "GLOBAL",
          isActive: true,
        },
      ];

      mockFindAll.mockResolvedValue(mockMissions as any);

      const result = await service.listMissions({});

      expect(mockFindAll).toHaveBeenCalledWith({});
      expect(result).toEqual(mockMissions);
    });

    it("should return GLOBAL + FAMILY missions when familyId provided", async () => {
      const mockMissions = [
        {
          id: "1",
          type: "HUGGING",
          scopeType: "GLOBAL",
          familyId: null,
        },
        {
          id: "2",
          type: "BRIDGING",
          scopeType: "FAMILY",
          familyId: "family-123",
        },
      ];

      mockFindAll.mockResolvedValue(mockMissions as any);

      const result = await service.listMissions({ familyId: "family-123" });

      expect(mockFindAll).toHaveBeenCalledWith({ familyId: "family-123" });
      expect(result).toHaveLength(2);
      expect(result[0].scopeType).toBe("GLOBAL");
      expect(result[1].scopeType).toBe("FAMILY");
    });

    it("should return GLOBAL + INSTITUTION missions when institutionId provided", async () => {
      const mockMissions = [
        {
          id: "1",
          type: "HUGGING",
          scopeType: "GLOBAL",
          institutionId: null,
        },
        {
          id: "2",
          type: "TIER2",
          scopeType: "INSTITUTION",
          institutionId: "inst-456",
        },
      ];

      mockFindAll.mockResolvedValue(mockMissions as any);

      const result = await service.listMissions({
        institutionId: "inst-456",
      });

      expect(mockFindAll).toHaveBeenCalledWith({ institutionId: "inst-456" });
      expect(result).toHaveLength(2);
    });

    it("should filter by isActive flag", async () => {
      mockFindAll.mockResolvedValue([]);

      await service.listMissions({ isActive: false });

      expect(mockFindAll).toHaveBeenCalledWith({ isActive: false });
    });

    it("should return all scopes when both familyId and institutionId provided", async () => {
      const mockMissions = [
        { id: "1", scopeType: "GLOBAL" },
        { id: "2", scopeType: "FAMILY", familyId: "fam-1" },
        { id: "3", scopeType: "INSTITUTION", institutionId: "inst-1" },
      ];

      mockFindAll.mockResolvedValue(mockMissions as any);

      const result = await service.listMissions({
        familyId: "fam-1",
        institutionId: "inst-1",
      });

      expect(result).toHaveLength(3);
    });
  });

  describe("getMissionById", () => {
    it("should return mission when found", async () => {
      const mockMission = {
        id: "mission-1",
        type: "HUGGING",
        title: "Test Mission",
      };

      mockFindById.mockResolvedValue(mockMission as any);

      const result = await service.getMissionById("mission-1");

      expect(mockFindById).toHaveBeenCalledWith("mission-1");
      expect(result).toEqual(mockMission);
    });

    it("should return null when mission not found", async () => {
      mockFindById.mockResolvedValue(null);

      const result = await service.getMissionById("non-existent");

      expect(result).toBeNull();
    });
  });
});
