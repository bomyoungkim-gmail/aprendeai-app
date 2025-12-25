import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import { Server, Socket } from "socket.io";
import { Logger, UseGuards } from "@nestjs/common";
import { WsJwtGuard } from "./guards/ws-jwt.guard";
import { URL_CONFIG } from "../config/urls.config";

@WebSocketGateway({
  cors: {
    origin: URL_CONFIG.corsOrigins,
    credentials: true,
  },
  namespace: "/study-groups",
})
@UseGuards(WsJwtGuard)
export class StudyGroupsWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private jwtService: JwtService) {}

  private logger = new Logger("StudyGroupsWebSocketGateway");

  handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect();
        return;
      }

      try {
        const payload = this.jwtService.verify(token);
        client.data.user = {
          userId: payload.sub,
          email: payload.email,
          name: payload.name,
        };
      } catch (err) {
        client.disconnect();
        return;
      }
    } catch (e) {
      client.disconnect();
      return;
    }
    const user = client.data.user;
    if (user) {
      this.logger.log(`Client connected: ${client.id}, User: ${user.userId}`);
    }
  }

  private extractToken(client: Socket): string | undefined {
    const token = client.handshake.auth?.token || client.handshake.query?.token;
    if (typeof token === "string") {
      return token.startsWith("Bearer ") ? token.substring(7) : token;
    }
    return undefined;
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    this.logger.log(`Client disconnected: ${client.id}, User: ${user?.userId}`);
  }

  @SubscribeMessage("joinSession")
  handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    const { sessionId } = data;
    const user = client.data.user;

    // Join the session-specific room
    client.join(`session:${sessionId}`);

    this.logger.log(`User ${user.userId} joined session ${sessionId}`);

    // Notify other participants
    client.to(`session:${sessionId}`).emit("userJoined", {
      userId: user.userId,
      userName: user.name,
      timestamp: new Date().toISOString(),
    });

    return { success: true, message: `Joined session ${sessionId}` };
  }

  @SubscribeMessage("leaveSession")
  handleLeaveSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    const { sessionId } = data;
    const user = client.data.user;

    // Leave the session room
    client.leave(`session:${sessionId}`);

    this.logger.log(`User ${user.userId} left session ${sessionId}`);

    // Notify other participants
    client.to(`session:${sessionId}`).emit("userLeft", {
      userId: user.userId,
      userName: user.name,
      timestamp: new Date().toISOString(),
    });

    return { success: true, message: `Left session ${sessionId}` };
  }

  // Helper method to emit events to a session
  emitToSession(sessionId: string, event: string, data: any) {
    this.server.to(`session:${sessionId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Emitted ${event} to session ${sessionId}`);
  }

  // Helper method to emit events to a group (for annotations, chat, etc)
  emitToGroup(groupId: string, event: string, data: any) {
    this.server.to(`group:${groupId}`).emit(event, data);
    this.logger.debug(`Emitted ${event} to group ${groupId}`);
  }
}
