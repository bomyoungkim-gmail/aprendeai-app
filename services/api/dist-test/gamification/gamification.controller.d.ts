import { GamificationService } from "./gamification.service";
import { ActivityProgressDto, SetDailyGoalDto } from "./dto/gamification.dto";
export declare class GamificationController {
    private readonly gamificationService;
    constructor(gamificationService: GamificationService);
    getDashboard(req: any): Promise<{
        dailyActivity: {
            id: string;
            created_at: Date;
            date: Date;
            user_id: string;
            minutes_studied: number;
            sessions_count: number;
            contents_read: number;
            annotations_created: number;
            minutes_spent: number;
            lessons_completed: number;
            goal_met: boolean;
        } | {
            minutes_spent: number;
            lessons_completed: number;
            goal_met: false;
        };
        dailyGoal: {
            id: string;
            created_at: Date;
            updated_at: Date;
            user_id: string;
            goal_type: import(".prisma/client").$Enums.DailyGoalType;
            goal_value: number;
        } | {
            goal_type: "MINUTES";
            goal_value: number;
        };
        streak: {
            updated_at: Date;
            user_id: string;
            current_streak: number;
            best_streak: number;
            last_goal_met_date: Date | null;
            freeze_tokens: number;
        } | {
            current_streak: number;
            best_streak: number;
            freeze_tokens: number;
        };
        recentBadges: ({
            badges: {
                description: string;
                id: string;
                name: string;
                code: string;
                image_url: string | null;
            };
        } & {
            id: string;
            user_id: string;
            badge_id: string;
            awarded_at: Date;
        })[];
    }>;
    getGoalAchievements(req: any): Promise<{
        totalAchievements: number;
    }>;
    setGoal(req: any, dto: SetDailyGoalDto): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        user_id: string;
        goal_type: import(".prisma/client").$Enums.DailyGoalType;
        goal_value: number;
    }>;
    registerActivity(req: any, dto: ActivityProgressDto): Promise<{
        id: string;
        created_at: Date;
        date: Date;
        user_id: string;
        minutes_studied: number;
        sessions_count: number;
        contents_read: number;
        annotations_created: number;
        minutes_spent: number;
        lessons_completed: number;
        goal_met: boolean;
    }>;
}
