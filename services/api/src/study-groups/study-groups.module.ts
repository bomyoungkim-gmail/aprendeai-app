import { Module } from "@nestjs/common";
import { StudyGroupsService } from "./study-groups.service";
import { StudyGroupsController } from "./study-groups.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { EmailModule } from "../email/email.module";
import { WebSocketModule } from "../websocket/websocket.module";
import { GroupSessionsService } from "./group-sessions.service";
import { GroupChatService } from "./group-chat.service";

// Repositories
import { IStudyGroupsRepository } from "./domain/study-groups.repository.interface";
import { PrismaStudyGroupsRepository } from "./infrastructure/repositories/prisma-study-groups.repository";

// Use Cases
import { CreateStudyGroupUseCase } from "./application/use-cases/create-study-group.use-case";
import { InviteGroupMemberUseCase } from "./application/use-cases/invite-group-member.use-case";
import { ManageGroupContentUseCase } from "./application/use-cases/manage-group-content.use-case";

@Module({
  imports: [PrismaModule, EmailModule, WebSocketModule],
  controllers: [StudyGroupsController],
  providers: [
    StudyGroupsService,
    GroupSessionsService,
    GroupChatService,
    CreateStudyGroupUseCase,
    InviteGroupMemberUseCase,
    ManageGroupContentUseCase,
    {
      provide: IStudyGroupsRepository,
      useClass: PrismaStudyGroupsRepository,
    },
  ],
  exports: [
    StudyGroupsService,
    GroupSessionsService,
    GroupChatService,
    CreateStudyGroupUseCase,
    IStudyGroupsRepository,
  ],
})
export class StudyGroupsModule {}
