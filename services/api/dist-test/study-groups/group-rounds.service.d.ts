import { PrismaService } from "../prisma/prisma.service";
import { GroupSessionsService } from "./group-sessions.service";
import { UpdatePromptDto } from "./dto/update-prompt.dto";
import { SubmitEventDto } from "./dto/submit-event.dto";
import { RoundStatus } from "@prisma/client";
import { StudyGroupsWebSocketGateway } from "../websocket/study-groups-ws.gateway";
export declare class GroupRoundsService {
    private readonly prisma;
    private readonly groupSessionsService;
    private readonly wsGateway;
    private readonly logger;
    constructor(prisma: PrismaService, groupSessionsService: GroupSessionsService, wsGateway: StudyGroupsWebSocketGateway);
    updatePrompt(sessionId: string, roundIndex: number, user_id: string, dto: UpdatePromptDto): Promise<{
        id: string;
        created_at: Date;
        status: import(".prisma/client").$Enums.RoundStatus;
        session_id: string;
        round_index: number;
        round_type: string;
        prompt_json: import("@prisma/client/runtime/library").JsonValue;
        timing_json: import("@prisma/client/runtime/library").JsonValue;
    }>;
    advanceRound(sessionId: string, roundIndex: number, user_id: string, toStatus: RoundStatus): Promise<{
        id: string;
        created_at: Date;
        status: import(".prisma/client").$Enums.RoundStatus;
        session_id: string;
        round_index: number;
        round_type: string;
        prompt_json: import("@prisma/client/runtime/library").JsonValue;
        timing_json: import("@prisma/client/runtime/library").JsonValue;
    }>;
    submitEvent(sessionId: string, user_id: string, dto: SubmitEventDto): Promise<{
        id: string;
        created_at: Date;
        user_id: string | null;
        event_type: string;
        payload_json: import("@prisma/client/runtime/library").JsonValue;
        session_id: string;
        round_id: string | null;
    }>;
    getEvents(sessionId: string, roundIndex?: number): Promise<({
        group_rounds: {
            round_index: number;
        };
    } & {
        id: string;
        created_at: Date;
        user_id: string | null;
        event_type: string;
        payload_json: import("@prisma/client/runtime/library").JsonValue;
        session_id: string;
        round_id: string | null;
    })[]>;
    getSharedCards(sessionId: string): Promise<({
        group_rounds: {
            status: import(".prisma/client").$Enums.RoundStatus;
            round_index: number;
        };
    } & {
        id: string;
        created_at: Date;
        session_id: string;
        round_id: string;
        created_by_user_id: string;
        card_json: import("@prisma/client/runtime/library").JsonValue;
    })[]>;
    private validateTransition;
    private assertAllVoted;
    private assertExplanationPresent;
    private createSharedCard;
    private assertFacilitatorPermission;
}
