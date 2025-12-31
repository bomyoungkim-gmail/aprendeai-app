import { PrismaService } from "../prisma/prisma.service";
import { StudyGroupsService } from "./study-groups.service";
import { CreateSessionDto } from "./dto/create-session.dto";
import { group_sessions as GroupSession } from "@prisma/client";
import { StudyGroupsWebSocketGateway } from "../websocket/study-groups-ws.gateway";
export declare class GroupSessionsService {
    private readonly prisma;
    private readonly studyGroupsService;
    private readonly wsGateway;
    private readonly logger;
    constructor(prisma: PrismaService, studyGroupsService: StudyGroupsService, wsGateway: StudyGroupsWebSocketGateway);
    createSession(group_id: string, user_id: string, dto: CreateSessionDto): Promise<GroupSession>;
    getSession(sessionId: string, user_id: string): Promise<{
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
    startSession(sessionId: string, user_id: string): Promise<void>;
    updateSessionStatus(sessionId: string, user_id: string, status: string): Promise<void>;
    getGroupSessions(group_id: string): Promise<({
        _count: {
            group_rounds: number;
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
    })[]>;
    private assignRoles;
    private getDefaultTimers;
}
