import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { GraphBaselineService } from "../baseline/graph-baseline.service";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * GRAPH SCRIPT 19.8: Content Baseline Listener
 *
 * Automatically triggers baseline graph generation when content extraction completes.
 * Implements idempotency to avoid duplicate baseline builds.
 */
@Injectable()
export class ContentBaselineListener {
  private readonly logger = new Logger(ContentBaselineListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly graphBaselineService: GraphBaselineService,
  ) {}

  /**
   * Trigger baseline build when content extraction completes
   */
  @OnEvent("extraction.completed")
  async handleExtractionCompleted(payload: { contentId: string }) {
    this.logger.log(`Extraction completed for content: ${payload.contentId}`);

    try {
      // 1. Check if baseline already exists (idempotency)
      const existingBaseline = await this.findBaseline(payload.contentId);

      if (existingBaseline) {
        this.logger.log(
          `Baseline already exists for ${payload.contentId}, skipping auto-build`,
        );
        return;
      }

      // 2. Verify content has extractions
      const content = await this.prisma.contents.findUnique({
        where: { id: payload.contentId },
        include: {
          content_extractions: true,
        },
      });

      if (!content) {
        this.logger.warn(`Content ${payload.contentId} not found`);
        return;
      }

      if (!content.content_extractions) {
        this.logger.debug(
          `No extractions found for ${payload.contentId}, skipping baseline build`,
        );
        return;
      }

      // 3. Build baseline graph
      this.logger.log(
        `Auto-building baseline for content: ${payload.contentId}`,
      );

      await this.graphBaselineService.buildBaseline({
        contentId: payload.contentId,
        scopeType: "GLOBAL" as any, // GraphScopeType enum
        scopeId: "system",
      });

      this.logger.log(`Baseline auto-build complete for ${payload.contentId}`);
    } catch (error) {
      this.logger.error(
        `Failed to auto-build baseline for ${payload.contentId}: ${error.message}`,
        error.stack,
      );
      // Don't throw - this is a best-effort operation
    }
  }

  /**
   * Find existing baseline graph for content
   */
  private async findBaseline(contentId: string) {
    return (this.prisma as any).topic_graphs.findFirst({
      where: {
        type: "BASELINE",
        content_id: contentId,
      },
    });
  }
}
