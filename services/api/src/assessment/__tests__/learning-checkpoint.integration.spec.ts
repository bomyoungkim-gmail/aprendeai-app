import { Test, TestingModule } from "@nestjs/testing";
import { LearningCheckpointController } from "../learning-checkpoint.controller";
import { AnswerCheckpointUseCase } from "../application/use-cases/answer-checkpoint.use-case";

// Mock UseCase to isolate Controller test
jest.mock("../application/use-cases/answer-checkpoint.use-case");

describe("LearningCheckpointController Integration", () => {
  let controller: LearningCheckpointController;
  let useCase: AnswerCheckpointUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LearningCheckpointController],
      providers: [AnswerCheckpointUseCase],
    }).compile();

    controller = module.get<LearningCheckpointController>(
      LearningCheckpointController,
    );
    useCase = module.get<AnswerCheckpointUseCase>(AnswerCheckpointUseCase);
  });

  it("should call useCase.execute and return result", async () => {
    // Arrange
    const dto = {
      checkpointId: "q1",
      sessionId: "sess1",
      answer: { option: "A" },
    };
    const expectedResult = {
      correct: true,
      feedback: "Good job",
      masteryUpdate: { skill: "math", newLevel: 1 },
    };

    (useCase.execute as jest.Mock).mockResolvedValue(expectedResult);

    // Act
    const result = await controller.answer(
      { user: { id: "user1" } } as any, // Mock Request
      dto,
    );

    // Assert
    expect(result).toEqual(expectedResult);
    expect(useCase.execute).toHaveBeenCalledWith("user1", dto);
  });
});
