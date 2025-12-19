import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { StudyGroupsService } from './study-groups.service';
import { GroupSessionsService } from './group-sessions.service';
import { GroupRoundsService } from './group-rounds.service';
import { GroupChatService } from './group-chat.service';
import { StudyGroupsController } from './study-groups.controller';
import { GroupSessionsController } from './group-sessions.controller';

@Module({
  imports: [PrismaModule, WebSocketModule],
  controllers: [StudyGroupsController, GroupSessionsController],
  providers: [StudyGroupsService, GroupSessionsService, GroupRoundsService, GroupChatService],
  exports: [StudyGroupsService, GroupSessionsService, GroupRoundsService, GroupChatService],
})
export class StudyGroupsModule {}
