import { 
  Body, Controller, Delete, Get, Param, Post, Put, Request, Res, Query,
  UseGuards, SetMetadata, UseInterceptors, UploadedFile, BadRequestException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { QuotaGuard } from '../common/guards/quota.guard';
import { CornellService } from './cornell.service';
import { StorageService } from './services/storage.service';
import { ContentService } from './services/content.service';
import { CreateHighlightDto, UpdateCornellDto, UpdateHighlightDto } from './dto/cornell.dto';
import { UploadContentDto } from './dto/upload-content.dto';
import { SearchContentDto } from './dto/search-content.dto';

@Controller('contents')
@UseGuards(AuthGuard('jwt'))
export class CornellController {
  constructor(
    private cornellService: CornellService,
    private storageService: StorageService,
    private contentService: ContentService,
  ) {}

  @Get('my-contents')
  async getMyContents(@Request() req) {
    return this.cornellService.getMyContents(req.user.id);
  }

  /**
   * Upload new content file (PDF, DOCX, TXT)
   * Max size: 20MB
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
      fileFilter: (req, file, cb) => {
        const allowed = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ];
        
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PDF, DOCX, and TXT files are allowed'), false);
        }
      },
    }),
  )
  async uploadContent(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadContentDto,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.contentService.uploadContent(file, dto, req.user.id);
  }

  /**
   * Search content
   */
  @Get('search')
  async searchContent(
    @Query() dto: SearchContentDto,
    @Request() req,
  ) {
    return this.contentService.searchContent(dto.q, {
      type: dto.type,
      language: dto.language,
      page: dto.page,
      limit: dto.limit,
    }, req.user.id);
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
