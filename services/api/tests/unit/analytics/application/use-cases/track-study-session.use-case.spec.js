"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const track_study_session_use_case_1 = require("../../../../../src/analytics/application/use-cases/track-study-session.use-case");
const analytics_repository_interface_1 = require("../../../../../src/analytics/domain/analytics.repository.interface");
const study_session_entity_1 = require("../../../../../src/analytics/domain/study-session.entity");
describe("TrackStudySessionUseCase", () => {
    let useCase;
    let repository;
    const mockRepository = {
        createSession: jest.fn(),
        updateSession: jest.fn(),
        findReadingSession: jest.fn(),
        incrementInterruptions: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                track_study_session_use_case_1.TrackStudySessionUseCase,
                {
                    provide: analytics_repository_interface_1.IAnalyticsRepository,
                    useValue: mockRepository,
                },
            ],
        }).compile();
        useCase = module.get(track_study_session_use_case_1.TrackStudySessionUseCase);
        repository = module.get(analytics_repository_interface_1.IAnalyticsRepository);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe("startSession", () => {
        it("should create and return a new session", async () => {
            const sessionData = new study_session_entity_1.StudySession({ id: "123", userId: "user-1", activityType: "reading" });
            mockRepository.createSession.mockResolvedValue(sessionData);
            const result = await useCase.startSession("user-1", "reading");
            expect(repository.createSession).toHaveBeenCalled();
            expect(result).toEqual(sessionData);
        });
    });
    describe("finishSession", () => {
        it("should update session with metrics", async () => {
            mockRepository.updateSession.mockResolvedValue(new study_session_entity_1.StudySession({ id: "123", endTime: new Date() }));
            await useCase.finishSession("123", { durationMinutes: 10, netFocusMinutes: 8 });
            expect(repository.updateSession).toHaveBeenCalledWith("123", expect.objectContaining({
                durationMinutes: 10,
                netFocusMinutes: 8,
                focusScore: 80,
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
//# sourceMappingURL=track-study-session.use-case.spec.js.map