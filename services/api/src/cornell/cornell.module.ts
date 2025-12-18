import { Module } from '@nestjs/common';
import { CornellController } from './cornell.controller';
import { CornellService } from './cornell.service';
import { StorageService } from './services/storage.service';

@Module({
  controllers: [CornellController],
  providers: [CornellService, StorageService],
  exports: [CornellService],
})
export class CornellModule {}
