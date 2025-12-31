import { IOpsRepository } from '../../domain/interfaces/ops.repository.interface';
export declare class LogStudyTimeUseCase {
    private readonly opsRepo;
    constructor(opsRepo: IOpsRepository);
    execute(userId: string, minutes: number): Promise<{
        success: boolean;
        message: string;
    }>;
}
