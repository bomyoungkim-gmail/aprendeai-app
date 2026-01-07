import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { ContentPedagogicalService } from "../services/content-pedagogical.service";
import { CreateContentPedagogicalDataDto } from "../dto/create-content-pedagogical-data.dto";
import { CreateGameResultDto } from "../dto/create-game-result.dto";
import { CurrentUser } from "../../auth/presentation/decorators/current-user.decorator";
import { users } from "@prisma/client";
import * as crypto from "crypto";
import { ApiKeyGuard } from "../../auth/infrastructure/api-key.guard";
import { Public } from "../../auth/presentation/decorators/public.decorator";

/**
 * Controller for Cornell Pedagogical Enhancement
 * Base route: Use ROUTES.CORNELL.BASE for consistency
 * Endpoints follow centralized ROUTES.CORNELL.PEDAGOGICAL_* pattern
 */
@ApiTags("Cornell Pedagogical")
@Controller("cornell") // Note: Decorators require string literals, but route is defined in ROUTES.CORNELL.BASE
@UseGuards(JwtAuthGuard)
export class ContentPedagogicalController {
  constructor(private readonly pedagogicalService: ContentPedagogicalService) {}

  @Get("contents/:id/context")
  @ApiOperation({
    summary: "Get pedagogical context (metadata + game results)",
  })
  async getContext(@Param("id") contentId: string) {
    const pedagogicalData =
      await this.pedagogicalService.getPedagogicalData(contentId);
    // TODO: Aggregate with progress and game results in future sprint or extended service method
    return {
      pedagogicalData,
    };
  }

  @Post("contents/:id/pedagogical")
  @UseGuards(ApiKeyGuard) // Allow workers to create pedagogical data
  @Public()
  @ApiOperation({
    summary: "Create or update pedagogical data (Internal/Worker use)",
  })
  async createOrUpdatePedagogical(
    @Param("id") contentId: string,
    @Body() dto: CreateContentPedagogicalDataDto,
  ) {
    const pedagogicalData = {
      vocabulary_triage: dto.vocabularyTriage,
      socratic_questions: dto.socraticQuestions,
      quiz_questions: dto.quizQuestions,
      taboo_cards: dto.tabooCards,
      boss_fight_config: dto.bossFightConfig,
      free_recall_prompts: dto.freeRecallPrompts,
      processing_version: dto.processingVersion,
    };
    return this.pedagogicalService.createOrUpdatePedagogicalData(
      contentId,
      pedagogicalData,
    );
  }

  @Post("contents/:id/game-results")
  @ApiOperation({ summary: "Record a game result" })
  async recordGameResult(
    @Param("id") contentId: string,
    @Body() dto: CreateGameResultDto,
    @CurrentUser() user: users,
  ) {
    return this.pedagogicalService.recordGameResult({
      id: crypto.randomUUID(),
      users: { connect: { id: user.id } },
      contents: { connect: { id: contentId } },
      game_type: dto.gameType,
      score: dto.score,
      metadata: dto.metadata || {},
      played_at: new Date(),
    });
  }
}
