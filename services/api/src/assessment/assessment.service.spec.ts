import { Test, TestingModule } from "@nestjs/testing";
import { AssessmentService } from "./assessment.service";
import { CreateAssessmentUseCase } from "./application/use-cases/create-assessment.use-case";
import { GetAssessmentUseCase } from "./application/use-cases/get-assessment.use-case";
import { SubmitAssessmentUseCase } from "./application/use-cases/submit-assessment.use-case";

describe("AssessmentService", () => {
  let service: AssessmentService;
  let getUseCase: GetAssessmentUseCase;

  const mockCreateUseCase = { execute: jest.fn() };
  const mockGetUseCase = {
    getByContentId: jest.fn(),
    getUserAssessments: jest.fn(),
  };
  const mockSubmitUseCase = { execute: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentService,
        { provide: CreateAssessmentUseCase, useValue: mockCreateUseCase },
        { provide: GetAssessmentUseCase, useValue: mockGetUseCase },
        { provide: SubmitAssessmentUseCase, useValue: mockSubmitUseCase },
      ],
    }).compile();

    service = module.get<AssessmentService>(AssessmentService);
    getUseCase = module.get<GetAssessmentUseCase>(GetAssessmentUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getPendingCheckpoints", () => {
    const userId = "user-1";
    const contentId = "content-1";

    it("should return assessments that have NO attempts at all", async () => {
      mockGetUseCase.getByContentId.mockResolvedValue([
        { id: "assess-1", content_id: contentId },
      ]);
      mockGetUseCase.getUserAssessments.mockResolvedValue([]); // No attempts

      const result = await service.getPendingCheckpoints(userId, contentId);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("assess-1");
    });

    it("should return assessments that have only unfinished attempts", async () => {
      mockGetUseCase.getByContentId.mockResolvedValue([
        { id: "assess-1", content_id: contentId },
      ]);
      mockGetUseCase.getUserAssessments.mockResolvedValue([
        { assessment_id: "assess-1", finished_at: null }, // Unfinished
      ]);

      const result = await service.getPendingCheckpoints(userId, contentId);
      expect(result).toHaveLength(1);
    });

    it("should NOT return assessments that have a finished attempt", async () => {
      mockGetUseCase.getByContentId.mockResolvedValue([
        { id: "assess-1", content_id: contentId },
      ]);
      mockGetUseCase.getUserAssessments.mockResolvedValue([
        { assessment_id: "assess-1", finished_at: new Date() }, // Finished
      ]);

      const result = await service.getPendingCheckpoints(userId, contentId);
      expect(result).toHaveLength(0);
    });
  });
});
