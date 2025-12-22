import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@prisma/client';
import { WebClipsService } from './webclips.service';
import { CreateWebClipDto, StartWebClipSessionDto } from './dto/webclip.dto';
import { ROUTES } from '../common/constants/routes.constants';
import { ExtensionScopeGuard, RequireExtensionScopes } from '../auth/extension-scope.guard';

@ApiTags('WebClips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(ROUTES.WEBCLIP.BASE) // Centralized route - no hardcoding
export class WebClipsController {
  constructor(private readonly webClipsService: WebClipsService) {}

  /**
   * Create WebClip from browser extension
   * 
   * @param user - Authenticated user
   * @param dto - WebClip creation data (selection or full page)
   * @returns contentId and readerUrl
   */
  @Post()
  @UseGuards(JwtAuthGuard, ExtensionScopeGuard) // ✅ Validate extension scope
  @RequireExtensionScopes('extension:webclip:create')
  @ApiOperation({ summary: 'Create WebClip from browser extension' })
  async createWebClip(@CurrentUser() user: User, @Body() dto: CreateWebClipDto) {
    return this.webClipsService.createWebClip(user.id, dto);
  }

  /**
   * Start reading session for a WebClip
   * 
   * @param user - Authenticated user
   * @param contentId - WebClip content ID
   * @param dto - Session parameters (timebox, intent, etc.)
   * @returns readingSessionId, threadId, and initial prompt
   */
  @Post(':contentId/sessions/start')
  @UseGuards(JwtAuthGuard, ExtensionScopeGuard)
  @RequireExtensionScopes('extension:session:start')
  @ApiOperation({ summary: 'Start reading session for WebClip' })
  async startSession(
    @CurrentUser() user: User,
    @Param('contentId') contentId: string,
    @Body() dto: StartWebClipSessionDto,
  ) {
    return this.webClipsService.startSession(user.id, contentId, dto);
  }

  /**
   * Get WebClip by ID (for verification)
   */
  @Get(':contentId')
  @ApiOperation({ summary: 'Get WebClip by ID' })
  async getWebClip(
    @CurrentUser() user: User,
    @Param('contentId') contentId: string,
  ) {
    return this.webClipsService.getWebClip(user.id, contentId);
  }
}
