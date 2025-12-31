import { Controller, Get, Post, Body, Query, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ReviewService } from "./review.service";
import { VocabAttemptDto, ReviewQueueQueryDto } from "./dto/review.dto";

// TODO (Issue #9): Add proper AuthGuard in V5
@ApiTags("Review")
@Controller("v5/review")
@Controller("review")
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  @Get("queue")
  @ApiOperation({ summary: "Get daily review queue" })
  @ApiResponse({
    status: 200,
    description: "Review queue retrieved successfully",
  })
  async getQueue(@Req() req: any, @Query() query: ReviewQueueQueryDto) {
    // TODO: Get userId from auth token
    const userId = req.user?.id || "test-user-id";
    const limit = query.limit ? parseInt(query.limit, 10) : undefined;

    return this.reviewService.getReviewQueue(userId, limit);
  }

  @Post("vocab/attempt")
  @ApiOperation({ summary: "Record vocabulary attempt" })
  @ApiResponse({ status: 201, description: "Attempt recorded successfully" })
  async recordAttempt(@Req() req: any, @Body() dto: VocabAttemptDto) {
    // TODO: Get userId from auth token
    const userId = req.user?.id || "test-user-id";

    // Ownership check delegated to Service/UseCase
    return this.reviewService.recordVocabAttempt(
      userId,
      dto.vocabId,
      dto.dimension,
      dto.result as any,
      dto.sessionId,
    );
  }
}
