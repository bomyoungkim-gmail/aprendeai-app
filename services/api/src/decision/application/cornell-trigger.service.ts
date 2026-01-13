/**
 * Cornell Trigger Service
 *
 * Maps Cornell events (pillars) to business rules and actions.
 * Implements deterministic logic for Vocabulary, Doubt, Evidence, Main Idea, and Synthesis.
 *
 * Clean Architecture: Application layer service.
 */

import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { PrismaService } from "../../prisma/prisma.service";
import { DecisionService } from "./decision.service";
import { TelemetryService } from "../../telemetry/telemetry.service";
import { TelemetryEventType } from "../../telemetry/domain/telemetry.constants";

interface CornellEventPayload {
  contentId: string;
  userId: string;
  sessionId?: string;
  data?: any;
}

@Injectable()
export class CornellTriggerService {
  private readonly logger = new Logger(CornellTriggerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly decisionService: DecisionService,
    private readonly telemetryService: TelemetryService,
  ) {}

  /**
   * VOCABULARY: Check glossary and mark needs_glossary if missing
   */
  @OnEvent("cornell_highlight_created")
  async handleVocabularyHighlight(payload: CornellEventPayload) {
    if (payload.data?.pillarTag !== "VOCABULARY") return;

    const { contentId, userId, data } = payload;
    const highlightText = data?.text || data?.comment;

    if (!highlightText) return;

    // Check if term exists in glossary
    const glossaryEntry = await this.findGlossaryEntry(
      contentId,
      highlightText,
    );

    if (!glossaryEntry) {
      this.logger.debug(
        `Vocabulary term "${highlightText}" not found in glossary. Marking needs_glossary.`,
      );

      // Mark metadata for pipeline
      await this.markNeedsGlossary(contentId, highlightText);
    }
  }

  /**
   * DOUBT: Trigger DecisionService with DOUBT_SPIKE
   */
  @OnEvent("cornell_highlight_created")
  async handleDoubtHighlight(payload: CornellEventPayload) {
    if (payload.data?.pillarTag !== "DOUBT") return;

    const { contentId, userId, sessionId } = payload;

    this.logger.debug(
      `DOUBT highlight detected for user ${userId}. Triggering DecisionService.`,
    );

    try {
      const decision = await this.decisionService.makeDecision({
        userId,
        sessionId: sessionId || "unknown",
        contentId,
        uiPolicyVersion: "1.0.0",
        signals: {
          explicitUserAction: "USER_EXPLICIT_ASK",
          doubtsInWindow: 1, // Single doubt mark
          checkpointFailures: 0,
          flowState: "FLOW",
          summaryQuality: "OK",
        },
      });

      this.logger.debug(
        `Decision for DOUBT: ${decision.action} (${decision.reason})`,
      );
    } catch (error) {
      this.logger.error(
        "Failed to trigger DecisionService for DOUBT",
        error.stack,
      );
    }
  }

  /**
   * MAIN_IDEA / EVIDENCE: Update section_transfer_metadata
   */
  @OnEvent("cornell_highlight_created")
  async handleEvidenceOrMainIdea(payload: CornellEventPayload) {
    const pillarTag = payload.data?.pillarTag;
    if (pillarTag !== "MAIN_IDEA" && pillarTag !== "EVIDENCE") return;

    const { contentId, userId, data } = payload;
    const pageNumber = data?.pageNumber || 0;
    const highlightText = data?.text || data?.comment || "";

    this.logger.debug(
      `${pillarTag} highlight detected. Updating transfer metadata.`,
    );

    try {
      // Find existing metadata for this content/chunk
      const chunkId = `${contentId}_page_${pageNumber}`;
      const existing = await this.prisma.section_transfer_metadata.findFirst({
        where: { content_id: contentId, chunk_id: chunkId },
      });

      if (existing) {
        // Update existing
        const currentConcepts = (existing.concept_json as any) || {};
        const currentTools = (existing.tools_json as any) || {};

        await this.prisma.section_transfer_metadata.update({
          where: { id: existing.id },
          data: {
            concept_json:
              pillarTag === "MAIN_IDEA"
                ? { ...currentConcepts, [highlightText]: true }
                : currentConcepts,
            tools_json:
              pillarTag === "EVIDENCE"
                ? { ...currentTools, [highlightText]: true }
                : currentTools,
            updated_at: new Date(),
          },
        });
      } else {
        // Create new
        await this.prisma.section_transfer_metadata.create({
          data: {
            content_id: contentId,
            chunk_id: chunkId,
            page_number: pageNumber,
            concept_json:
              pillarTag === "MAIN_IDEA" ? { [highlightText]: true } : {},
            tools_json:
              pillarTag === "EVIDENCE" ? { [highlightText]: true } : {},
          },
        });
      }

      this.logger.debug(`Transfer metadata updated for chunk ${chunkId}`);
    } catch (error) {
      this.logger.error("Failed to update transfer metadata", error.stack);
    }
  }

