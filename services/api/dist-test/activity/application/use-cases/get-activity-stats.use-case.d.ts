import { IActivityRepository } from '../../domain/interfaces/activity.repository.interface';
import { ActivityStats } from '../../domain/entities/activity.entity';
export declare class GetActivityStatsUseCase {
    private readonly activityRepo;
    constructor(activityRepo: IActivityRepository);
    execute(userId: string): Promise<ActivityStats>;
    private calculateCurrentStreak;
    private calculateLongestStreak;
}
