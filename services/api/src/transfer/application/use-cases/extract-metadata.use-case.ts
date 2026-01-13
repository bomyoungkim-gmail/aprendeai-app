import { Injectable, Inject, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { RedisService } from "../../../common/redis/redis.service";
import {
  ITransferMetadataRepository,
  TransferMetadataEntity,
} from "../../domain/transfer-metadata.repository.interface";
import { ExtractMetadataResult } from "../types/transfer-metadata.types";
import { AiServiceClient } from "../../../ai-service/ai-service.client";
import { TelemetryService } from "../../../telemetry/telemetry.service";
import { v4 as uuidv4 } from "uuid";

interface ExtractionResult {
  conceptJson: any;
  tier2Json: string[];
  analogiesJson?: string[];
  domainsJson?: string[];
}

@Injectable()
export class ExtractMetadataUseCase {
  private readonly logger = new Logger(ExtractMetadataUseCase.name);

  constructor(
    @Inject(ITransferMetadataRepository)
    private readonly repository: ITransferMetadataRepository,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly aiService: AiServiceClient,
    private readonly telemetryService: TelemetryService,
  ) {}

  async execute(params: {
    contentId: string;
    chunkId?: string;
    chunkIndex?: number;
    pageNumber?: number;
    scopeType: string;
    familyId?: string;
    institutionId?: string;
    educationLevel?: string;
    language?: string;
    userId?: string;
    fallbackConfig?: {
      allowLLM: boolean;
      caps?: { maxTokens: number; modelTier: string };
      phase?: "DURING" | "POST";
    };
  }): Promise<ExtractMetadataResult> {
    // Generate cache key
    const cacheKey = this.generateCacheKey(params);

    // Try cache first
    const cached = await this.redisService.get<ExtractionResult>(cacheKey);
    if (cached) {
      return {
        metadata: {
          concept: cached.conceptJson,
          tier2: cached.tier2Json,
          analogies: cached.analogiesJson || [],
          domains: cached.domainsJson || [],
        },
        usedLLMCount: 0,
        cacheHitCount: 1,
        channel: "CACHED_LLM",
      };
    }

    // Check if metadata already exists in DB
    const existing = await this.repository.findByContentAndChunk({
      contentId: params.contentId,
      chunkId: params.chunkId,
      chunkIndex: params.chunkIndex,
      pageNumber: params.pageNumber,
      scopeType: params.scopeType,
    });

    if (existing) {
      // Cache the existing result for 7 days
      await this.redisService.set(
        cacheKey,
        {
          conceptJson: existing.conceptJson,
          tier2Json: existing.tier2Json,
          analogiesJson: existing.analogiesJson,
          domainsJson: existing.domainsJson,
        },
        604800, // 7 days TTL
      );
      return {
        metadata: {
          concept: existing.conceptJson,
          tier2: existing.tier2Json,
          analogies: existing.analogiesJson,
          domains: existing.domainsJson,
        },
        usedLLMCount: 0,
        cacheHitCount: 0,
        channel: "DETERMINISTIC",
      };
    }

    // Extract metadata using deterministic strategy
    const extracted = await this.extractDeterministic(params);

    // Check if LLM fallback is needed and allowed
    const needsLLM =
      (extracted.analogiesJson?.length === 0 ||
        extracted.domainsJson?.length === 0) &&
      params.fallbackConfig?.allowLLM;

    let usedLLMCount = 0;
    let llmCacheHit = false;

    if (needsLLM) {
      try {
        // Try LLM cache first
        const llmCacheKey = `${cacheKey}:llm`;
        const cachedLLM = await this.redisService.get<{
          analogies: any[];
          domains: string[];
        }>(llmCacheKey);

        if (cachedLLM) {
          this.logger.debug(`LLM cache hit for ${params.contentId}`);
          extracted.analogiesJson = cachedLLM.analogies;
          extracted.domainsJson = cachedLLM.domains;
          llmCacheHit = true;

          this.telemetryService.track(
            {
              eventType: "transfer_llm_fallback_triggered",
              eventVersion: "1.0.0",
              contentId: params.contentId,
              sessionId: null,
              data: {
                sectionRef: {
                  chunkId: params.chunkId,
                  chunkIndex: params.chunkIndex,
                },
                phase: params.fallbackConfig?.phase || "POST",
                cacheHit: true,
              },
            },
            params.userId || "system",
          );
        } else {
          // Call LLM
          this.logger.debug(
            `Calling LLM for metadata extraction: ${params.contentId}`,
          );
          const llmResult = await this.callLLMFallback(params, extracted);

          extracted.analogiesJson = llmResult.analogies;
          extracted.domainsJson = llmResult.domains;
          usedLLMCount = 1;

          // Cache LLM result
          await this.redisService.set(
            llmCacheKey,
            { analogies: llmResult.analogies, domains: llmResult.domains },
            604800, // 7 days
          );

          this.telemetryService.track(
            {
              eventType: "transfer_llm_fallback_triggered",
              eventVersion: "1.0.0",
              contentId: params.contentId,
              sessionId: null,
              data: {
                sectionRef: {
                  chunkId: params.chunkId,
                  chunkIndex: params.chunkIndex,
                },
                phase: params.fallbackConfig?.phase || "POST",
                cacheHit: false,
                tokensUsed: llmResult.tokensUsed,
              },
            },
            params.userId || "system",
          );
        }
      } catch (error) {
        this.logger.error(`LLM fallback failed: ${error.message}`);
        // Continue with deterministic results
      }
    } else if (
      (extracted.analogiesJson?.length === 0 ||
        extracted.domainsJson?.length === 0) &&
      !params.fallbackConfig?.allowLLM
    ) {
      // Telemetry for denied fallback
      this.telemetryService.track(
        {
          eventType: "transfer_llm_fallback_denied",
          eventVersion: "1.0.0",
          contentId: params.contentId,
          sessionId: null,
          data: {
            reason: params.fallbackConfig ? "policy/budget" : "no_config",
          },
        },
        params.userId || "system",
      );
    }

    // Cache the extraction result for 7 days
    await this.redisService.set(cacheKey, extracted, 604800); // 7 days TTL

    // Create new metadata entity
    const metadata: TransferMetadataEntity = {
      id: uuidv4(),
      contentId: params.contentId,
      chunkId: params.chunkId,
      chunkIndex: params.chunkIndex,
      pageNumber: params.pageNumber,
      anchorJson: null,
      version: "1.0.0",
      conceptJson: extracted.conceptJson,
      tier2Json: extracted.tier2Json,
      analogiesJson: extracted.analogiesJson || [],
      domainsJson: extracted.domainsJson || [],
      toolsJson: {},
      createdBy: null,
      scopeType: params.scopeType,
      familyId: params.familyId,
      institutionId: params.institutionId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.repository.upsert(metadata);

    return {
      metadata: {
        concept: extracted.conceptJson,
        tier2: extracted.tier2Json,
        analogies: extracted.analogiesJson || [],
        domains: extracted.domainsJson || [],
      },
      usedLLMCount,
      cacheHitCount: llmCacheHit ? 1 : 0,
      channel:
        usedLLMCount > 0 ? "LLM" : llmCacheHit ? "CACHED_LLM" : "DETERMINISTIC",
    };
  }

  private generateCacheKey(params: {
    contentId: string;
    chunkId?: string;
    chunkIndex?: number;
    pageNumber?: number;
    scopeType: string;
    educationLevel?: string;
    language?: string;
  }): string {
    const chunkIdentifier =
      params.chunkId ||
      `idx_${params.chunkIndex}` ||
      `page_${params.pageNumber}` ||
      "default";

    const level = params.educationLevel || "default";
    const lang = params.language || "pt";
    const version = "1.0.0";

    return `transfer:metadata:${params.contentId}:${chunkIdentifier}:${level}:${lang}:${params.scopeType}:${version}`;
  }

  private async extractDeterministic(params: {
    contentId: string;
    chunkId?: string;
    chunkIndex?: number;
    pageNumber?: number;
  }): Promise<ExtractionResult> {
    const result: ExtractionResult = {
      conceptJson: {},
      tier2Json: [],
      analogiesJson: [],
      domainsJson: [],
    };

    // Step 1: Extract Tier 2 vocabulary from glossaries
    result.tier2Json = await this.extractTier2FromGlossaries(
      params.contentId,
      params.chunkId,
    );

    // Step 2: Extract concept/principle heuristically
    result.conceptJson = await this.extractConceptHeuristic(params);

    // Step 3: Extract analogies and domains heuristically
    const { analogies, domains } = await this.extractAnalogiesAndDomains(
      params.contentId,
      params.chunkId,
    );
    result.analogiesJson = analogies;
    result.domainsJson = domains;

    return result;
  }

  private async extractTier2FromGlossaries(
    contentId: string,
    chunkId?: string,
  ): Promise<string[]> {
    // Try content_versions.vocabulary_glossary
    const contentVersion = await this.prisma.content_versions.findFirst({
      where: { content_id: contentId },
      select: { vocabulary_glossary: true },
    });

    if (contentVersion?.vocabulary_glossary) {
      const glossary = contentVersion.vocabulary_glossary as any;
      if (Array.isArray(glossary)) {
        return glossary
          .map((item) => item.term || item.word || item)
          .slice(0, 20);
      }
    }

    // Try learning_assets.glossary_json
    const learningAsset = await this.prisma.learning_assets.findFirst({
      where: { content_id: contentId },
      select: { glossary_json: true },
    });

    if (learningAsset?.glossary_json) {
      const glossary = learningAsset.glossary_json as any;
      if (Array.isArray(glossary)) {
        return glossary
          .map((item) => item.term || item.word || item)
          .slice(0, 20);
      }
    }

    return [];
  }

  private async extractConceptHeuristic(params: {
    contentId: string;
    chunkId?: string;
    chunkIndex?: number;
    pageNumber?: number;
  }): Promise<any> {
    // Try text-based extraction
    if (params.chunkId) {
      const chunk = await this.prisma.content_chunks.findUnique({
        where: { id: params.chunkId },
        select: { text: true },
      });

      if (chunk?.text) {
        return this.extractConceptFromText(chunk.text);
      }
    }

    // Fallback: Try annotation-based extraction (for PDFs without text)
    if (params.pageNumber !== undefined) {
      return await this.extractConceptFromAnnotations(
        params.contentId,
        params.pageNumber,
      );
    }

    return { principle: "", keywords: [] };
  }

  private extractConceptFromText(text: string): any {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    // Use first sentence as principle (topic sentence heuristic)
    const principle = sentences[0]?.trim() || "";

    // Extract capitalized terms as keywords
    const keywords = Array.from(
      new Set(text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []),
    ).slice(0, 5);

    return { principle, keywords };
  }

  private async extractConceptFromAnnotations(
    contentId: string,
    pageNumber: number,
  ): Promise<any> {
    // Query highlights with MAIN_IDEA, EVIDENCE, SYNTHESIS tags
    const highlights = await this.prisma.highlights.findMany({
      where: {
        content_id: contentId,
        page_number: pageNumber,
        kind: "TEXT",
        status: "ACTIVE",
      },
      select: {
        comment_text: true,
        tags_json: true,
      },
      take: 10,
    });

    const mainIdeas = highlights
      .filter((h) => {
        const tags = (h.tags_json as string[]) || [];
        return tags.includes("MAIN_IDEA");
      })
      .map((h) => h.comment_text)
      .filter(Boolean);

    // Query Cornell notes
    const cornellNotes = await this.prisma.cornell_notes.findMany({
      where: { content_id: contentId },
      select: { cues_json: true, summary_text: true },
      take: 1,
    });

    const cues = cornellNotes[0]?.cues_json || [];
    const summary = cornellNotes[0]?.summary_text || "";

    return {
      principle: mainIdeas[0] || summary || "",
      keywords: Array.isArray(cues) ? cues.slice(0, 5) : [],
    };
  }

  /**
   * Extract analogies and domains using simple heuristics
   * - Analogies: Look for comparison patterns in text or tags
   * - Domains: Extract from content tags, pillars, or subject metadata
   */
  private async extractAnalogiesAndDomains(
    contentId: string,
    chunkId?: string,
  ): Promise<{ analogies: string[]; domains: string[] }> {
    const analogies: string[] = [];
    const domains: string[] = [];

    // Try to get content metadata for domains
    const content = await this.prisma.contents.findUnique({
      where: { id: contentId },
      select: {
        metadata: true,
        type: true,
      },
    });

    if (content) {
      // Extract domains from metadata if available
      const metadata = content.metadata as any;
      if (metadata) {
        if (metadata.subject) {
          domains.push(metadata.subject);
        }
        if (metadata.pillar) {
          domains.push(metadata.pillar);
        }
        if (Array.isArray(metadata.tags)) {
          domains.push(...metadata.tags.slice(0, 3));
        }
      }
      // Use content type as a domain
      if (content.type) {
        domains.push(content.type);
      }
    }

    // Try to extract analogies from chunk text if available
    if (chunkId) {
      const chunk = await this.prisma.content_chunks.findUnique({
        where: { id: chunkId },
        select: { text: true },
      });

      if (chunk?.text) {
        // Simple pattern matching for analogy indicators
        const analogyPatterns = [
          /like\s+(.+?)[.,]/gi,
          /similar to\s+(.+?)[.,]/gi,
          /as\s+(.+?)\s+as/gi,
        ];

        for (const pattern of analogyPatterns) {
          const matches = chunk.text.match(pattern);
          if (matches && matches.length > 0) {
            analogies.push(...matches.slice(0, 2));
          }
        }
      }
    }

    return {
      analogies: [...new Set(analogies)].slice(0, 3),
      domains: [...new Set(domains)].slice(0, 3),
    };
  }

  /**
   * Call LLM for metadata extraction fallback
   *
   * PATCH 04v2: Real LLM integration
   */
  private async callLLMFallback(
    params: {
      contentId: string;
      chunkId?: string;
      chunkIndex?: number;
      pageNumber?: number;
      educationLevel?: string;
      language?: string;
      fallbackConfig?: {
        caps?: { maxTokens: number; modelTier: string };
      };
    },
    extracted: ExtractionResult,
  ): Promise<{ analogies: any[]; domains: string[]; tokensUsed?: number }> {
    // Get up to 2 evidence items from Cornell notes
    const evidence = await this.getEvidenceForLLM(
      params.contentId,
      params.chunkId,
    );

    const prompt = {
      contentId: params.contentId,
      sectionRef: {
        chunkId: params.chunkId,
        page: params.pageNumber,
        chunkIndex: params.chunkIndex,
      },
      mode: "transfer_metadata",
      learner: {
        level: params.educationLevel || "SUPERIOR",
        language: params.language || "PT_BR",
      },
      seed: {
        concept: extracted.conceptJson,
        tier2: extracted.tier2Json,
        evidence,
      },
      output: {
        need: ["analogies", "domains"] as Array<"analogies" | "domains">,
        maxItems: {
          analogies: 2,
          domains: 3,
        },
      },
      caps: params.fallbackConfig?.caps || {
        maxTokens: 1000,
        modelTier: "flash",
      },
    };

    const result = await this.aiService.extractTransferMetadata(prompt);

    return {
      analogies: result.analogies || [],
      domains: result.domains || [],
      tokensUsed: result.tokensUsed,
    };
  }

  /**
   * Get evidence from Cornell notes for LLM context
   */
  private async getEvidenceForLLM(
    contentId: string,
    chunkId?: string,
  ): Promise<Array<{ anchor_json: any; note_excerpt: string }>> {
    const highlights = await this.prisma.highlights.findMany({
      where: {
        content_id: contentId,
        ...(chunkId && { chunk_id: chunkId }),
      },
      select: {
        anchor_json: true,
        comment_text: true,
        tags_json: true,
      },
      take: 10,
    });

    // Filter for MAIN_IDEA or EVIDENCE tags
    const filtered = highlights.filter((h) => {
      const tags = (h.tags_json as string[]) || [];
      return tags.includes("MAIN_IDEA") || tags.includes("EVIDENCE");
    });

    return filtered.slice(0, 2).map((h) => ({
      anchor_json: h.anchor_json,
      note_excerpt: h.comment_text || "",
    }));
  }
}
