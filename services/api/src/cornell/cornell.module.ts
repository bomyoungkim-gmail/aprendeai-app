import { Module } from '@nestjs/common';
import { CornellController } from './cornell.controller';
import { CornellService } from './cornell.service';
import { StorageService } from './services/storage.service';
import { ContentService } from './services/content.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CornellController],
  providers: [CornellService, StorageService, ContentService],
  exports: [CornellService],
})
export class CornellModule {}
