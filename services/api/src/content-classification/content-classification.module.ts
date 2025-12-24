import { Module } from '@nestjs/common';
import { ContentClassificationService } from './content-classification.service';
import { ContentClassificationController } from './content-classification.controller';

@Module({
  controllers: [ContentClassificationController],
  providers: [ContentClassificationService],
  exports: [ContentClassificationService],
})
export class ContentClassificationModule {}
