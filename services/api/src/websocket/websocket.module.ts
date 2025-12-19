import { Module } from '@nestjs/common';
import { StudyGroupsWebSocketGateway } from './study-groups-ws.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [StudyGroupsWebSocketGateway],
  exports: [StudyGroupsWebSocketGateway], // Export for use in other modules
})
export class WebSocketModule {}
