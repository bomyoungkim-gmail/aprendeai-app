import { Controller, Get, Param, Query } from '@nestjs/common';
import { GraphDiffService } from './graph-diff.service';
import { GraphDiffResponseDto } from './dto/graph-diff-response.dto';

/**
 * Graph Diff Controller
 * 
 * Provides API endpoints to visualize knowledge graph changes.
 * 
 * TODO: AC3: Graph Diff Visualization - Frontend displays diff in user-friendly format
 * (This endpoint returns the raw diff_json, frontend needs to render it visually)
 */
@Controller('graph/diff')
export class GraphDiffController {
  constructor(private readonly diffService: GraphDiffService) {}

  /**
   * Get graph diff for a user
   * 
   * GET /graph/diff/:userId
   * GET /graph/diff/:userId/:contentId
   * 
   * Query params:
   * - since: ISO timestamp or relative time (e.g., "24h", "7d", "1w")
   */
  @Get(':userId')
  async getDiffByUser(
    @Param('userId') userId: string,
    @Query('since') since?: string,
  ): Promise<GraphDiffResponseDto> {
    return this.handleGetDiff(userId, null, since);
  }

  @Get(':userId/:contentId')
  async getDiffByContent(
    @Param('userId') userId: string,
    @Param('contentId') contentId: string,
    @Query('since') since?: string,
  ): Promise<GraphDiffResponseDto> {
    return this.handleGetDiff(userId, contentId, since);
  }

  private async handleGetDiff(
    userId: string,
    contentId: string | null,
    since?: string,
  ): Promise<GraphDiffResponseDto> {
    // Parse since parameter
    let sinceDate: Date;
    
    if (!since) {
      // Default to last 24 hours
      sinceDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    } else if (since.match(/^\d+[hdw]$/)) {
      // Relative time format
      sinceDate = this.diffService.parseRelativeTime(since);
    } else {
      // ISO timestamp
      sinceDate = new Date(since);
      if (isNaN(sinceDate.getTime())) {
        throw new Error('Invalid date format. Use ISO timestamp or relative format (e.g., "24h")');
      }
    }

    return this.diffService.calculateDiff(
      userId,
      contentId,
      sinceDate,
    );
  }
}
