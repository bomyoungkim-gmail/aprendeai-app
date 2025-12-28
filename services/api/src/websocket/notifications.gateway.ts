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
  namespace: "/notifications",
})
@UseGuards(WsJwtGuard)
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private jwtService: JwtService) {}

  private logger = new Logger("NotificationsGateway");

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
      this.logger.log(`Client connected to notifications: ${client.id}, User: ${user.userId}`);
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
    if (user) {
      this.logger.log(`Client disconnected from notifications: ${client.id}, User: ${user.userId}`);
    }
  }

  @SubscribeMessage("subscribeToContent")
  handleSubscribeToContent(
    @ConnectedSocket() client: Socket,
    @MessageBody() contentId: string,
  ) {
    const user = client.data.user;
    client.join(`content:${contentId}`);
    this.logger.log(`User ${user.userId} subscribed to content updates: ${contentId}`);
    return { success: true, message: `Subscribed to content ${contentId}` };
  }

  @SubscribeMessage("unsubscribeFromContent")
  handleUnsubscribeFromContent(
    @ConnectedSocket() client: Socket,
    @MessageBody() contentId: string,
  ) {
    const user = client.data.user;
    client.leave(`content:${contentId}`);
    this.logger.log(`User ${user.userId} unsubscribed from content: ${contentId}`);
    return { success: true, message: `Unsubscribed from content ${contentId}` };
  }

  // TODO: Add generic notification subscription if needed
}
