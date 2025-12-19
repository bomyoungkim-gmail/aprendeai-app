import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  UseGuards,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WsJwtGuard } from './guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/study-groups',
})
@UseGuards(WsJwtGuard)
export class StudyGroupsWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('StudyGroupsWebSocketGateway');

  handleConnection(client: Socket) {
    const user = client.data.user;
    this.logger.log(`Client connected: ${client.id}, User: ${user?.userId}`);
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    this.logger.log(`Client disconnected: ${client.id}, User: ${user?.userId}`);
  }

  @SubscribeMessage('joinSession')
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
    client.to(`session:${sessionId}`).emit('userJoined', {
      userId: user.userId,
      userName: user.name,
      timestamp: new Date().toISOString(),
    });

    return { success: true, message: `Joined session ${sessionId}` };
  }

  @SubscribeMessage('leaveSession')
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
    client.to(`session:${sessionId}`).emit('userLeft', {
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
}
