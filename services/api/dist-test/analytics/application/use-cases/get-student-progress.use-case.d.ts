import { IAnalyticsRepository } from "../../domain/analytics.repository.interface";
import { ProgressStatsDto } from "../../dto/analytics.dto";
export declare class GetStudentProgressUseCase {
    private readonly repository;
    constructor(repository: IAnalyticsRepository);
    execute(userId: string): Promise<ProgressStatsDto>;
}
