import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { IDecisionLogRepository } from "../../domain/decision-log.repository.interface";
import {
  DecisionInput,
  DecisionOutput,
  DecisionResultV2,
} from "../../domain/decision.types";

/**
 * Prisma implementation of decision log repository
 *
 * Handles persistence of all decision events to the decision_logs table.
 */
@Injectable()
export class PrismaDecisionLogRepository implements IDecisionLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async logDecision(
    decision: DecisionOutput,
    context: DecisionInput,
  ): Promise<string> {
    const log = await this.prisma.decision_logs.create({
      data: {
        id: this.generateId(),
        user_id: context.userId,
        session_id: context.sessionId,
        content_id: context.contentId || null,
        chunk_id: context.chunkId || null,
        output_action: decision.action,
        channel: decision.channel,
        reason: decision.reason,
        input_facts_json: decision.payload || {},
        ui_policy_version: context.uiPolicyVersion || null,
        created_at: new Date(),
      },
    });

    return log.id;
  }

  /**
   * Log decision v2 with suppression tracking
   */
  async logDecisionV2(
    result: DecisionResultV2,
    context: DecisionInput,
  ): Promise<string> {
    const log = await this.prisma.decision_logs.create({
      data: {
        id: this.generateId(),
        user_id: context.userId,
        session_id: context.sessionId,
        content_id: context.contentId || null,
        chunk_id: context.chunkId || null,

        // Legacy fields (for backward compatibility)
        output_action: result.finalAction,
        channel: result.channelAfter,
        reason: "NO_TRIGGER", // Will be populated from proposal in future
        input_facts_json: result.payload || {},
        ui_policy_version: context.uiPolicyVersion || null,

        // v2 fields
        candidate_action: result.candidateAction,
        final_action: result.finalAction,
        suppressed: result.suppressed,
        suppress_reasons_json: result.suppressReasons,
        channel_before: result.channelBefore,
        channel_after: result.channelAfter,
        budget_remaining_tokens: result.budgetRemainingTokens ?? null,
        cooldown_until: result.cooldownUntil
          ? new Date(result.cooldownUntil)
          : null,
        policy_snapshot_json: result.policySnapshot || {},

        created_at: new Date(),
      },
    });

    return log.id;
  }

  private generateId(): string {
    return `dec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get decision metrics for a time range
   * Aggregates decisions by channel to verify 80/20 rule (Deterministic vs LLM)
   */
  async getDecisionMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    total: number;
    byChannel: Record<string, number>;
    deterministicRatio: number;
  }> {
    // Count all non-NO_OP decisions in the time range
    const decisions = await this.prisma.decision_logs.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
        final_action: {
          not: "NO_OP",
        },
      },
      select: {
        channel_after: true,
      },
    });

    const total = decisions.length;
    const byChannel: Record<string, number> = {};

    // Count by channel
    for (const decision of decisions) {
      const channel = decision.channel_after || "UNKNOWN";
      byChannel[channel] = (byChannel[channel] || 0) + 1;
    }

    // Calculate deterministic ratio
    const deterministicCount = byChannel["DETERMINISTIC"] || 0;
    const deterministicRatio = total > 0 ? deterministicCount / total : 0;

    return {
      total,
      byChannel,
      deterministicRatio,
    };
  }
}
