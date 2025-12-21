import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ContentService } from './content.service';
import { QueueService } from '../queue/queue.service';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto';
import { CreateContentVersionDto } from './dto/content-version.dto';
import { AuthGuard } from '@nestjs/passport'; // Keep explicit guard or remove if using global
import { Public } from '../auth/decorators/public.decorator';

@Controller('content')
export class ContentController {
  constructor(
    private readonly contentService: ContentService,
    private readonly queueService: QueueService,
  ) {}

  // @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() createContentDto: CreateContentDto) {
    return this.contentService.create(createContentDto);
  }

  @Get()
  findAll() {
    return this.contentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contentService.findOne(id);
  }

  // @UseGuards(AuthGuard('jwt'))
  @Post(':id/versions')
  addVersion(@Param('id') id: string, @Body() createVersionDto: CreateContentVersionDto) {
    return this.contentService.addVersion(id, createVersionDto);
  }

  // Guards are now global, but keeping explicit ones doesn't hurt (or we can clean them up)
  @Post(':id/simplify')
  async triggerSimplify(@Param('id') id: string, @Body() body: { text: string; level?: string; lang?: string }) {
    const QUEUE = 'content.process';

    try {
        const payload = {
            action: 'SIMPLIFY',
            contentId: id,
            text: body.text,
            level: body.level || '5_EF',
            targetLang: body.lang || 'PT_BR'
        };
        
        await this.queueService.publish(QUEUE, payload);

        return { message: 'Simplification task queued' };
    } catch (err) {
        console.error(err);
        throw new HttpException('Failed to queue task', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':id/assessment')
  async triggerAssessment(@Param('id') id: string, @Body() body: { text: string; level?: string }) {
    const QUEUE = 'content.process';

    try {
        const payload = {
            action: 'ASSESSMENT',
            contentId: id,
            text: body.text,
            level: body.level || '1_EM'
        };
        
        await this.queueService.publish(QUEUE, payload);

        return { message: 'Assessment task queued' };
    } catch (err) {
        console.error(err);
        throw new HttpException('Failed to queue task', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateContentDto: UpdateContentDto) {
    return this.contentService.update(id, updateContentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contentService.remove(id);
  }
}
