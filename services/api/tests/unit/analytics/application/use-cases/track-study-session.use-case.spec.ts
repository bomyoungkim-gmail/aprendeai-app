import { Test, TestingModule } from "@nestjs/testing";
import { TrackStudySessionUseCase } from "../../../../../src/analytics/application/use-cases/track-study-session.use-case";
import { IAnalyticsRepository } from "../../../../../src/analytics/domain/analytics.repository.interface";
import { StudySession } from "../../../../../src/analytics/domain/study-session.entity";

describe("TrackStudySessionUseCase", () => {
  let useCase: TrackStudySessionUseCase;
  let repository: IAnalyticsRepository;

  const mockRepository = {
    createSession: jest.fn(),
    updateSession: jest.fn(),
    findReadingSession: jest.fn(),
    incrementInterruptions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackStudySessionUseCase,
        {
          provide: IAnalyticsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<TrackStudySessionUseCase>(TrackStudySessionUseCase);
    repository = module.get<IAnalyticsRepository>(IAnalyticsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("startSession", () => {
    it("should create and return a new session", async () => {
      const sessionData = new StudySession({ id: "123", userId: "user-1", activityType: "reading" });
      mockRepository.createSession.mockResolvedValue(sessionData);

      const result = await useCase.startSession("user-1", "reading");
      expect(repository.createSession).toHaveBeenCalled();
      expect(result).toEqual(sessionData);
    });
  });

  describe("finishSession", () => {
    it("should update session with metrics", async () => {
      mockRepository.updateSession.mockResolvedValue(new StudySession({ id: "123", endTime: new Date() }));
      
      await useCase.finishSession("123", { durationMinutes: 10, netFocusMinutes: 8 });

      expect(repository.updateSession).toHaveBeenCalledWith("123", expect.objectContaining({
          durationMinutes: 10,
          netFocusMinutes: 8,
          focusScore: 80, // (8/10)*100
      }));
    });
  });

  describe("heartbeat", () => {
      it("should increment interruptions if status is blurred", async () => {
          await useCase.heartbeat("123", "blurred");
          expect(repository.incrementInterruptions).toHaveBeenCalledWith("123");
      });

      it("should do nothing if status is focused", async () => {
          await useCase.heartbeat("123", "focused");
          expect(repository.incrementInterruptions).not.toHaveBeenCalled();
      });
  });
});
