import { Test, TestingModule } from "@nestjs/testing";
import { GetStudentProgressUseCase } from "../../../../../src/analytics/application/use-cases/get-student-progress.use-case";
import { IAnalyticsRepository } from "../../../../../src/analytics/domain/analytics.repository.interface";

describe("GetStudentProgressUseCase", () => {
  let useCase: GetStudentProgressUseCase;
  let repository: IAnalyticsRepository;

  const mockRepository = {
    countMasteredVocab: jest.fn(),
    getAssessmentAnswers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetStudentProgressUseCase,
        {
          provide: IAnalyticsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetStudentProgressUseCase>(GetStudentProgressUseCase);
    repository = module.get<IAnalyticsRepository>(IAnalyticsRepository);
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });

  describe("execute", () => {
    it("should return progress stats correctly", async () => {
      mockRepository.countMasteredVocab.mockResolvedValue(100);
      mockRepository.getAssessmentAnswers.mockResolvedValue([
        {
          is_correct: true,
          assessment_questions: { skills: ["grammar", "vocabulary"] },
        },
        {
          is_correct: false,
          assessment_questions: { skills: ["grammar"] }, // Grammar error
        },
        {
           is_correct: true,
           assessment_questions: { skills: ["listening"] },
        }
      ]);

      const result = await useCase.execute("user-1");

      expect(result.vocabularySize).toBe(100);
      // Grammar: 1 success, 1 error -> neither weak nor strong strictly (logic: error > success for weak)
      // Grammar: success=1, error=1. fail > success is false. success >= error.
      // Wait, let's check logic: if (stats.error > stats.success) weakPoints.push
      // else strongPoints.push.
      // So Grammar (1,1) -> Strong.
      // Vocabulary (1,0) -> Strong.
      // Listening (1,0) -> Strong.

      expect(result.strongPoints).toHaveLength(3);
      expect(result.weakPoints).toHaveLength(0);
    });

    it("should identify weak points correctly", async () => {
       mockRepository.countMasteredVocab.mockResolvedValue(50);
       mockRepository.getAssessmentAnswers.mockResolvedValue([
         { is_correct: false, assessment_questions: { skills: ["pronunciation"] } },
         { is_correct: false, assessment_questions: { skills: ["pronunciation"] } }, // 2 errors
         { is_correct: true, assessment_questions: { skills: ["pronunciation"] } }, // 1 success
       ]);

       const result = await useCase.execute("user-2");
       expect(result.weakPoints).toContainEqual({ skill: "pronunciation", errorCount: 2 });
    });
  });
});
