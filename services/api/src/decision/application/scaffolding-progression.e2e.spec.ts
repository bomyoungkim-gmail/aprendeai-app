import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service";
import { ScaffoldingService } from "./scaffolding.service";
import { DecisionModule } from "../decision.module";
import {
  createTestUser,
  createTestContent,
  cleanupTestData,
  TestUser,
  TestContent,
} from "./test-helpers";
import {
  MASTERY_THRESHOLDS,
  SCAFFOLDING_CONFIG,
} from "../domain/decision.constants";

/**
 * Scaffolding Progression Integration Tests
 *
 * These tests validate the integration of ScaffoldingService
 * with the Prisma database and mastery calculation logic.
 *
 * NOTE: These are simplified integration tests that focus on
 * verifying the service can be instantiated and called correctly.
 * Full behavioral testing would require more complex setup.
 */
describe("Scaffolding Progression Integration Tests", () => {
  let module: TestingModule;
  let prisma: PrismaService;
  let scaffoldingService: ScaffoldingService;

  let testUser: TestUser;
  let testContent: TestContent;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [DecisionModule],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    scaffoldingService = module.get<ScaffoldingService>(ScaffoldingService);
  });

  beforeEach(async () => {
    // Create fresh test data for each test
    testUser = await createTestUser(prisma);
    testContent = await createTestContent(prisma, "NARRATIVE");
  });

  afterEach(async () => {
    // Clean up test data
    await cleanupTestData(prisma, testUser.id, testContent.id);
  });

  afterAll(async () => {
    await module.close();
  });

  describe("Service Integration", () => {
    it("should be defined and injectable", () => {
      expect(scaffoldingService).toBeDefined();
      expect(prisma).toBeDefined();
    });

    it("should calculate fading level for a user", async () => {
      // Act: Calculate fading level (will return default with no mastery data)
      const level = await scaffoldingService.calculateFadingLevel(testUser.id);

      // Assert: Should return a valid scaffolding level (0-3)
      expect(level).toBeDefined();
      expect(typeof level).toBe("number");
      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThanOrEqual(3);
    });

    it("should get scaffolding config for each level", () => {
      // Test all scaffolding levels
      for (let level = 0; level <= 3; level++) {
        const config = scaffoldingService.getScaffoldingConfig(
          level as 0 | 1 | 2 | 3,
        );

        expect(config).toBeDefined();
        expect(config.level).toBe(level);
        expect(config.name).toBeDefined();
        expect(config.behavior).toBeDefined();
      }
    });

    it("should get max interventions for each level", () => {
      // Test all scaffolding levels
      for (let level = 0; level <= 3; level++) {
        const maxInterventions = scaffoldingService.getMaxInterventions(
          level as 0 | 1 | 2 | 3,
        );

        expect(typeof maxInterventions).toBe("number");
        expect(maxInterventions).toBeGreaterThanOrEqual(0);

        // Higher levels should have more interventions
        if (level > 0) {
          const previousLevel = scaffoldingService.getMaxInterventions(
            (level - 1) as 0 | 1 | 2 | 3,
          );
          expect(maxInterventions).toBeGreaterThanOrEqual(previousLevel);
        }
      }
    });

    it("should get threshold multipliers for each level", () => {
      // Test all scaffolding levels
      for (let level = 0; level <= 3; level++) {
        const multipliers = scaffoldingService.getThresholdMultipliers(
          level as 0 | 1 | 2 | 3,
        );

        expect(multipliers).toBeDefined();
        expect(multipliers).toHaveProperty("doubtSensitivity");
        expect(multipliers).toHaveProperty("checkpointFrequency");
        expect(typeof multipliers.doubtSensitivity).toBe("number");
        expect(typeof multipliers.checkpointFrequency).toBe("number");
      }
    });
  });

  describe("Constants Integration", () => {
    it("should use centralized mastery thresholds", () => {
      // Verify that MASTERY_THRESHOLDS are defined and have expected structure
      expect(MASTERY_THRESHOLDS).toBeDefined();
      expect(MASTERY_THRESHOLDS.FADE).toBe(0.8);
      expect(MASTERY_THRESHOLDS.LOW).toBe(0.6);
      expect(MASTERY_THRESHOLDS.MEDIUM).toBe(0.4);
    });

    it("should use centralized scaffolding config", () => {
      // Verify that SCAFFOLDING_CONFIG is defined
      expect(SCAFFOLDING_CONFIG).toBeDefined();
      expect(SCAFFOLDING_CONFIG.CONSISTENCY_SESSIONS_REQUIRED).toBe(3);
    });

    it("should have thresholds in correct order", () => {
      // Verify threshold ordering: FADE > LOW > MEDIUM
      expect(MASTERY_THRESHOLDS.FADE).toBeGreaterThan(MASTERY_THRESHOLDS.LOW);
      expect(MASTERY_THRESHOLDS.LOW).toBeGreaterThan(MASTERY_THRESHOLDS.MEDIUM);
    });
  });

  describe("Mastery Update Integration", () => {
    it("should update mastery from checkpoint", async () => {
      // Act: Update mastery (this will create mastery state if not exists)
      await expect(
        scaffoldingService.updateMasteryFromCheckpoint(
          testUser.id,
          "test-skill",
          true,
        ),
      ).resolves.not.toThrow();
    });
  });
});
