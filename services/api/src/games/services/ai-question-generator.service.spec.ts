import { Test, TestingModule } from "@nestjs/testing";
import { AIQuestionGeneratorService } from "./ai-question-generator.service";
import { LLMService } from "../../llm/llm.service";
import { GenerateQuestionsDto } from "../dto/generate-questions.dto";
import { EducationLevel } from "../dto/question-bank.dto";

describe("AIQuestionGeneratorService", () => {
  let service: AIQuestionGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIQuestionGeneratorService,
        {
          provide: LLMService,
          useValue: {
            generateText: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AIQuestionGeneratorService>(
      AIQuestionGeneratorService,
    );
  });

  describe("SCRIPT 01: Default values", () => {
    it("should apply default subject when empty", async () => {
      const params: GenerateQuestionsDto = {
        gameType: "SENTENCE_SKELETON",
        topic: "Test Topic",
        subject: "",
        educationLevel: EducationLevel.MEDIO,
        count: 5,
      };

      await expect(service.generate(params)).rejects.toThrow(
        "not yet implemented",
      );

      // Verify defaults were applied
      expect(params.subject).toBe("Português");
    });

    it("should apply default topic when empty", async () => {
      const params: GenerateQuestionsDto = {
        gameType: "CONNECTOR_CLASSIFIER",
        topic: "",
        subject: "Test Subject",
        educationLevel: EducationLevel.MEDIO,
        count: 5,
      };

      await expect(service.generate(params)).rejects.toThrow(
        "not yet implemented",
      );

      // Verify defaults were applied
      expect(params.topic).toBe("Sintaxe: oração e sentença");
    });

    it("should apply both defaults when both empty", async () => {
      const params: GenerateQuestionsDto = {
        gameType: "CLAUSE_REWRITE_SIMPLE",
        topic: "   ",
        subject: "   ",
        educationLevel: EducationLevel.MEDIO,
        count: 5,
      };

      await expect(service.generate(params)).rejects.toThrow(
        "not yet implemented",
      );

      // Verify defaults were applied
      expect(params.subject).toBe("Português");
      expect(params.topic).toBe("Sintaxe: oração e sentença");
    });

    it("should not override non-empty subject", async () => {
      const params: GenerateQuestionsDto = {
        gameType: "SENTENCE_SKELETON",
        topic: "Custom Topic",
        subject: "Matemática",
        educationLevel: EducationLevel.MEDIO,
        count: 5,
      };

      await expect(service.generate(params)).rejects.toThrow(
        "not yet implemented",
      );

      // Verify original value preserved
      expect(params.subject).toBe("Matemática");
    });

    it("should not override non-empty topic", async () => {
      const params: GenerateQuestionsDto = {
        gameType: "CONNECTOR_CLASSIFIER",
        topic: "Geometria",
        subject: "Português",
        educationLevel: EducationLevel.MEDIO,
        count: 5,
      };

      await expect(service.generate(params)).rejects.toThrow(
        "not yet implemented",
      );

      // Verify original value preserved
      expect(params.topic).toBe("Geometria");
    });
  });

  describe("SCRIPT 01: New game types", () => {
    it("should throw not implemented error for SENTENCE_SKELETON", async () => {
      const params: GenerateQuestionsDto = {
        gameType: "SENTENCE_SKELETON",
        topic: "Test",
        subject: "Test",
        educationLevel: EducationLevel.MEDIO,
        count: 5,
      };

      await expect(service.generate(params)).rejects.toThrow(
        "SENTENCE_SKELETON game type not yet implemented",
      );
    });

    it("should throw not implemented error for CONNECTOR_CLASSIFIER", async () => {
      const params: GenerateQuestionsDto = {
        gameType: "CONNECTOR_CLASSIFIER",
        topic: "Test",
        subject: "Test",
        educationLevel: EducationLevel.MEDIO,
        count: 5,
      };

      await expect(service.generate(params)).rejects.toThrow(
        "CONNECTOR_CLASSIFIER game type not yet implemented",
      );
    });

    it("should throw not implemented error for CLAUSE_REWRITE_SIMPLE", async () => {
      const params: GenerateQuestionsDto = {
        gameType: "CLAUSE_REWRITE_SIMPLE",
        topic: "Test",
        subject: "Test",
        educationLevel: EducationLevel.MEDIO,
        count: 5,
      };

      await expect(service.generate(params)).rejects.toThrow(
        "CLAUSE_REWRITE_SIMPLE game type not yet implemented",
      );
    });
  });
});
