import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransferMetadataService } from '../transfer/transfer-metadata.service';
import { TelemetryService } from '../telemetry/telemetry.service';
import { DecisionService } from '../decision/application/decision.service';

interface TransferMetadataBuildJob {
  contentId: string;
  scopeType: string;
  familyId?: string;
  institutionId?: string;
  userId?: string; // PATCH 04v2: Required for policy evaluation
}

@Injectable()
export class TransferMetadataConsumer {
  private readonly logger = new Logger(TransferMetadataConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transferMetadataService: TransferMetadataService,
    private readonly telemetryService: TelemetryService,
    private readonly decisionService: DecisionService,
  ) {}

  async processTransferMetadataBuild(
    job: TransferMetadataBuildJob,
  ): Promise<void> {
    const { contentId, scopeType, familyId, institutionId, userId } = job;

    this.logger.log(
      `Processing transfer metadata build for content ${contentId}`,
    );

    let chunksProcessed = 0;
    let usedLLMCount = 0;
    let cacheHitCount = 0;

    // PATCH 04v2: Evaluate extraction policy
    // Default to POST phase for background jobs
    const policyEvaluation = userId
      ? await this.decisionService.evaluateExtractionPolicy(userId, 'POST', {
          contentId,
          sessionId: `transfer-build-${contentId}`,
        })
      : { allowed: false, caps: { maxTokens: 0, modelTier: 'none' } };

    this.logger.debug(
      `LLM fallback ${policyEvaluation.allowed ? 'ALLOWED' : 'DENIED'} for user ${userId}${policyEvaluation.reason ? ` (reason: ${policyEvaluation.reason})` : ''}`,
    );

    try {
      // Fetch content chunks
      const chunks = await this.prisma.content_chunks.findMany({
        where: { content_id: contentId },
        orderBy: { chunk_index: 'asc' },
      });

      // Process in small batches
      const batchSize = 5;
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);

        for (const chunk of batch) {
          try {
            const result = await this.transferMetadataService.extractAndStore({
              contentId,
              chunkId: chunk.id,
              chunkIndex: chunk.chunk_index,
              pageNumber: chunk.page_number || undefined,
              scopeType,
              familyId,
              institutionId,
              userId,
              fallbackConfig: {
                allowLLM: policyEvaluation.allowed,
                caps: policyEvaluation.caps,
                phase: 'POST',
              },
            });

            // Aggregate counters from result
            usedLLMCount += result.usedLLMCount;
            cacheHitCount += result.cacheHitCount;
            chunksProcessed++;
          } catch (error) {
            this.logger.error(
              `Failed to process chunk ${chunk.id}: ${error.message}`,
            );
          }
        }

        // Small delay between batches to avoid overwhelming the system
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Emit telemetry event
      await this.telemetryService.track(
        {
          sessionId: `transfer-build-${contentId}`,
          eventType: 'transfer_metadata_built',
          eventVersion: '1.0.0',
          contentId,
          data: {
            contentId,
            chunksProcessed,
            usedLLMCount,
            cacheHitCount,
            scopeType,
          },
        },
        'system', // userId
      );

      this.logger.log(
        `Completed transfer metadata build for content ${contentId}. Processed ${chunksProcessed} chunks.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to build transfer metadata for content ${contentId}: ${error.message}`,
      );
      throw error;
    }
  }
}
