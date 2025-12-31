import { IEventRepository } from '../../domain/interfaces/event.repository.interface';
export declare class LogEventUseCase {
    private readonly eventRepo;
    private readonly logger;
    constructor(eventRepo: IEventRepository);
    execute(dto: {
        sessionId: string;
        userId: string;
        event: any;
    }): Promise<void>;
}
