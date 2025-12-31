import { ISessionsRepository } from "../../domain/sessions.repository.interface";
export declare class GetSessionUseCase {
    private readonly sessionsRepository;
    constructor(sessionsRepository: ISessionsRepository);
    execute(sessionId: string, userId: string): Promise<any>;
}
