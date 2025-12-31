import { TrackActivityUseCase } from "./application/use-cases/track-activity.use-case";
import { GetActivityStatsUseCase } from "./application/use-cases/get-activity-stats.use-case";
import { IActivityRepository } from "./domain/interfaces/activity.repository.interface";
import { HeatmapData } from "./domain/entities/activity.entity";
export { ActivityStats, HeatmapData } from "./domain/entities/activity.entity";
export declare class ActivityService {
    private readonly trackActivityUseCase;
    private readonly getActivityStatsUseCase;
    private readonly activityRepo;
    constructor(trackActivityUseCase: TrackActivityUseCase, getActivityStatsUseCase: GetActivityStatsUseCase, activityRepo: IActivityRepository);
    trackActivity(userId: string, type: "study" | "annotation" | "read" | "session", minutes?: number): Promise<void>;
    getActivityHeatmap(userId: string, days?: number): Promise<HeatmapData[]>;
    getActivityStats(userId: string): Promise<import("./domain/entities/activity.entity").ActivityStats>;
}
