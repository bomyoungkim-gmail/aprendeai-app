import { Module } from "@nestjs/common";
import { WebClipsController } from "./webclips.controller";
import { WebClipsService } from "./webclips.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [WebClipsController],
  providers: [WebClipsService],
  exports: [WebClipsService],
})
export class WebClipsModule {}
