import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { GatingService } from "./gating.service";

@Module({
  imports: [PrismaModule],
  providers: [GatingService],
  exports: [GatingService],
})
export class GatingModule {}
