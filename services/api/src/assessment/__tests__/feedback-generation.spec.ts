import { Test, TestingModule } from "@nestjs/testing";
import { FeedbackGenerationService } from "../application/feedback-generation.service";
import { RedisService } from "../../common/redis/redis.service";
import { LLMService } from "../../llm/llm.service";

describe("FeedbackGenerationService", () => {
  let service: FeedbackGenerationService;
  let redisService: any;
  let llmService: any;

  const mockQuestion = {
    id: "q1",
    questionText: "What is 2+2?",
  };
  const mockUserAnswer = { option: "B" };
  const mockCorrectAnswer = { option: "A" };
  const expectedFeedback = "Generative AI Feedback";

  beforeEach(async () => {
    redisService = {
      get: jest.fn(),
      set: jest.fn(),
    };

    llmService = {
      generateText: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackGenerationService,
        { provide: RedisService, useValue: redisService },
        { provide: LLMService, useValue: llmService },
      ],
    }).compile();

    service = module.get<FeedbackGenerationService>(FeedbackGenerationService);
  });

  it("should return cached feedback if available (Cache Hit)", async () => {
    // Arrange
    redisService.get.mockResolvedValue("Cached Feedback");

    // Act
    const result = await service.generateFeedback(
      mockQuestion,
      mockUserAnswer,
      mockCorrectAnswer,
    );

    // Assert
    expect(result).toBe("Cached Feedback");
    expect(redisService.get).toHaveBeenCalled();
    expect(llmService.generateText).not.toHaveBeenCalled();
  });

  it("should generate feedback via LLM if cache miss (Cache Miss)", async () => {
    // Arrange
    redisService.get.mockResolvedValue(null);
    llmService.generateText.mockResolvedValue({ text: expectedFeedback });

    // Act
    const result = await service.generateFeedback(
      mockQuestion,
      mockUserAnswer,
      mockCorrectAnswer,
    );

    // Assert
    expect(result).toBe(expectedFeedback);
    expect(redisService.get).toHaveBeenCalled();
    expect(llmService.generateText).toHaveBeenCalledWith(
      expect.stringContaining(mockQuestion.questionText),
      expect.any(Object),
    );
    expect(redisService.set).toHaveBeenCalledWith(
      expect.any(String),
      expectedFeedback,
      expect.any(Number),
    );
  });

  it("should return fallback feedback if LLM fails", async () => {
    // Arrange
    redisService.get.mockResolvedValue(null);
    llmService.generateText.mockRejectedValue(new Error("LLM Error"));

    // Act
    const result = await service.generateFeedback(
      mockQuestion,
      mockUserAnswer,
      mockCorrectAnswer,
    );

    // Assert
    expect(result).toContain("Not quite. The correct answer is");
    expect(llmService.generateText).toHaveBeenCalled();
  });
});
