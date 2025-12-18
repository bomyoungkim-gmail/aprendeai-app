import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ContentService } from './content.service';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto';
import { CreateContentVersionDto } from './dto/content-version.dto';
import { AuthGuard } from '@nestjs/passport';
import * as amqp from 'amqplib';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

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

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/simplify')
  async triggerSimplify(@Param('id') id: string, @Body() body: { text: string; level?: string; lang?: string }) {
    // Ideally this logic moves to Service or a QueueService
    const RABBIT_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    const QUEUE = 'content.process';

    try {
        const conn = await amqp.connect(RABBIT_URL);
        const channel = await conn.createChannel();
        await channel.assertQueue(QUEUE, { durable: true });
        
        const payload = {
            action: 'SIMPLIFY',
            contentId: id,
            text: body.text,
            level: body.level || '5_EF',
            targetLang: body.lang || 'PT_BR'
        };
        
        channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(payload)));
        await channel.close();
        await conn.close();

        return { message: 'Simplification task queued' };
    } catch (err) {
        console.error(err);
        throw new HttpException('Failed to queue task', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/assessment')
  async triggerAssessment(@Param('id') id: string, @Body() body: { text: string; level?: string }) {
    const RABBIT_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    const QUEUE = 'content.process';

    try {
        const conn = await amqp.connect(RABBIT_URL);
        const channel = await conn.createChannel();
        await channel.assertQueue(QUEUE, { durable: true });
        
        const payload = {
            action: 'ASSESSMENT',
            contentId: id,
            text: body.text,
            level: body.level || '1_EM'
        };
        
        channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(payload)));
        await channel.close();
        await conn.close();

        return { message: 'Assessment task queued' };
    } catch (err) {
        console.error(err);
        throw new HttpException('Failed to queue task', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateContentDto: UpdateContentDto) {
    return this.contentService.update(id, updateContentDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contentService.remove(id);
  }
}
