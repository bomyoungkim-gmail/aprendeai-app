import { ISessionsRepository } from "../../domain/sessions.repository.interface";
import { ReadingSession } from "../../domain/reading-session.entity";
import { ICornellRepository } from "../../../cornell/domain/interfaces/cornell.repository.interface";
export declare class AdvancePhaseUseCase {
    private readonly sessionsRepository;
    private readonly cornellRepository;
    private readonly logger;
    constructor(sessionsRepository: ISessionsRepository, cornellRepository: ICornellRepository);
    execute(sessionId: string, userId: string, toPhase: "POST" | "FINISHED"): Promise<ReadingSession>;
    private validatePostCompletion;
}
