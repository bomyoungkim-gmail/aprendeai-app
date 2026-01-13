import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { DcsCalculatorService } from "../weighting/dcs-calculator.service";

/**
 * DCS Integration Helper
 *
 * Provides helper methods for DecisionService to fetch and apply DCS weighting logic.
 * Implements the weighting rules from GRAPH SCRIPT 09:
 * - Threshold adjustment: base + 0.25 * w_det
 * - Depth policy: Restrict allowed actions based on w_det buckets
 * - Budget scaling: session_budget * w_llm
 * - Invisible mode: NO_OP if w_det >= 0.5 during DURING phase
 */
@Injectable()
export class DcsIntegrationHelper {
  private readonly logger = new Logger(DcsIntegrationHelper.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dcsCalculator: DcsCalculatorService,
  ) {}

  /**
   * Fetch DCS for content/session context
   */
  async fetchDcs(
    contentId: string,
    scopeType: string,
    scopeId: string | null,
  ): Promise<{ dcs: number; w_det: number; w_llm: number } | null> {
    const score = await (this.prisma as any).determinism_scores.findFirst({
      where: {
        content_id: contentId,
        scope_type: scopeType as any,
        scope_id: scopeId,
      },
      orderBy: { updated_at: "desc" },
    });

    if (!score) {
      this.logger.debug(
        `No DCS found for content ${contentId}, defaulting to w_det=0`,
      );
      return { dcs: 0.0, w_det: 0.0, w_llm: 1.0 };
    }

    return {
      dcs: score.dcs,
      w_det: score.w_det,
      w_llm: score.w_llm,
    };
  }

  /**
   * Apply DCS weighting to threshold
   */
  applyThresholdWeighting(baseThreshold: number, w_det: number): number {
    return baseThreshold + 0.25 * w_det;
  }

  /**
   * Check if action is allowed based on w_det bucket
   */
  isActionAllowed(action: string, w_det: number): boolean {
    // w_det >= 0.80: Only UNDECIDED and STRUCTURAL_ANALOGY_ON_DEMAND
    if (w_det >= 0.8) {
      return ["UNDECIDED", "STRUCTURAL_ANALOGY_ON_DEMAND", "NO_OP"].includes(
        action,
      );
    }

    // 0.50 <= w_det < 0.80: Allow EDGE_TYPING, UNDECIDED, ANALOGY
    if (w_det >= 0.5) {
      return [
        "EDGE_TYPING_TOPK_POST",
        "UNDECIDED",
        "ANALOGY_ON_DEMAND",
        "NO_OP",
      ].includes(action);
    }

    // w_det < 0.50: Allow BOOTSTRAP, EDGE_TYPING, UNDECIDED
    return true; // All actions allowed
  }

  /**
   * Scale budget by w_llm
   */
  scaleBudget(baseBudget: number, w_llm: number): number {
    return Math.floor(baseBudget * w_llm);
  }

  /**
   * Check if invisible mode should suppress action
   */
  shouldSuppressInvisible(
    phase: string,
    explicitAsk: boolean,
    w_det: number,
  ): boolean {
    if (phase === "DURING" && !explicitAsk && w_det >= 0.5) {
      return true;
    }
    return false;
  }

  /**
   * Log decision weight event
   */
  async logWeightEvent(
    sessionId: string,
    userId: string,
    contentId: string,
    dcs: number,
    w_det: number,
    w_llm: number,
    action: string,
    suppressed: boolean,
    reason?: string,
  ): Promise<void> {
    await (this.prisma as any).decision_weight_events.create({
      data: {
        session_id: sessionId,
        user_id: userId,
        content_id: contentId,
        dcs,
        w_det,
        w_llm,
        action,
        suppressed,
        reason,
      },
    });
  }
}
