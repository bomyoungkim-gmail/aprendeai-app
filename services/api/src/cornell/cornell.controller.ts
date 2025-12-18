import { Body, Controller, Delete, Get, Param, Post, Put, Request, Res, UseGuards, SetMetadata } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { QuotaGuard } from '../common/guards/quota.guard';
import { CornellService } from './cornell.service';
import { StorageService } from './services/storage.service';
import { CreateHighlightDto, UpdateCornellDto, UpdateHighlightDto } from './dto/cornell.dto';

@Controller('contents')
@UseGuards(AuthGuard('jwt'))
export class CornellController {
  constructor(
    private cornellService: CornellService,
    private storageService: StorageService,
  ) {}

  @Get('my-contents')
  async getMyContents(@Request() req) {
    return this.cornellService.getMyContents(req.user.id);
  }

  @Get('files/:id/proxy')
  async proxyFile(@Param('id') id: string, @Res() res) {
    return this.storageService.streamFile(id, res);
  }

  @Get(':id')
  async getContent(@Param('id') id: string, @Request() req) {
    return this.cornellService.getContent(id, req.user.id);
  }

  @Get(':id/cornell')
  async getCornellNotes(@Param('id') id: string, @Request() req) {
    return this.cornellService.getOrCreateCornellNotes(id, req.user.id);
  }

  @Put(':id/cornell')
  @UseGuards(QuotaGuard)
  @SetMetadata('quota_metric', 'cornellNotes')
  async updateCornellNotes(
    @Param('id') id: string,
    @Body() dto: UpdateCornellDto,
    @Request() req
  ) {
    return this.cornellService.updateCornellNotes(id, dto, req.user.id);
  }

  @Get(':id/highlights')
  async getHighlights(@Param('id') id: string, @Request() req) {
    return this.cornellService.getHighlights(id, req.user.id);
  }

  @Post(':id/highlights')
  @UseGuards(QuotaGuard)
  @SetMetadata('quota_metric', 'highlights')
  async createHighlight(
    @Param('id') id: string,
    @Body() dto: CreateHighlightDto,
    @Request() req
  ) {
    return this.cornellService.createHighlight(id, dto, req.user.id);
  }
}

@Controller('highlights')
@UseGuards(AuthGuard('jwt'))
export class HighlightsController {
  constructor(private cornellService: CornellService) {}

  @Put(':id')
  async updateHighlight(
    @Param('id') id: string,
    @Body() dto: UpdateHighlightDto,
    @Request() req
  ) {
    return this.cornellService.updateHighlight(id, dto, req.user.id);
  }

  @Delete(':id')
  async deleteHighlight(@Param('id') id: string, @Request() req) {
    return this.cornellService.deleteHighlight(id, req.user.id);
  }
}
