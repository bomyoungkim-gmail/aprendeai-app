import { users } from "@prisma/client";
import { OpsService } from "./ops.service";
import { LogTimeDto } from "./dto/ops.dto";
export declare class OpsController {
    private opsService;
    constructor(opsService: OpsService);
    getDailySnapshot(user: users): Promise<import("./domain/entities/ops-snapshot.entity").OpsSnapshot>;
    getWhatsNext(user: users): Promise<import("./domain/entities/ops-task.entity").OpsTask[]>;
    getContextCards(user: users): Promise<import("./domain/entities/context-card.entity").ContextCard[]>;
    logTime(user: users, dto: LogTimeDto): Promise<{
        success: boolean;
        message: string;
    }>;
    getBootPrompt(user: users): Promise<import("../prompts/dto/canonical-prompt.dto").CanonicalPrompt>;
    getClosePrompt(user: users): Promise<import("../prompts/dto/canonical-prompt.dto").CanonicalPrompt>;
}
