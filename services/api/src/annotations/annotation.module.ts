import { Module } from '@nestjs/common';
import { AnnotationService } from './annotation.service';
import { AnnotationExportService } from './annotation-export.service';
import { AnnotationController, AnnotationSearchController } from './annotation.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [PrismaModule, WebSocketModule],
  controllers: [AnnotationController, AnnotationSearchController],
  providers: [AnnotationService, AnnotationExportService],
  exports: [AnnotationService],
})
export class AnnotationModule {}
