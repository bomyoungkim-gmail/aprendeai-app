import { OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
export declare class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    server: Server;
    private readonly logger;
    constructor(jwtService: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleSubscribeToContent(client: Socket, contentId: string): {
        success: boolean;
        room: string;
    };
    handleUnsubscribeFromContent(client: Socket, contentId: string): {
        success: boolean;
    };
    emitContentUpdate(contentId: string, type: "simplification" | "assessment" | "general"): void;
    emitContentError(contentId: string, type: "simplification" | "assessment", errorKey: string, message: string): void;
}
