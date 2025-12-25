import { Module } from "@nestjs/common";
import { OpsController } from "./ops.controller";
import { OpsService } from "./ops.service";
import { PrismaModule } from "../prisma/prisma.module";
import { FamilyModule } from "../family/family.module";

@Module({
  imports: [PrismaModule, FamilyModule],
  controllers: [OpsController],
  providers: [OpsService],
  exports: [OpsService],
})
export class OpsModule {}
