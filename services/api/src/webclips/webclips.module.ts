import { Module } from "@nestjs/common";
import { WebClipsController } from "./webclips.controller";
import { WebClipsService } from "./webclips.service";
import { PrismaModule } from "../prisma/prisma.module";

import { CornellModule } from "../cornell/cornell.module";
import { SessionsModule } from "../sessions/sessions.module";

@Module({
  imports: [PrismaModule, CornellModule, SessionsModule],
  controllers: [WebClipsController],
  providers: [WebClipsService],
  exports: [WebClipsService],
})
export class WebClipsModule {}
