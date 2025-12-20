import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { StudyGroupsWebSocketGateway } from './study-groups-ws.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, JwtModule],
  providers: [StudyGroupsWebSocketGateway],
  exports: [StudyGroupsWebSocketGateway], // Export for use in other modules
})
export class WebSocketModule {}
