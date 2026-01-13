import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { GenerateQuestionsDto, GAME_TYPES } from "./generate-questions.dto";
import { EducationLevel } from "./question-bank.dto";

describe("GenerateQuestionsDto", () => {
  describe("gameType validation", () => {
    it("should accept existing game type CONCEPT_LINKING", async () => {
      const dto = plainToInstance(GenerateQuestionsDto, {
        gameType: "CONCEPT_LINKING",
        topic: "Test Topic",
        subject: "Test Subject",
        educationLevel: EducationLevel.MEDIO,
        count: 5,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should accept new game type SENTENCE_SKELETON", async () => {
      const dto = plainToInstance(GenerateQuestionsDto, {
        gameType: "SENTENCE_SKELETON",
        topic: "Análise sintática",
        subject: "Português",
        educationLevel: EducationLevel.MEDIO,
        count: 5,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should accept new game type CONNECTOR_CLASSIFIER", async () => {
      const dto = plainToInstance(GenerateQuestionsDto, {
        gameType: "CONNECTOR_CLASSIFIER",
        topic: "Conectivos",
        subject: "Português",
        educationLevel: EducationLevel.MEDIO,
        count: 3,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should accept new game type CLAUSE_REWRITE_SIMPLE", async () => {
      const dto = plainToInstance(GenerateQuestionsDto, {
        gameType: "CLAUSE_REWRITE_SIMPLE",
        topic: "Simplificação de frases",
        subject: "Português",
        educationLevel: EducationLevel.MEDIO,
        count: 2,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should reject invalid game type", async () => {
      const dto = plainToInstance(GenerateQuestionsDto, {
        gameType: "INVALID_TYPE",
        topic: "Test Topic",
        subject: "Test Subject",
        educationLevel: EducationLevel.MEDIO,
        count: 5,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe("gameType");
      expect(errors[0].constraints).toHaveProperty("isIn");
    });

    it("should have all game types in GAME_TYPES constant", () => {
      expect(GAME_TYPES).toContain("CONCEPT_LINKING");
      expect(GAME_TYPES).toContain("SRS_ARENA");
      expect(GAME_TYPES).toContain("FREE_RECALL_SCORE");
      expect(GAME_TYPES).toContain("SENTENCE_SKELETON");
      expect(GAME_TYPES).toContain("CONNECTOR_CLASSIFIER");
      expect(GAME_TYPES).toContain("CLAUSE_REWRITE_SIMPLE");
      expect(GAME_TYPES).toHaveLength(6);
    });
  });

  describe("difficulty validation", () => {
    it("should accept difficulty within range (1-5)", async () => {
      for (const difficulty of [1, 2, 3, 4, 5]) {
        const dto = plainToInstance(GenerateQuestionsDto, {
          gameType: "CONCEPT_LINKING",
          topic: "Test",
          subject: "Test",
          educationLevel: EducationLevel.MEDIO,
          count: 5,
          difficulty,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it("should reject difficulty = 0", async () => {
      const dto = plainToInstance(GenerateQuestionsDto, {
        gameType: "CONCEPT_LINKING",
        topic: "Test",
        subject: "Test",
        educationLevel: EducationLevel.MEDIO,
        count: 5,
        difficulty: 0,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const difficultyError = errors.find((e) => e.property === "difficulty");
      expect(difficultyError).toBeDefined();
      expect(difficultyError?.constraints).toHaveProperty("min");
    });

    it("should reject difficulty = 6", async () => {
      const dto = plainToInstance(GenerateQuestionsDto, {
        gameType: "CONCEPT_LINKING",
        topic: "Test",
        subject: "Test",
        educationLevel: EducationLevel.MEDIO,
        count: 5,
        difficulty: 6,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const difficultyError = errors.find((e) => e.property === "difficulty");
      expect(difficultyError).toBeDefined();
      expect(difficultyError?.constraints).toHaveProperty("max");
    });

    it("should accept missing difficulty (optional)", async () => {
      const dto = plainToInstance(GenerateQuestionsDto, {
        gameType: "CONCEPT_LINKING",
        topic: "Test",
        subject: "Test",
        educationLevel: EducationLevel.MEDIO,
        count: 5,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe("count validation", () => {
    it("should accept count >= 1", async () => {
      for (const count of [1, 5, 10, 100]) {
        const dto = plainToInstance(GenerateQuestionsDto, {
          gameType: "CONCEPT_LINKING",
          topic: "Test",
          subject: "Test",
          educationLevel: EducationLevel.MEDIO,
          count,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it("should reject count = 0", async () => {
      const dto = plainToInstance(GenerateQuestionsDto, {
        gameType: "CONCEPT_LINKING",
        topic: "Test",
        subject: "Test",
        educationLevel: EducationLevel.MEDIO,
        count: 0,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const countError = errors.find((e) => e.property === "count");
      expect(countError).toBeDefined();
      expect(countError?.constraints).toHaveProperty("min");
    });

    it("should reject negative count", async () => {
      const dto = plainToInstance(GenerateQuestionsDto, {
        gameType: "CONCEPT_LINKING",
        topic: "Test",
        subject: "Test",
        educationLevel: EducationLevel.MEDIO,
        count: -1,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const countError = errors.find((e) => e.property === "count");
      expect(countError).toBeDefined();
      expect(countError?.constraints).toHaveProperty("min");
    });
  });
});
