import { Controller, Get, Query, UseGuards, Logger } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { CurrentUser } from "../../auth/presentation/decorators/current-user.decorator";

import { GraphRecommendationService } from "./graph-recommendation.service";
import { TelemetryService } from "../../telemetry/telemetry.service";

@ApiTags("Graph Recommendations")
@Controller("graph/recommendations")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GraphRecommendationController {
  private readonly logger = new Logger(GraphRecommendationController.name);

  constructor(
    private readonly recommendationService: GraphRecommendationService,
    private readonly telemetry: TelemetryService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get content recommendations for user" })
  @ApiQuery({
    name: "contentId",
    required: false,
    description: "Context content ID",
  })
  @ApiResponse({ status: 200, description: "Recommendations generated" })
  async getRecommendations(
    @CurrentUser() user: any,
    @Query("contentId") contentId?: string,
  ) {
    this.logger.log(`Recommendations requested by user ${user.userId}`);

    const result = await this.recommendationService.getRecommendations(
      user.userId,
      contentId,
    );

    // Emit telemetry event
    await this.telemetry.track(
      {
        eventType: "graph_recommendation_shown",
        eventVersion: "1.0.0",
        contentId: contentId,
        sessionId: null,
        data: {
          itemsCount: result.recommendations.length,
          reasons: result.recommendations.map((r) => r.reason),
          strategies: result.strategies,
        },
      },
      user.userId,
    );

    return {
      recommendations: result.recommendations,
      metadata: {
        strategies: result.strategies,
        timestamp: new Date(),
      },
    };
  }
}
