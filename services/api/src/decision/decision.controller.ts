import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { DecisionService } from "./application/decision.service";
import {
  EvaluateDecisionDto,
  DecisionResponseDto,
} from "./application/dto/decision.dto";
import { Public } from "../auth/presentation/decorators/public.decorator";

/**
 * Decision Controller
 *
 * Exposes the decision evaluation endpoint.
 * This is a thin presentation layer that delegates to the service.
 */
@ApiTags("decision")
@Controller("decision")
export class DecisionController {
  constructor(private readonly decisionService: DecisionService) {}

  @Post("evaluate")
  @HttpCode(HttpStatus.OK)
  @Public() // TODO: Remove this and add proper auth when integrated
  @ApiOperation({
    summary: "Evaluate decision based on user signals",
    description:
      "Determines whether to intervene (show hint, assign mission, etc.) or stay invisible based on user behavior signals.",
  })
  @ApiResponse({
    status: 200,
    description: "Decision evaluated successfully",
    type: DecisionResponseDto,
  })
  async evaluate(
    @Body() dto: EvaluateDecisionDto,
  ): Promise<DecisionResponseDto> {
    const decision = await this.decisionService.makeDecision({
      userId: dto.userId,
      sessionId: dto.sessionId,
      contentId: dto.contentId,
      chunkId: dto.chunkId,
      uiPolicyVersion: dto.uiPolicyVersion,
      signals: {
        explicitUserAction: dto.signals.explicitUserAction as any,
        doubtsInWindow: dto.signals.doubtsInWindow,
        checkpointFailures: dto.signals.checkpointFailures,
        flowState: dto.signals.flowState,
        summaryQuality: dto.signals.summaryQuality,
      },
    });

    return {
      action: decision.action,
      channel: decision.channel,
      reason: decision.reason,
      payload: decision.payload,
    };
  }
}
