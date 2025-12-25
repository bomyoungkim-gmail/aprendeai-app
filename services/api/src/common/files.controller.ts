import { Controller, Get, Param, Res, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { StorageService } from '../cornell/services/storage.service';
import { ContentAccessService } from '../cornell/services/content-access.service';

@Controller('files')
@UseGuards(AuthGuard('jwt'))
export class FilesController {
  constructor(
    private storageService: StorageService,
    private contentAccessService: ContentAccessService,
  ) {}

  @Get(':id/view')
  async viewFile(
    @Param('id') id: string,
    @Res() res: Response,
    @Request() req,
  ) {
    // Security: Verify permission before serving file
    const canAccess = await this.contentAccessService.canAccessFile(
      id,
      req.user.id,
    );

    if (!canAccess) {
      throw new ForbiddenException(
        'Access denied. This file may be private or shared within a specific group.',
      );
    }

    await this.storageService.streamFile(id, res);
  }

  @Get(':id/view-url')
  async getViewUrl(@Param('id') id: string, @Request() req) {
    // Security: Verify permission
    const canAccess = await this.contentAccessService.canAccessFile(
      id,
      req.user.id,
    );

    if (!canAccess) {
      throw new ForbiddenException('Access denied');
    }

    return this.storageService.getFileViewUrl(id);
  }
}
