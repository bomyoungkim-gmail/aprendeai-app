import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TopicMasteryService } from "./topic-mastery.service";

@Module({
  providers: [TopicMasteryService, PrismaService],
  exports: [TopicMasteryService],
})
export class TopicMasteryModule {}
