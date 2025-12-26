/**
 * Cornell Highlights Controller
 * 
 * REST API endpoints for Cornell Notes highlights with granular authorization.
 * 
 * Routes:
 * - POST   /api/v1/cornell/contents/:id/highlights
 * - GET    /api/v1/cornell/contents/:id/highlights
 * - PATCH  /api/v1/cornell/highlights/:id/visibility
 * - DELETE /api/v1/cornell/highlights/:id
 * - POST   /api/v1/cornell/highlights/:id/comments
 */

import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { CornellHighlightsService } from '../services/cornell-highlights.service';
import {
  CreateCornellHighlightDto,
  UpdateHighlightVisibilityDto,
  CreateAnnotationCommentDto,
} from '../dto/create-cornell-highlight.dto';

@ApiTags('Cornell Notes - Highlights')
@Controller('cornell')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CornellHighlightsController {
  constructor(private readonly highlightsService: CornellHighlightsService) {}

  /**
   * Create a new highlight on content
   */
  @Post('contents/:contentId/highlights')
  @ApiOperation({
    summary: 'Create Cornell highlight',
    description: 'Create a new highlight with Cornell Notes type (NOTE, QUESTION, STAR, HIGHLIGHT)',
  })
  @ApiResponse({ status: 201, description: 'Highlight created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to context' })
  async createHighlight(
    @Param('contentId') contentId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCornellHighlightDto,
  ) {
    return this.highlightsService.createHighlight(contentId, userId, dto);
  }

  /**
   * Get all highlights for content (filtered by permissions)
   */
  @Get('contents/:contentId/highlights')
  @ApiOperation({
    summary: 'Get content highlights',
    description: 'Get all highlights for content, filtered by user permissions',
  })
  @ApiResponse({ status: 200, description: 'Highlights retrieved successfully' })
  async getHighlights(
    @Param('contentId') contentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.highlightsService.getHighlights(contentId, userId);
  }

  /**
   * Update highlight visibility (owner only)
   */
  @Patch('highlights/:highlightId/visibility')
  @ApiOperation({
    summary: 'Update highlight visibility',
    description: 'Change highlight visibility settings (owner only)',
  })
  @ApiResponse({ status: 200, description: 'Visibility updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the owner' })
  @ApiResponse({ status: 404, description: 'Highlight not found' })
  async updateVisibility(
    @Param('highlightId') highlightId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateHighlightVisibilityDto,
  ) {
    return this.highlightsService.updateVisibility(highlightId, userId, dto);
  }

  /**
   * Delete highlight (soft delete, owner only)
   */
  @Delete('highlights/:highlightId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete highlight',
    description: 'Soft delete a highlight (owner only)',
  })
  @ApiResponse({ status: 204, description: 'Highlight deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the owner' })
  @ApiResponse({ status: 404, description: 'Highlight not found' })
  async deleteHighlight(
    @Param('highlightId') highlightId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.highlightsService.deleteHighlight(highlightId, userId);
  }

  /**
   * Create comment on highlight (thread system)
   */
  @Post('highlights/:highlightId/comments')
  @ApiOperation({
    summary: 'Add comment to highlight',
    description: 'Create a comment on a highlight (thread system)',
  })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot read highlight' })
  @ApiResponse({ status: 404, description: 'Highlight not found' })
  async createComment(
    @Param('highlightId') highlightId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAnnotationCommentDto,
  ) {
    return this.highlightsService.createComment(highlightId, userId, dto);
  }
}
