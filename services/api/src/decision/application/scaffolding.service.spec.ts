import { Test, TestingModule } from "@nestjs/testing";
import { ScaffoldingService } from "./scaffolding.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ScaffoldingLevel } from "../domain/scaffolding.types";

describe("ScaffoldingService", () => {
  let service: ScaffoldingService;
  let prisma: PrismaService;

  const mockPrisma = {
    learner_profiles: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScaffoldingService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ScaffoldingService>(ScaffoldingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getScaffoldingConfig", () => {
    it("should return correct config for each level", () => {
      const levels: ScaffoldingLevel[] = [0, 1, 2, 3];
      levels.forEach((level) => {
        const config = service.getScaffoldingConfig(level);
        expect(config.level).toBe(level);
        expect(config.rules).toBeDefined();
      });

      expect(service.getScaffoldingConfig(3).name).toBe("High");
      expect(service.getScaffoldingConfig(0).name).toBe("Fade");
    });
  });

  describe("getThresholdMultipliers", () => {
    it("should return correct multipliers for L3 (High)", () => {
      const multipliers = service.getThresholdMultipliers(3);
      expect(multipliers.doubtSensitivity).toBe(1.0);
      expect(multipliers.checkpointFrequency).toBe(1.0);
    });

    it("should return restrictive multipliers for L0 (Fade)", () => {
      const multipliers = service.getThresholdMultipliers(0);
      expect(multipliers.doubtSensitivity).toBe(99.0);
      expect(multipliers.checkpointFrequency).toBe(0.2);
    });
  });

  describe("calculateFadingLevel", () => {
    const userId = "user-123";

    it("should return L3 if no profile exists", async () => {
      mockPrisma.learner_profiles.findUnique.mockResolvedValue(null);
      const level = await service.calculateFadingLevel(userId);
      expect(level).toBe(3);
    });

    it("should respect FORCE_HIGH override", async () => {
      mockPrisma.learner_profiles.findUnique.mockResolvedValue({
        mastery_state_json: {},
        scaffolding_state_json: { overrideMode: "FORCE_HIGH" },
      });
      const level = await service.calculateFadingLevel(userId);
      expect(level).toBe(3);
    });

    it("should return L0 (Fade) for high mastery and consistency", async () => {
      mockPrisma.learner_profiles.findUnique.mockResolvedValue({
        mastery_state_json: {
          domains: {
            biology: { mastery: 0.85, consistencyCount: 3 },
          },
        },
        scaffolding_state_json: {},
      });
      const level = await service.calculateFadingLevel(userId, {
        domain: "biology",
      });
      expect(level).toBe(0);
    });

    it("should return L3 for low mastery", async () => {
      mockPrisma.learner_profiles.findUnique.mockResolvedValue({
        mastery_state_json: {
          domains: {
            biology: { mastery: 0.2, consistencyCount: 0 },
          },
        },
        scaffolding_state_json: {},
      });
      const level = await service.calculateFadingLevel(userId, {
        domain: "biology",
      });
      expect(level).toBe(3);
    });

    it("should return L1 for medium-high mastery but low consistency", async () => {
      mockPrisma.learner_profiles.findUnique.mockResolvedValue({
        mastery_state_json: {
          domains: {
            biology: { mastery: 0.85, consistencyCount: 1 },
          },
        },
        scaffolding_state_json: {},
      });
      const level = await service.calculateFadingLevel(userId, {
        domain: "biology",
      });
      expect(level).toBe(1);
    });
  });

  describe("updateMastery", () => {
    const userId = "user-123";

    it("should update domain mastery on success", async () => {
      const initialMastery = {
        domains: {
          biology: {
            mastery: 0.5,
            lastEvidenceAt: new Date().toISOString(),
            missionHistory: {},
            consistencyCount: 2,
          },
        },
        tier2: {},
        morphology: {},
      };

      mockPrisma.learner_profiles.findUnique.mockResolvedValue({
        mastery_state_json: initialMastery,
        scaffolding_state_json: {},
      });

      await service.updateMastery(userId, {
        type: "quiz_correct",
        domain: "biology",
        timestamp: new Date(),
      });

      expect(mockPrisma.learner_profiles.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: userId },
          data: expect.objectContaining({
            mastery_state_json: expect.objectContaining({
              domains: expect.objectContaining({
                biology: expect.objectContaining({
                  mastery: 0.55,
                  consistencyCount: 3,
                }),
              }),
            }),
          }),
        }),
      );
    });

    it("should reset consistency on failure", async () => {
      const initialMastery = {
        domains: {
          biology: {
            mastery: 0.8,
            lastEvidenceAt: new Date().toISOString(),
            missionHistory: {},
            consistencyCount: 10,
          },
        },
        tier2: {},
        morphology: {},
      };

      mockPrisma.learner_profiles.findUnique.mockResolvedValue({
        mastery_state_json: initialMastery,
        scaffolding_state_json: {},
      });

      await service.updateMastery(userId, {
        type: "quiz_incorrect",
        domain: "biology",
        timestamp: new Date(),
      });

      expect(mockPrisma.learner_profiles.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            mastery_state_json: expect.objectContaining({
              domains: expect.objectContaining({
                biology: expect.objectContaining({
                  consistencyCount: 0,
                }),
              }),
            }),
          }),
        }),
      );
    });
  });
});
