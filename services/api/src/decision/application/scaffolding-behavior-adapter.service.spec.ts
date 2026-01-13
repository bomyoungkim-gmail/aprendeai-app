import { Test, TestingModule } from "@nestjs/testing";
import { ScaffoldingBehaviorAdapterService } from "./scaffolding-behavior-adapter.service";
import { ContentMode } from "@prisma/client";

describe("ScaffoldingBehaviorAdapterService", () => {
  let service: ScaffoldingBehaviorAdapterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScaffoldingBehaviorAdapterService],
    }).compile();

    service = module.get<ScaffoldingBehaviorAdapterService>(
      ScaffoldingBehaviorAdapterService,
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getBehaviorModifiers", () => {
    describe("Level-based modifiers", () => {
      it("should return STEP_BY_STEP format for L3", () => {
        const modifiers = service.getBehaviorModifiers(
          ContentMode.DIDACTIC,
          3,
          "DURING",
        );

        expect(modifiers.responseFormat).toBe("STEP_BY_STEP");
        expect(modifiers.includeExamples).toBe(false); // Reduced during DURING phase
        expect(modifiers.includeVerification).toBe(true);
        expect(modifiers.tone).toBe("formal"); // DIDACTIC adjusts to formal
      });

      it("should return DIRECT_WITH_VERIFICATION format for L2", () => {
        const modifiers = service.getBehaviorModifiers(
          ContentMode.NARRATIVE,
          2,
          "POST",
        );

        expect(modifiers.responseFormat).toBe("DIRECT_WITH_VERIFICATION");
        expect(modifiers.includeExamples).toBe(true);
        expect(modifiers.includeVerification).toBe(true);
        expect(modifiers.tone).toBe("conversational");
      });

      it("should return DIRECT format for L1 with quick replies (GAP 7)", () => {
        const modifiers = service.getBehaviorModifiers(
          ContentMode.TECHNICAL,
          1,
          "DURING",
        );

        expect(modifiers.responseFormat).toBe("DIRECT");
        expect(modifiers.includeExamples).toBe(true); // TECHNICAL always includes examples
        expect(modifiers.includeVerification).toBe(false);
        expect(modifiers.quickReplies).toEqual([
          "Explicar mais",
          "Dar exemplo",
          "Relacionar conceitos",
        ]);
        expect(modifiers.tone).toBe("formal"); // TECHNICAL adjusts to formal
      });

      it("should return MINIMAL format for L0", () => {
        const modifiers = service.getBehaviorModifiers(
          ContentMode.NARRATIVE,
          0,
          "POST",
        );

        expect(modifiers.responseFormat).toBe("MINIMAL");
        expect(modifiers.includeExamples).toBe(false);
        expect(modifiers.includeVerification).toBe(false);
        expect(modifiers.quickReplies).toEqual([]);
        expect(modifiers.tone).toBe("conversational"); // NARRATIVE adjusts to conversational
      });
    });

    describe("Mode-specific adjustments", () => {
      it("should enable Socratic mode for DIDACTIC L3", () => {
        const modifiers = service.getBehaviorModifiers(
          ContentMode.DIDACTIC,
          3,
          "POST",
        );

        expect(modifiers.useSocraticMode).toBe(true);
        expect(modifiers.tone).toBe("formal");
      });

      it("should NOT enable Socratic mode for DIDACTIC L2", () => {
        const modifiers = service.getBehaviorModifiers(
          ContentMode.DIDACTIC,
          2,
          "POST",
        );

        expect(modifiers.useSocraticMode).toBe(false);
      });

      it("should use conversational tone for NARRATIVE", () => {
        const modifiers = service.getBehaviorModifiers(
          ContentMode.NARRATIVE,
          2,
          "DURING",
        );

        expect(modifiers.tone).toBe("conversational");
      });

      it("should reduce scaffolding for NARRATIVE L1 to MINIMAL", () => {
        const modifiers = service.getBehaviorModifiers(
          ContentMode.NARRATIVE,
          1,
          "POST",
        );

        expect(modifiers.responseFormat).toBe("MINIMAL");
      });

      it("should use formal tone for TECHNICAL", () => {
        const modifiers = service.getBehaviorModifiers(
          ContentMode.TECHNICAL,
          2,
          "DURING",
        );

        expect(modifiers.tone).toBe("formal");
        expect(modifiers.includeExamples).toBe(true); // Always for TECHNICAL
      });

      it("should use formal tone for SCIENTIFIC", () => {
        const modifiers = service.getBehaviorModifiers(
          ContentMode.SCIENTIFIC,
          1,
          "POST",
        );

        expect(modifiers.tone).toBe("formal");
        expect(modifiers.includeExamples).toBe(true); // Always for SCIENTIFIC
      });

      it("should use conversational tone for NEWS", () => {
        const modifiers = service.getBehaviorModifiers(
          ContentMode.NEWS,
          2,
          "DURING",
        );

        expect(modifiers.tone).toBe("conversational");
      });
    });

    describe("Phase-specific adjustments (GAP 1)", () => {
      it("should set duringReading flag for DURING phase", () => {
        const modifiers = service.getBehaviorModifiers(
          ContentMode.DIDACTIC,
          3,
          "DURING",
        );

        expect(modifiers.phaseAdjustments.duringReading).toBe(true);
        expect(modifiers.phaseAdjustments.postReading).toBe(false);
      });

      it("should set postReading flag for POST phase", () => {
        const modifiers = service.getBehaviorModifiers(
          ContentMode.DIDACTIC,
          2,
          "POST",
        );

        expect(modifiers.phaseAdjustments.duringReading).toBe(false);
        expect(modifiers.phaseAdjustments.postReading).toBe(true);
      });

      it("should reduce examples during DURING phase for L3", () => {
        const modifiers = service.getBehaviorModifiers(
          ContentMode.DIDACTIC,
          3,
          "DURING",
        );

        expect(modifiers.includeExamples).toBe(false); // Reduced for DURING
      });

      it("should include examples during POST phase for L3", () => {
        const modifiers = service.getBehaviorModifiers(
          ContentMode.DIDACTIC,
          3,
          "POST",
        );

        expect(modifiers.includeExamples).toBe(true); // Restored for POST
      });

      it("should NOT add verification during POST phase for NARRATIVE L1 (becomes MINIMAL)", () => {
        const modifiers = service.getBehaviorModifiers(
          ContentMode.NARRATIVE,
          1,
          "POST",
        );

        // NARRATIVE L1 becomes MINIMAL, so no verification
        expect(modifiers.responseFormat).toBe("MINIMAL");
        expect(modifiers.includeVerification).toBe(false);
      });

      it("should limit quick replies during DURING phase", () => {
        const modifiersDuring = service.getBehaviorModifiers(
          ContentMode.TECHNICAL,
          1,
          "DURING",
        );
        const modifiersPost = service.getBehaviorModifiers(
          ContentMode.TECHNICAL,
          1,
          "POST",
        );

        expect(modifiersDuring.quickReplies.length).toBeLessThanOrEqual(3);
        expect(modifiersPost.quickReplies.length).toBeGreaterThan(0);
      });
    });
  });

  describe("formatSystemPrompt", () => {
    it("should format L3 prompt with 4-step structure (GAP 2)", () => {
      const modifiers = service.getBehaviorModifiers(
        ContentMode.DIDACTIC,
        3,
        "POST",
      );
      const prompt = service.formatSystemPrompt(
        "Base prompt",
        modifiers,
        ContentMode.DIDACTIC,
      );

      expect(prompt).toContain("## Response Format");
      expect(prompt).toContain("step-by-step format with 4 detailed steps");
      expect(prompt).toContain("1. **Identificação**");
      expect(prompt).toContain("2. **Análise**");
      expect(prompt).toContain("3. **Aplicação**");
      expect(prompt).toContain("4. **Verificação**");
      expect(prompt).toContain("**Exemplo Prático**");
    });

    it("should format L2 prompt with direct and verification", () => {
      const modifiers = service.getBehaviorModifiers(
        ContentMode.NARRATIVE,
        2,
        "POST",
      );
      const prompt = service.formatSystemPrompt(
        "Base prompt",
        modifiers,
        ContentMode.NARRATIVE,
      );

      expect(prompt).toContain("## Response Format");
      expect(prompt).toContain("direct answer followed by a verification");
      expect(prompt).toContain("Para verificar:");
    });

    it("should format L1 prompt with quick replies (GAP 7)", () => {
      const modifiers = service.getBehaviorModifiers(
        ContentMode.TECHNICAL,
        1,
        "POST",
      );
      const prompt = service.formatSystemPrompt(
        "Base prompt",
        modifiers,
        ContentMode.TECHNICAL,
      );

      expect(prompt).toContain("## Quick Reply Suggestions");
      expect(prompt).toContain("Explicar mais");
      expect(prompt).toContain("Dar exemplo");
      expect(prompt).toContain("Relacionar conceitos");
    });

    it("should format L0 prompt as minimal", () => {
      const modifiers = service.getBehaviorModifiers(
        ContentMode.NARRATIVE,
        0,
        "POST",
      );
      const prompt = service.formatSystemPrompt(
        "Base prompt",
        modifiers,
        ContentMode.NARRATIVE,
      );

      expect(prompt).toContain("## Response Format");
      expect(prompt).toContain("concise, essential information only");
    });

    it("should include Socratic instructions for DIDACTIC L3", () => {
      const modifiers = service.getBehaviorModifiers(
        ContentMode.DIDACTIC,
        3,
        "POST",
      );
      const prompt = service.formatSystemPrompt(
        "Base prompt",
        modifiers,
        ContentMode.DIDACTIC,
      );

      expect(prompt).toContain("## Socratic Method");
      expect(prompt).toContain("Ask guiding questions");
      expect(prompt).toContain("What do you think");
    });

    it("should NOT include Socratic instructions for non-DIDACTIC", () => {
      const modifiers = service.getBehaviorModifiers(
        ContentMode.NARRATIVE,
        3,
        "POST",
      );
      const prompt = service.formatSystemPrompt(
        "Base prompt",
        modifiers,
        ContentMode.NARRATIVE,
      );

      expect(prompt).not.toContain("## Socratic Method");
    });

    it("should include tone instructions", () => {
      const modifiersFormal = service.getBehaviorModifiers(
        ContentMode.TECHNICAL,
        2,
        "POST",
      );
      const promptFormal = service.formatSystemPrompt(
        "Base",
        modifiersFormal,
        ContentMode.TECHNICAL,
      );

      expect(promptFormal).toContain("## Tone");
      expect(promptFormal).toContain("formal, academic language");

      const modifiersConversational = service.getBehaviorModifiers(
        ContentMode.NARRATIVE,
        2,
        "POST",
      );
      const promptConversational = service.formatSystemPrompt(
        "Base",
        modifiersConversational,
        ContentMode.NARRATIVE,
      );

      expect(promptConversational).toContain(
        "friendly, conversational language",
      );
    });

    it("should include phase-specific instructions for DURING", () => {
      const modifiers = service.getBehaviorModifiers(
        ContentMode.DIDACTIC,
        2,
        "DURING",
      );
      const prompt = service.formatSystemPrompt(
        "Base prompt",
        modifiers,
        ContentMode.DIDACTIC,
      );

      expect(prompt).toContain("## During Reading Phase");
      expect(prompt).toContain("concise and focused");
    });

    it("should include phase-specific instructions for POST", () => {
      const modifiers = service.getBehaviorModifiers(
        ContentMode.DIDACTIC,
        2,
        "POST",
      );
      const prompt = service.formatSystemPrompt(
        "Base prompt",
        modifiers,
        ContentMode.DIDACTIC,
      );

      expect(prompt).toContain("## Post-Reading Phase");
      expect(prompt).toContain("comprehensive, detailed responses");
    });
  });

  describe("Edge cases", () => {
    it("should handle invalid level gracefully (default to L2)", () => {
      const modifiers = service.getBehaviorModifiers(
        ContentMode.DIDACTIC,
        99 as any,
        "POST",
      );

      expect(modifiers.responseFormat).toBe("DIRECT_WITH_VERIFICATION"); // L2 default
    });

    it("should handle all ContentMode values", () => {
      const modes = [
        ContentMode.DIDACTIC,
        ContentMode.NARRATIVE,
        ContentMode.TECHNICAL,
        ContentMode.SCIENTIFIC,
        ContentMode.NEWS,
      ];

      modes.forEach((mode) => {
        const modifiers = service.getBehaviorModifiers(mode, 2, "POST");
        expect(modifiers).toBeDefined();
        expect(modifiers.responseFormat).toBeDefined();
      });
    });
  });
});
