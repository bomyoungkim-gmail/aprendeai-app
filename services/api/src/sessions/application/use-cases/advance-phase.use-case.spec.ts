import { Test, TestingModule } from "@nestjs/testing";
import { AdvancePhaseUseCase } from "./advance-phase.use-case";
import { ISessionsRepository } from "../../domain/sessions.repository.interface";
import { ICornellRepository } from "../../../cornell/domain/interfaces/cornell.repository.interface";
import { ReadingSession } from "../../domain/reading-session.entity";
import { SessionPhase, SessionModality, AssetLayer } from "@prisma/client";
import { NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";

describe("AdvancePhaseUseCase", () => {
  let useCase: AdvancePhaseUseCase;
  let repository: jest.Mocked<ISessionsRepository>;
  let cornellRepository: jest.Mocked<ICornellRepository>;

  const mockSession = new ReadingSession({
    id: "session-1",
    userId: "user-1",
    contentId: "content-1",
    phase: SessionPhase.DURING,
    modality: SessionModality.READING,
    assetLayer: AssetLayer.L1,
    startTime: new Date(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdvancePhaseUseCase,
        {
          provide: ISessionsRepository,
          useValue: {
            findById: jest.fn(),
            update: jest.fn(),
            findEvents: jest.fn(),
          },
        },
        {
          provide: ICornellRepository,
          useValue: {
            findByContentAndUser: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<AdvancePhaseUseCase>(AdvancePhaseUseCase);
    repository = module.get(ISessionsRepository);
    cornellRepository = module.get(ICornellRepository);
  });

  it("should advance from DURING to POST successfully", async () => {
    repository.findById.mockResolvedValue(mockSession);
    repository.update.mockResolvedValue({ ...mockSession, phase: SessionPhase.POST } as ReadingSession);

    const result = await useCase.execute("session-1", "user-1", "POST");

    expect(result.phase).toBe("POST");
    expect(repository.update).toHaveBeenCalledWith("session-1", expect.objectContaining({ phase: "POST" }));
  });

  it("should throw BadRequest if advancing to POST from PRE (invalid transition)", async () => {
    repository.findById.mockResolvedValue({ ...mockSession, phase: SessionPhase.PRE } as ReadingSession);

    await expect(useCase.execute("session-1", "user-1", "POST")).rejects.toThrow(BadRequestException);
  });
  
  it("should validate DoD when advancing to FINISHED", async () => {
       const postSession = { ...mockSession, phase: SessionPhase.POST } as ReadingSession;
       repository.findById.mockResolvedValue(postSession);
       
       // Mock Cornell Notes (Success)
       cornellRepository.findByContentAndUser.mockResolvedValue({ summary: "Summary" } as any);
       
       // Mock Events (Success: Quiz + Production)
       repository.findEvents.mockResolvedValue([
           { eventType: "QUIZ_RESPONSE" } as any,
           { eventType: "PRODUCTION_SUBMIT" } as any
       ]);
       
       repository.update.mockResolvedValue({ ...postSession, phase: SessionPhase.FINISHED } as ReadingSession);

       const result = await useCase.execute("session-1", "user-1", "FINISHED");
       expect(result.phase).toBe("FINISHED");
  });
});
