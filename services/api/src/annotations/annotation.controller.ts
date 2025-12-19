import { Controller, Post, Get, Put, Delete, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnnotationService } from './annotation.service';
import { CreateAnnotationDto, UpdateAnnotationDto } from './dto/annotation.dto';
import { SearchAnnotationsDto } from './dto/search-annotations.dto';
import { CreateReplyDto } from './dto/create-reply.dto';

@Controller('contents/:contentId/annotations')
@UseGuards(AuthGuard('jwt'))
export class AnnotationController {
  constructor(private annotationService: AnnotationService) {}

  @Post()
  create(
    @Param('contentId') contentId: string,
    @Body() dto: CreateAnnotationDto,
    @Request() req,
  ) {
    return this.annotationService.create(contentId, req.user.id, dto);
  }

  @Get()
  getAll(
    @Param('contentId') contentId: string,
    @Query('groupId') groupId: string,
    @Request() req,
  ) {
    return this.annotationService.getByContent(contentId, req.user.id, groupId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAnnotationDto,
    @Request() req,
  ) {
    return this.annotationService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req) {
    return this.annotationService.delete(id, req.user.id);
  }
}

// Search and filter annotations
@Controller('annotations')
@UseGuards(AuthGuard('jwt'))
export class AnnotationSearchController {
  constructor(private annotationService: AnnotationService) {}

  @Get('search')
  search(@Query() params: SearchAnnotationsDto, @Request() req) {
    return this.annotationService.searchAnnotations(req.user.id, params);
  }

  @Post(':id/reply')
  createReply(
    @Param('id') annotationId: string,
    @Body() dto: CreateReplyDto,
    @Request() req,
  ) {
    return this.annotationService.createReply(annotationId, req.user.id, dto);
  }

  @Patch(':id/favorite')
  toggleFavorite(@Param('id') id: string, @Request() req) {
    return this.annotationService.toggleFavorite(id, req.user.id);
  }
}
