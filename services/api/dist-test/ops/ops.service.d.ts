import { OpsCoachService } from "../family/services/ops-coach.service";
import { GetDailySnapshotUseCase } from "./application/use-cases/get-daily-snapshot.use-case";
import { GetTaskQueueUseCase } from "./application/use-cases/get-task-queue.use-case";
import { GetContextCardsUseCase } from "./application/use-cases/get-context-cards.use-case";
import { LogStudyTimeUseCase } from "./application/use-cases/log-study-time.use-case";
import { LogTimeDto } from "./dto/ops.dto";
export declare class OpsService {
    private readonly getDailySnapshotUseCase;
    private readonly getTaskQueueUseCase;
    private readonly getContextCardsUseCase;
    private readonly logStudyTimeUseCase;
    private readonly opsCoach;
    constructor(getDailySnapshotUseCase: GetDailySnapshotUseCase, getTaskQueueUseCase: GetTaskQueueUseCase, getContextCardsUseCase: GetContextCardsUseCase, logStudyTimeUseCase: LogStudyTimeUseCase, opsCoach: OpsCoachService);
    getDailySnapshot(userId: string): Promise<import("./domain/entities/ops-snapshot.entity").OpsSnapshot>;
    getWhatsNext(userId: string): Promise<import("./domain/entities/ops-task.entity").OpsTask[]>;
    getContextCards(userId: string): Promise<import("./domain/entities/context-card.entity").ContextCard[]>;
    logTime(userId: string, dto: LogTimeDto): Promise<{
        success: boolean;
        message: string;
    }>;
    getBootPrompt(userId: string): Promise<import("../prompts/dto/canonical-prompt.dto").CanonicalPrompt>;
    getClosePrompt(userId: string): Promise<import("../prompts/dto/canonical-prompt.dto").CanonicalPrompt>;
}
