import { ISessionsRepository } from "../../domain/sessions.repository.interface";
import { SessionEvent } from "../../domain/reading-session.entity";
export declare class RecordEventUseCase {
    private readonly sessionsRepository;
    constructor(sessionsRepository: ISessionsRepository);
    execute(sessionId: string, eventType: string, payload: any): Promise<SessionEvent>;
}
