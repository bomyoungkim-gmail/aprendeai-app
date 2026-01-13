import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

interface CurationItem {
  edgeId: string;
  action: "PROMOTE" | "REJECT" | "NEEDS_REVIEW";
}

interface BatchCurationDto {
  diffId: string;
  items: CurationItem[];
  curatorUserId: string;
}

@Injectable()
export class GraphCuratorService {
  private readonly logger = new Logger(GraphCuratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensure a CURATED graph exists for the given scope
   */
  async ensureCuratedGraph(
    scopeType: string,
    scopeId: string,
    contentId?: string,
  ): Promise<any> {
    const existing = await (this.prisma as any).topic_graphs.findFirst({
      where: {
        type: "CURATED",
        scope_type: scopeType,
        scope_id: scopeId,
        content_id: contentId || null,
      },
    });

    if (existing) {
      return existing;
    }

    return (this.prisma as any).topic_graphs.create({
      data: {
        type: "CURATED",
        scope_type: scopeType,
        scope_id: scopeId,
        content_id: contentId || null,
        title: `Curated Graph - ${scopeType}`,
        created_by: null,
      },
    });
  }

  /**
   * Process curation items (PROMOTE, REJECT, NEEDS_REVIEW)
   */
  async processCurationItems(dto: BatchCurationDto): Promise<{
    promoted: number;
    rejected: number;
    needsReview: number;
  }> {
    this.logger.log(
      `Processing ${dto.items.length} curation items for diff: ${dto.diffId}`,
    );

    let promoted = 0;
    let rejected = 0;
    let needsReview = 0;

    for (const item of dto.items) {
      const edge = await (this.prisma as any).topic_edges.findUnique({
        where: { id: item.edgeId },
        include: {
          topic_graphs: true,
          from_node: true,
          to_node: true,
          topic_edge_evidence: true,
        },
      });

      if (!edge) {
        this.logger.warn(`Edge not found: ${item.edgeId}`);
        continue;
      }

      switch (item.action) {
        case "PROMOTE":
          await this.promoteEdge(edge, dto.curatorUserId);
          promoted++;
          break;
        case "REJECT":
          await this.rejectEdge(edge, dto.curatorUserId);
          rejected++;
          break;
        case "NEEDS_REVIEW":
          await this.flagForReview(edge, dto.curatorUserId);
          needsReview++;
          break;
      }
    }

    this.logger.log(
      `Curation complete: ${promoted} promoted, ${rejected} rejected, ${needsReview} needs review`,
    );

    return { promoted, rejected, needsReview };
  }

  /**
   * Promote edge from Learner to Curated graph
   */
  private async promoteEdge(edge: any, curatorUserId: string): Promise<void> {
    const learnerGraph = edge.topic_graphs;

    // Ensure curated graph exists
    const curatedGraph = await this.ensureCuratedGraph(
      learnerGraph.scope_type,
      learnerGraph.scope_id,
      learnerGraph.content_id,
    );

    // Copy nodes if they don't exist in curated graph
    const fromNode = await this.findOrCopyNode(edge.from_node, curatedGraph.id);
    const toNode = await this.findOrCopyNode(edge.to_node, curatedGraph.id);

    // Check if edge already exists
    const existingEdge = await (this.prisma as any).topic_edges.findFirst({
      where: {
        graph_id: curatedGraph.id,
        from_node_id: fromNode.id,
        to_node_id: toNode.id,
        edge_type: edge.edge_type,
      },
    });

    if (existingEdge) {
      this.logger.debug(
        `Edge already exists in curated graph: ${existingEdge.id}`,
      );
      return;
    }

    // Create edge in curated graph
    const newEdge = await (this.prisma as any).topic_edges.create({
      data: {
        graph_id: curatedGraph.id,
        from_node_id: fromNode.id,
        to_node_id: toNode.id,
        edge_type: edge.edge_type,
        confidence: Math.min(edge.confidence + 0.1, 0.9), // Boost confidence for curation
        source: "CURATED",
        rationale_json: {
          ...edge.rationale_json,
          curatedBy: curatorUserId,
          curatedAt: new Date().toISOString(),
          originalEdgeId: edge.id,
        },
      },
    });

    // Copy evidence
    for (const evidence of edge.topic_edge_evidence) {
      await (this.prisma as any).topic_edge_evidence.create({
        data: {
          edge_id: newEdge.id,
          evidence_type: evidence.evidence_type,
          content_id: evidence.content_id,
          chunk_id: evidence.chunk_id,
          chunk_index: evidence.chunk_index,
          page_number: evidence.page_number,
          timestamp_ms: evidence.timestamp_ms,
          anchor_json: evidence.anchor_json,
          highlight_id: evidence.highlight_id,
          cornell_note_id: evidence.cornell_note_id,
          excerpt: evidence.excerpt,
        },
      });
    }

    this.logger.debug(
      `Promoted edge ${edge.id} to curated graph as ${newEdge.id}`,
    );
  }

  /**
   * Reject edge (flag in learner graph)
   */
  private async rejectEdge(edge: any, curatorUserId: string): Promise<void> {
    await (this.prisma as any).topic_edges.update({
      where: { id: edge.id },
      data: {
        rationale_json: {
          ...edge.rationale_json,
          rejected: true,
          rejectedBy: curatorUserId,
          rejectedAt: new Date().toISOString(),
        },
      },
    });

    this.logger.debug(`Rejected edge: ${edge.id}`);
  }

  /**
   * Flag edge for review
   */
  private async flagForReview(edge: any, curatorUserId: string): Promise<void> {
    await (this.prisma as any).topic_edges.update({
      where: { id: edge.id },
      data: {
        rationale_json: {
          ...edge.rationale_json,
          needsReview: true,
          flaggedBy: curatorUserId,
          flaggedAt: new Date().toISOString(),
        },
      },
    });

    this.logger.debug(`Flagged edge for review: ${edge.id}`);
  }

  /**
   * Find or copy node to curated graph
   */
  private async findOrCopyNode(
    node: any,
    curatedGraphId: string,
  ): Promise<any> {
    const existing = await (this.prisma as any).topic_nodes.findFirst({
      where: {
        graph_id: curatedGraphId,
        slug: node.slug,
      },
    });

    if (existing) {
      return existing;
    }

    return (this.prisma as any).topic_nodes.create({
      data: {
        graph_id: curatedGraphId,
        canonical_label: node.canonical_label,
        slug: node.slug,
        confidence: node.confidence,
        source: "CURATED",
      },
    });
  }

  /**
   * Cast vote on edge and recalculate confidence
   */
  async castVote(
    userId: string,
    edgeId: string,
    vote: number,
    comment?: string,
  ): Promise<void> {
    // Upsert vote
    await (this.prisma as any).topic_edge_votes.upsert({
      where: {
        edge_id_user_id: {
          edge_id: edgeId,
          user_id: userId,
        },
      },
      create: {
        edge_id: edgeId,
        user_id: userId,
        vote,
        comment,
      },
      update: {
        vote,
        comment,
      },
    });

    // Recalculate confidence
    await this.recalculateConfidence(edgeId);

    this.logger.debug(`Vote cast on edge ${edgeId} by user ${userId}: ${vote}`);
  }

  /**
   * Recalculate edge confidence based on votes
   */
  private async recalculateConfidence(edgeId: string): Promise<void> {
    const edge = await (this.prisma as any).topic_edges.findUnique({
      where: { id: edgeId },
      include: {
        topic_edge_votes: true,
      },
    });

    if (!edge) {
      return;
    }

    const upvotes = edge.topic_edge_votes.filter((v) => v.vote > 0).length;
    const downvotes = edge.topic_edge_votes.filter((v) => v.vote < 0).length;

    const alpha = 0.05;
    const baseConfidence = 0.7; // Default base for curated edges
    const newConfidence = Math.max(
      0.1,
      Math.min(1.0, baseConfidence + alpha * (upvotes - downvotes)),
    );

    await (this.prisma as any).topic_edges.update({
      where: { id: edgeId },
      data: { confidence: newConfidence },
    });

    this.logger.debug(
      `Updated confidence for edge ${edgeId}: ${newConfidence}`,
    );
  }
}
