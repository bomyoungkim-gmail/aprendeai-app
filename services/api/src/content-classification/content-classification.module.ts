import { Module } from "@nestjs/common";
import { ContentClassificationService } from "./content-classification.service";
import { ContentClassificationController } from "./content-classification.controller";

import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [ContentClassificationController],
  providers: [ContentClassificationService],
  exports: [ContentClassificationService],
})
export class ContentClassificationModule {}