  /**
   * SYNTHESIS: Trigger POST phase missions (Bridging + PKM)
   */
  @OnEvent("cornell_summary_submitted")
  async handleSynthesis(payload: CornellEventPayload) {
    const { contentId, userId, sessionId, data } = payload;
    const summaryLength = data?.summaryLen || 0;

    if (summaryLength < 50) {
      this.logger.debug("Summary too short. Skipping POST phase trigger.");
      return;
    }

    this.logger.debug(
      `SYNTHESIS detected (${summaryLength} chars). Triggering POST phase.`,
    );

    try {
      // Assign Bridging Mission (deterministic)
      await this.assignBridgingMission(userId, contentId, sessionId);

      // Assign PKM Mission (deterministic)
      await this.assignPKMMission(userId, contentId, sessionId);

      this.logger.debug("POST phase missions assigned successfully.");
    } catch (error) {
      this.logger.error("Failed to assign POST phase missions", error.stack);
    }
  }

  // ========================================
  // PRIVATE HELPERS
  // ========================================

  private async findGlossaryEntry(contentId: string, term: string) {
    // Check content_versions.vocabulary_glossary
    const contentVersion = await this.prisma.content_versions.findFirst({
      where: { content_id: contentId },
      select: { vocabulary_glossary: true },
    });

    if (contentVersion?.vocabulary_glossary) {
      const glossary = contentVersion.vocabulary_glossary as any;
      if (glossary[term.toLowerCase()]) return glossary[term.toLowerCase()];
    }

    // Check learning_assets.glossary_json
    const asset = await this.prisma.learning_assets.findFirst({
      where: { content_id: contentId },
      select: { glossary_json: true },
    });

    if (asset?.glossary_json) {
      const glossary = asset.glossary_json as any;
      if (glossary[term.toLowerCase()]) return glossary[term.toLowerCase()];
    }

    return null;
  }

  private async markNeedsGlossary(contentId: string, term: string) {
    // Update content metadata to flag missing glossary
    const content = await this.prisma.contents.findUnique({
      where: { id: contentId },
      select: { metadata: true },
    });

    await this.prisma.contents.update({
      where: { id: contentId },
      data: {
        metadata: {
          ...((content?.metadata as any) || {}),
          needs_glossary: true,
          missing_terms: [
            ...((content?.metadata as any)?.missing_terms || []),
            term,
          ],
        },
      },
    });
  }

  private async assignBridgingMission(
    userId: string,
    contentId: string,
    sessionId?: string,
  ) {
    // Find Bridging mission template using 'type' enum
    const mission = await this.prisma.transfer_missions.findFirst({
      where: {
        type: "BRIDGING",
        scope_type: "GLOBAL",
      },
    });

    if (!mission) {
      this.logger.warn("Bridging mission template not found.");
      return;
    }

    // Assign to user
    await this.prisma.transfer_attempts.create({
      data: {
        user_id: userId,
        mission_id: mission.id,
        content_id: contentId,
        status: "PENDING",
      },
    });

    // Emit telemetry
    await this.telemetryService.track(
      {
        eventType: TelemetryEventType.MISSION_ASSIGNED,
        eventVersion: "1.0.0",
        contentId,
        sessionId: sessionId || "unknown",
        data: {
          missionId: mission.id,
          type: "BRIDGING",
        },
      },
      userId,
    );
  }

  private async assignPKMMission(
    userId: string,
    contentId: string,
    sessionId?: string,
  ) {
    // Find PKM mission template using 'type' enum
    const mission = await this.prisma.transfer_missions.findFirst({
      where: {
        type: "PKM",
        scope_type: "GLOBAL",
      },
    });

    if (!mission) {
      this.logger.warn("PKM mission template not found.");
      return;
    }

    // Assign to user
    await this.prisma.transfer_attempts.create({
      data: {
        user_id: userId,
        mission_id: mission.id,
        content_id: contentId,
        status: "PENDING",
      },
    });

    // Emit telemetry
    await this.telemetryService.track(
      {
        eventType: TelemetryEventType.MISSION_ASSIGNED,
        eventVersion: "1.0.0",
        contentId,
        sessionId: sessionId || "unknown",
        data: {
          missionId: mission.id,
          type: "PKM",
        },
      },
      userId,
    );
  }
}
