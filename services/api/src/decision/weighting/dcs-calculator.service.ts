import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export interface DcsComponents {
  docSupport: number; // 0..1
  coverage: number; // 0..1
  matchQuality: number; // 0..1
  evidenceStrength: number; // 0..1
  stability: number; // 0..1
  curation: number; // 0..1
}

export interface SectionRef {
  chunkId?: string;
  chunkIndex?: number;
  pageNumber?: number;
  timestampMs?: number;
}

export interface DcsResult {
  dcs: number;
  w_det: number;
  w_llm: number;
  components: DcsComponents;
}

/**
 * DCS Calculator Service
 *
 * Computes Determinism Confidence Score (DCS) based on 6 observable signals:
 * - docSupport: Document structure quality
 * - coverage: Topic registry match ratio
 * - matchQuality: Ambiguity in matches
 * - evidenceStrength: Proportion of strong edges
 * - stability: Edge recurrence across sessions
 * - curation: Teacher/Moderator validation
 *
 * Formula: DCS = 0.15*doc + 0.20*cov + 0.20*match + 0.20*evid + 0.15*stab + 0.10*cur
 */
@Injectable()
export class DcsCalculatorService {
  private readonly logger = new Logger(DcsCalculatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate DCS for a given content/section
   */
  async calculateDcs(
    contentId: string,
    scopeType: string,
    scopeId: string | null,
    sectionRef?: SectionRef,
  ): Promise<DcsResult> {
    this.logger.log(
      `Calculating DCS for content: ${contentId}, section: ${JSON.stringify(sectionRef)}`,
    );

    const components = await this.computeComponents(
      contentId,
      scopeType,
      scopeId,
      sectionRef,
    );

    // Formula: 15% doc + 20% cov + 20% match + 20% evid + 15% stab + 10% cur
    const dcs = Math.min(
      0.15 * components.docSupport +
        0.2 * components.coverage +
        0.2 * components.matchQuality +
        0.2 * components.evidenceStrength +
        0.15 * components.stability +
        0.1 * components.curation,
      1.0,
    );

    const w_det = Math.max(0, Math.min(dcs, 1.0));
    const w_llm = 1.0 - w_det;

    return { dcs, w_det, w_llm, components };
  }

  async persistScore(
    contentId: string,
    scopeType: string,
    scopeId: string | null,
    result: DcsResult,
    sectionRef?: SectionRef,
  ): Promise<void> {
    // Simplified upsert - use findFirst + create/update pattern
    const existing = await (this.prisma as any).determinism_scores.findFirst({
      where: {
        scope_type: scopeType,
        scope_id: scopeId || null,
        content_id: contentId,
        chunk_id: sectionRef?.chunkId || null,
        page_number: sectionRef?.pageNumber || null,
      },
    });

    const data = {
      scope_type: scopeType,
      scope_id: scopeId,
      content_id: contentId,
      chunk_id: sectionRef?.chunkId,
      chunk_index: sectionRef?.chunkIndex,
      page_number: sectionRef?.pageNumber,
      timestamp_ms: sectionRef?.timestampMs,
      dcs: result.dcs,
      w_det: result.w_det,
      w_llm: result.w_llm,
      components_json: result.components as any,
    };

    if (existing) {
      await (this.prisma as any).determinism_scores.update({
        where: { id: existing.id },
        data: {
          ...data,
          updated_at: new Date(),
        },
      });
    } else {
      await (this.prisma as any).determinism_scores.create({ data });
    }

    this.logger.log(
      `Persisted DCS: ${result.dcs.toFixed(3)} (w_det=${result.w_det.toFixed(3)}, w_llm=${result.w_llm.toFixed(3)})`,
    );
  }

  /**
   * Compute individual DCS components
   */
  private async computeComponents(
    contentId: string,
    scopeType: string,
    scopeId: string | null,
    sectionRef?: SectionRef,
  ): Promise<DcsComponents> {
    // Parallel computation of all components
    const [
      docSupport,
      coverage,
      matchQuality,
      evidenceStrength,
      stability,
      curation,
    ] = await Promise.all([
      this.computeDocSupport(contentId),
      this.computeCoverage(contentId, scopeType, scopeId, sectionRef),
      this.computeMatchQuality(contentId, scopeType, scopeId, sectionRef),
      this.computeEvidenceStrength(contentId, scopeType, scopeId),
      this.computeStability(contentId, scopeType, scopeId),
      this.computeCuration(contentId, scopeType, scopeId),
    ]);

    return {
      docSupport,
      coverage,
      matchQuality,
      evidenceStrength,
      stability,
      curation,
    };
  }

  private async computeDocSupport(contentId: string): Promise<number> {
    const content = await this.prisma.contents.findUnique({
      where: { id: contentId },
      select: { metadata: true },
    });

    if (!content) return 0.2;

    const metadata = content.metadata as any;
    const hasToc =
      metadata?.toc && Array.isArray(metadata.toc) && metadata.toc.length > 0;
    const hasText = metadata?.hasText === true;

    if (hasToc && hasText) return 1.0;
    if (hasToc || hasText) return 0.5;
    return 0.2;
  }

  /**
   * Coverage: % units with >= K topics matched vs registry
   */
  private async computeCoverage(
    contentId: string,
    scopeType: string,
    scopeId: string | null,
    sectionRef?: SectionRef,
  ): Promise<number> {
    // Count total chunks/pages for this content
    const totalUnits = await this.prisma.content_chunks.count({
      where: { content_id: contentId },
    });

    if (totalUnits === 0) return 0.0;

    // Count units with at least K matched topics from registry
    const K = 2; // Minimum topics per unit

    // This is a simplified implementation
    // In production, you'd query topic_nodes and match against topic_registry
    const matchedUnits = await this.prisma.content_chunks.count({
      where: {
        content_id: contentId,
        // Placeholder: would need to join with topic_nodes and topic_registry
      },
    });

    return Math.min(matchedUnits / totalUnits, 1.0);
  }

  /**
   * Match Quality: 1 - (ambiguous / total)
   */
  private async computeMatchQuality(
    contentId: string,
    scopeType: string,
    scopeId: string | null,
    sectionRef?: SectionRef,
  ): Promise<number> {
    // Simplified: Check for ambiguous matches in topic_registry
    // Ambiguous = term matches multiple registry nodes with similar weight

    // Placeholder implementation
    return 0.8; // Default to good quality
  }

  /**
   * Evidence Strength: Proportion of edges with >= 2 evidence
   */
  private async computeEvidenceStrength(
    contentId: string,
    scopeType: string,
    scopeId: string | null,
  ): Promise<number> {
    const graphs = await (this.prisma as any).topic_graphs.findMany({
      where: {
        content_id: contentId,
        scope_type: scopeType,
        scope_id: scopeId,
        type: { in: ["LEARNER", "CURATED"] },
      },
      include: {
        topic_edges: {
          include: {
            topic_edge_evidence: true,
          },
        },
      },
    });

    let totalEdges = 0;
    let strongEdges = 0;

    for (const graph of graphs) {
      for (const edge of graph.topic_edges) {
        totalEdges++;
        if (edge.topic_edge_evidence.length >= 2) {
          strongEdges++;
        }
      }
    }

    return totalEdges > 0 ? strongEdges / totalEdges : 0.0;
  }

  /**
   * Stability: Edges appearing in >= 2 sessions / total
   */
  private async computeStability(
    contentId: string,
    scopeType: string,
    scopeId: string | null,
  ): Promise<number> {
    // Count edges that appear in multiple graphs (sessions)
    const graphs = await (this.prisma as any).topic_graphs.findMany({
      where: {
        content_id: contentId,
        scope_type: scopeType,
        scope_id: scopeId,
      },
      include: {
        topic_edges: true,
      },
    });

    const edgeOccurrences = new Map<string, number>();

    for (const graph of graphs) {
      for (const edge of graph.topic_edges) {
        const key = `${edge.from_node_id}-${edge.to_node_id}-${edge.edge_type}`;
        edgeOccurrences.set(key, (edgeOccurrences.get(key) || 0) + 1);
      }
    }

    const totalEdges = edgeOccurrences.size;
    const stableEdges = Array.from(edgeOccurrences.values()).filter(
      (count) => count >= 2,
    ).length;

    return totalEdges > 0 ? stableEdges / totalEdges : 0.0;
  }

  /**
   * Curation: 1.0 (Teacher), 0.5 (Group), 0.0 (None)
   */
  private async computeCuration(
    contentId: string,
    scopeType: string,
    scopeId: string | null,
  ): Promise<number> {
    // Check for teacher/moderator votes or curated graph presence
    const curatedGraph = await (this.prisma as any).topic_graphs.findFirst({
      where: {
        content_id: contentId,
        scope_type: scopeType,
        scope_id: scopeId,
        type: "CURATED",
      },
    });

    if (curatedGraph) return 1.0;

    // Simplified: Return 0 if no curated graph
    // TODO: Implement vote-based curation scoring when schema is confirmed
    return 0.0;
  }
}
