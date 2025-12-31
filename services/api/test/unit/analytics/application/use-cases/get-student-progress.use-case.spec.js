"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const get_student_progress_use_case_1 = require("../../../../../src/analytics/application/use-cases/get-student-progress.use-case");
const analytics_repository_interface_1 = require("../../../../../src/analytics/domain/analytics.repository.interface");
describe("GetStudentProgressUseCase", () => {
    let useCase;
    let repository;
    const mockRepository = {
        countMasteredVocab: jest.fn(),
        getAssessmentAnswers: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                get_student_progress_use_case_1.GetStudentProgressUseCase,
                {
                    provide: analytics_repository_interface_1.IAnalyticsRepository,
                    useValue: mockRepository,
                },
            ],
        }).compile();
        useCase = module.get(get_student_progress_use_case_1.GetStudentProgressUseCase);
        repository = module.get(analytics_repository_interface_1.IAnalyticsRepository);
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
                    assessment_questions: { skills: ["grammar"] },
                },
                {
                    is_correct: true,
                    assessment_questions: { skills: ["listening"] },
                }
            ]);
            const result = await useCase.execute("user-1");
            expect(result.vocabularySize).toBe(100);
            expect(result.strongPoints).toHaveLength(3);
            expect(result.weakPoints).toHaveLength(0);
        });
        it("should identify weak points correctly", async () => {
            mockRepository.countMasteredVocab.mockResolvedValue(50);
            mockRepository.getAssessmentAnswers.mockResolvedValue([
                { is_correct: false, assessment_questions: { skills: ["pronunciation"] } },
                { is_correct: false, assessment_questions: { skills: ["pronunciation"] } },
                { is_correct: true, assessment_questions: { skills: ["pronunciation"] } },
            ]);
            const result = await useCase.execute("user-2");
            expect(result.weakPoints).toContainEqual({ skill: "pronunciation", errorCount: 2 });
        });
    });
});
//# sourceMappingURL=get-student-progress.use-case.spec.js.map