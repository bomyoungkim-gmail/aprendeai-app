import { Module } from '@nestjs/common';
import { StudyGroupsWebSocketGateway } from './study-groups-ws.gateway';
import { AuthModule } from '../auth/auth.module';

import { WsJwtGuard } from './guards/ws-jwt.guard';

@Module({
  imports: [AuthModule],
  providers: [StudyGroupsWebSocketGateway, WsJwtGuard],
  exports: [StudyGroupsWebSocketGateway], // Export for use in other modules
})
export class WebSocketModule {}
