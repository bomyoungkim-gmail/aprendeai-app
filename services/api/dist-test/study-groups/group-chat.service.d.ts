import { PrismaService } from "../prisma/prisma.service";
import { GroupSessionsService } from "./group-sessions.service";
import { SendChatMessageDto } from "./dto/send-chat-message.dto";
export declare class GroupChatService {
    private readonly prisma;
    private readonly groupSessionsService;
    constructor(prisma: PrismaService, groupSessionsService: GroupSessionsService);
    sendMessage(sessionId: string, userId: string, dto: SendChatMessageDto): Promise<{
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
    getMessages(sessionId: string, roundIndex: number, userId: string): Promise<{
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
