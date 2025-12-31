import { ActivityService } from "./activity.service";
declare class TrackActivityDto {
    type: "study" | "annotation" | "read" | "session";
    minutes?: number;
}
export declare class ActivityController {
    private readonly activityService;
    constructor(activityService: ActivityService);
    trackActivity(userId: string, dto: TrackActivityDto): Promise<{
        success: boolean;
    }>;
    getHeatmap(userId: string, days?: string): Promise<import("./activity.service").HeatmapData[]>;
    getStats(userId: string): Promise<import("./activity.service").ActivityStats>;
}
export {};
