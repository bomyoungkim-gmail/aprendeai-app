import { OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import { Server, Socket } from "socket.io";
export declare class StudyGroupsWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    server: Server;
    constructor(jwtService: JwtService);
    private logger;
    handleConnection(client: Socket): void;
    private extractToken;
    handleDisconnect(client: Socket): void;
    handleJoinSession(client: Socket, data: {
        sessionId: string;
    }): {
        success: boolean;
        message: string;
    };
    handleLeaveSession(client: Socket, data: {
        sessionId: string;
    }): {
        success: boolean;
        message: string;
    };
    emitToSession(sessionId: string, event: string, data: any): void;
    emitToGroup(groupId: string, event: string, data: any): void;
}
