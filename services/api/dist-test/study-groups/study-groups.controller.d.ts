import { StudyGroupsService } from "./study-groups.service";
import { GroupSessionsService } from "./group-sessions.service";
import { GroupChatService } from "./group-chat.service";
import { StudyGroupsWebSocketGateway } from "../websocket/study-groups-ws.gateway";
import { CreateGroupDto } from "./dto/create-group.dto";
import { InviteGroupMemberDto } from "./dto/invite-member.dto";
import { AddContentDto } from "./dto/add-content.dto";
import { SendChatMessageDto } from "./dto/send-chat-message.dto";
export declare class StudyGroupsController {
    private readonly studyGroupsService;
    private readonly groupSessionsService;
    private readonly groupChatService;
    private readonly wsGateway;
    constructor(studyGroupsService: StudyGroupsService, groupSessionsService: GroupSessionsService, groupChatService: GroupChatService, wsGateway: StudyGroupsWebSocketGateway);
    createGroup(req: any, dto: CreateGroupDto): Promise<import("./domain/study-group.entity").StudyGroup>;
    getMyGroups(req: any): Promise<import("./domain/study-group.entity").StudyGroup[]>;
    getGroup(groupId: string, req: any): Promise<import("./domain/study-group.entity").StudyGroup>;
    inviteMember(groupId: string, dto: InviteGroupMemberDto, req: any): Promise<{
        message: string;
    }>;
    removeMember(groupId: string, userId: string, req: any): Promise<{
        message: string;
    }>;
    addContent(groupId: string, dto: AddContentDto, req: any): Promise<{
        message: string;
    }>;
    removeContent(groupId: string, contentId: string, req: any): Promise<{
        message: string;
    }>;
    getGroupSessions(groupId: string, req: any): Promise<({
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
    sendChatMessage(sessionId: string, dto: SendChatMessageDto, req: any): Promise<{
        userRole: any;
        users: {
            id: string;
            name: string;
        };
        id: string;
        created_at: Date;
        user_id: string;
        message: string;
        session_id: string;
        round_id: string;
    }>;
    getChatMessages(sessionId: string, round_index: string, req: any): Promise<{
        userRole: any;
        users: {
            id: string;
            name: string;
        };
        id: string;
        created_at: Date;
        user_id: string;
        message: string;
        session_id: string;
        round_id: string;
    }[]>;
}
