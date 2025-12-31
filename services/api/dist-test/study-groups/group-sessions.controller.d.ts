import { GroupSessionsService } from "./group-sessions.service";
import { GroupRoundsService } from "./group-rounds.service";
import { CreateSessionDto } from "./dto/create-session.dto";
import { UpdateSessionStatusDto } from "./dto/update-session-status.dto";
import { UpdatePromptDto } from "./dto/update-prompt.dto";
import { AdvanceRoundDto } from "./dto/advance-round.dto";
import { SubmitEventDto } from "./dto/submit-event.dto";
export declare class GroupSessionsController {
    private readonly groupSessionsService;
    private readonly groupRoundsService;
    constructor(groupSessionsService: GroupSessionsService, groupRoundsService: GroupRoundsService);
    createSession(groupId: string, dto: CreateSessionDto, req: any): Promise<{
        id: string;
        created_at: Date;
        mode: import(".prisma/client").$Enums.GroupSessionMode;
        content_id: string;
        status: import(".prisma/client").$Enums.GroupSessionStatus;
        group_id: string;
        layer: string;
        starts_at: Date | null;
        ends_at: Date | null;
    }>;
    getSession(sessionId: string, req: any): Promise<{
        contents: {
            id: string;
            type: import(".prisma/client").$Enums.ContentType;
            title: string;
        };
        group_rounds: {
            id: string;
            created_at: Date;
            status: import(".prisma/client").$Enums.RoundStatus;
            session_id: string;
            round_index: number;
            round_type: string;
            prompt_json: import("@prisma/client/runtime/library").JsonValue;
            timing_json: import("@prisma/client/runtime/library").JsonValue;
        }[];
        group_session_members: ({
            users: {
                id: string;
                name: string;
                email: string;
            };
        } & {
            user_id: string;
            session_id: string;
            assigned_role: import(".prisma/client").$Enums.SessionRole;
            attendance_status: string;
        })[];
        study_groups: {
            study_group_members: {
                role: import(".prisma/client").$Enums.GroupRole;
                status: import(".prisma/client").$Enums.GroupMemberStatus;
                user_id: string;
                joined_at: Date;
                group_id: string;
            }[];
        } & {
            id: string;
            created_at: Date;
            name: string;
            scope_type: import(".prisma/client").$Enums.ScopeType | null;
            owner_user_id: string;
            scope_id: string | null;
        };
    } & {
        id: string;
        created_at: Date;
        mode: import(".prisma/client").$Enums.GroupSessionMode;
        content_id: string;
        status: import(".prisma/client").$Enums.GroupSessionStatus;
        group_id: string;
        layer: string;
        starts_at: Date | null;
        ends_at: Date | null;
    }>;
    startSession(sessionId: string, req: any): Promise<{
        message: string;
    }>;
    updateStatus(sessionId: string, dto: UpdateSessionStatusDto, req: any): Promise<{
        message: string;
    }>;
    updatePrompt(sessionId: string, roundIndex: string, dto: UpdatePromptDto, req: any): Promise<{
        id: string;
        created_at: Date;
        status: import(".prisma/client").$Enums.RoundStatus;
        session_id: string;
        round_index: number;
        round_type: string;
        prompt_json: import("@prisma/client/runtime/library").JsonValue;
        timing_json: import("@prisma/client/runtime/library").JsonValue;
    }>;
    advanceRound(sessionId: string, roundIndex: string, dto: AdvanceRoundDto, req: any): Promise<{
        id: string;
        created_at: Date;
        status: import(".prisma/client").$Enums.RoundStatus;
        session_id: string;
        round_index: number;
        round_type: string;
        prompt_json: import("@prisma/client/runtime/library").JsonValue;
        timing_json: import("@prisma/client/runtime/library").JsonValue;
    }>;
    submitEvent(sessionId: string, dto: SubmitEventDto, req: any): Promise<{
        id: string;
        created_at: Date;
        user_id: string | null;
        event_type: string;
        payload_json: import("@prisma/client/runtime/library").JsonValue;
        session_id: string;
        round_id: string | null;
    }>;
    getEvents(sessionId: string, round_index?: string): Promise<({
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
}
