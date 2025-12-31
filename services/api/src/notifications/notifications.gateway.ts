import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { URL_CONFIG } from "../config/urls.config";

@WebSocketGateway({
  cors: {
    origin: URL_CONFIG.corsOrigins,
    credentials: true,
  },
  namespace: "notifications",
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake auth
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        throw new UnauthorizedException("No token provided");
      }

      // Verify JWT
      const payload = await this.jwtService.verifyAsync(token);

      // Store user info in socket data
      client.data.userId = payload.sub || payload.id;

      this.logger.log(
        `Client connected: ${client.id} (User: ${client.data.userId})`,
      );
    } catch (error) {
      this.logger.error(`Connection rejected: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Subscribe to updates for a specific content
   */
  @SubscribeMessage("subscribeToContent")
  handleSubscribeToContent(
    @ConnectedSocket() client: Socket,
    @MessageBody() contentId: string,
  ) {
    const room = `content:${contentId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
    return { success: true, room };
  }

  /**
   * Unsubscribe from content updates
   */
  @SubscribeMessage("unsubscribeFromContent")
  handleUnsubscribeFromContent(
    @ConnectedSocket() client: Socket,
    @MessageBody() contentId: string,
  ) {
    const room = `content:${contentId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} unsubscribed from ${room}`);
    return { success: true };
  }

  /**
   * Emit content update to all subscribers
   */
  emitContentUpdate(
    contentId: string,
    type: "simplification" | "assessment" | "general",
  ) {
    const room = `content:${contentId}`;
    this.server.to(room).emit("contentUpdated", {
      contentId,
      type,
      timestamp: new Date().toISOString(),
      success: true,
    });
    this.logger.log(`Emitted contentUpdated to ${room} (type: ${type})`);
  }

  /**
   * Emit content error to all subscribers
   */
  emitContentError(
    contentId: string,
    type: "simplification" | "assessment",
    errorKey: string,
    message: string,
  ) {
    const room = `content:${contentId}`;
    this.server.to(room).emit("contentError", {
      contentId,
      type,
      error: errorKey, // e.g. 'QUOTA_EXCEEDED', 'AI_ERROR'
      message,
      timestamp: new Date().toISOString(),
      success: false,
    });
    this.logger.error(`Emitted contentError to ${room}: ${errorKey}`);
  }
}
