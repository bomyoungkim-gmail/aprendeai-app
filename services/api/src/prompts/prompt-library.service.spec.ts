import { Test, TestingModule } from "@nestjs/testing";
import { PromptLibraryService } from "./prompt-library.service";

describe("PromptLibraryService", () => {
  let service: PromptLibraryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromptLibraryService],
    }).compile();

    service = module.get<PromptLibraryService>(PromptLibraryService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getPrompt", () => {
    it("should retrieve a prompt by key", () => {
      const prompt = service.getPrompt("FAM_ONBOARD_START");
      expect(prompt).toBeDefined();
      expect(prompt.key).toBe("FAM_ONBOARD_START");
      expect(prompt.audience).toBe("EDUCATOR");
    });

    it("should throw error for non-existent prompt", () => {
      expect(() => service.getPrompt("INVALID_KEY")).toThrow(
        "Prompt not found: INVALID_KEY",
      );
    });

    it("should interpolate variables in nextPrompt", () => {
      const prompt = service.getPrompt("FAM_CONTRACT_CONFIRM", { MIN: 15 });
      expect(prompt.nextPrompt).toContain("15 min");
    });

    it("should interpolate variables in nextPrompt for OPS_QUEUE_NEXT", () => {
      const prompt = service.getPrompt("OPS_QUEUE_NEXT", {
        TITLE: "História do Brasil",
        MIN: 20,
      });
      expect(prompt.nextPrompt).toContain("História do Brasil");
      expect(prompt.nextPrompt).toContain("20 min");
      // quickReplies are static for this prompt
      expect(prompt.quickReplies[0]).toBe("Sim, começar");
    });

    it("should preserve placeholders for missing variables", () => {
      const prompt = service.getPrompt("FAM_CONTRACT_CONFIRM");
      expect(prompt.nextPrompt).toContain("{MIN}");
    });
  });

  describe("getPromptsByAudience", () => {
    it("should filter prompts by LEARNER audience", () => {
      const learnerPrompts = service.getPromptsByAudience("LEARNER");
      expect(learnerPrompts.length).toBeGreaterThan(0);
      expect(learnerPrompts.every((p) => p.audience === "LEARNER")).toBe(true);
    });

    it("should filter prompts by EDUCATOR audience", () => {
      const educatorPrompts = service.getPromptsByAudience("EDUCATOR");
      expect(educatorPrompts.length).toBeGreaterThan(0);
      expect(educatorPrompts.every((p) => p.audience === "EDUCATOR")).toBe(
        true,
      );
    });
  });

  describe("getPromptsByPhase", () => {
    it("should filter prompts by BOOT phase", () => {
      const bootPrompts = service.getPromptsByPhase("BOOT");
      expect(bootPrompts.length).toBeGreaterThan(0);
      expect(bootPrompts.every((p) => p.phase === "BOOT")).toBe(true);
    });

    it("should filter prompts by DURING phase", () => {
      const duringPrompts = service.getPromptsByPhase("DURING");
      expect(duringPrompts.length).toBeGreaterThan(0);
      expect(duringPrompts.every((p) => p.phase === "DURING")).toBe(true);
    });
  });
});
