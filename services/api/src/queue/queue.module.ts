import { Module, Global } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { QueueService } from "./queue.service";
import { QueueConsumerService } from "./queue-consumer.service";
import { PrismaModule } from "../prisma/prisma.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { AIContentModule } from "../common/services/ai-content.module";

@Global()
@Module({
  imports: [ConfigModule, PrismaModule, NotificationsModule, AIContentModule],
  providers: [QueueService, QueueConsumerService],
  exports: [QueueService],
})
export class QueueModule {}
