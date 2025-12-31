import { ActorRole } from "../../common/enums";
export declare class HilRequestDto {
    required: boolean;
    actorRole: ActorRole;
    question: string;
    options?: string[];
}
export declare class AgentTurnResponseDto {
    threadId: string;
    readingSessionId: string;
    nextPrompt: string;
    quickReplies?: string[];
    hilRequest?: HilRequestDto;
    eventsToWrite?: any[];
    usage?: TokenUsageDto;
}
export declare class TokenUsageDto {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost_est_usd?: number;
}
