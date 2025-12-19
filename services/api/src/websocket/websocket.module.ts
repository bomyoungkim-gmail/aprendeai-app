import { Module } from '@nestjs/common';
import { StudyGroupsWebSocketGateway } from './study-groups-ws.gateway';
import { StudyGroupsModule } from '../study-groups/study-groups.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [StudyGroupsModule, AuthModule],
  providers: [StudyGroupsWebSocketGateway],
})
export class WebSocketModule {}
