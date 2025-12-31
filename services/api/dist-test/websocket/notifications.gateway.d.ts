import { OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import { Server, Socket } from "socket.io";
export declare class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    server: Server;
    constructor(jwtService: JwtService);
    private logger;
    handleConnection(client: Socket): void;
    private extractToken;
    handleDisconnect(client: Socket): void;
    handleSubscribeToContent(client: Socket, contentId: string): {
        success: boolean;
        message: string;
    };
    handleUnsubscribeFromContent(client: Socket, contentId: string): {
        success: boolean;
        message: string;
    };
}
