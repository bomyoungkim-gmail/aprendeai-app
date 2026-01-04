import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GraphEventDto, GraphEventType } from './dto/graph-event.dto';

@Injectable()
export class GraphLearnerService {
  private readonly logger = new Logger(GraphLearnerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Main entry point for graph learner events
   */
  async handleGraphEvent(dto: GraphEventDto): Promise<void> {
    this.logger.log(
      `Processing graph event: ${dto.eventType} for user ${dto.userId}, content ${dto.contentId}`,
    );

    // Ensure learner graph exists
    const graph = await this.ensureLearnerGraph(dto.userId, dto.contentId);

    switch (dto.eventType) {
      case GraphEventType.HIGHLIGHT:
        await this.processHighlight(graph.id, dto);
        break;
      case GraphEventType.CORNELL_SYNTHESIS:
        await this.processCornellSynthesis(graph.id, dto);
        break;
      case GraphEventType.MISSION_COMPLETED:
        await this.processMission(graph.id, dto);
        break;
      default:
        this.logger.warn(`Unknown event type: ${dto.eventType}`);
    }

    // Emit telemetry
    await this.emitTelemetry(dto.userId, dto.contentId, graph.id);
  }

  /**
   * Ensure a LEARNER graph exists for this user + content
   */
  private async ensureLearnerGraph(userId: string, contentId: string) {
    let graph = await (this.prisma as any).topic_graphs.findFirst({
      where: {
        type: 'LEARNER',
        scope_type: 'USER',
        scope_id: userId,
        content_id: contentId,
      },
    });

    if (!graph) {
      graph = await (this.prisma as any).topic_graphs.create({
        data: {
          type: 'LEARNER',
          scope_type: 'USER',
          scope_id: userId,
          content_id: contentId,
          title: `Learner Graph - User ${userId}`,
          created_by: userId,
        },
      });
      this.logger.log(`Created new learner graph: ${graph.id}`);
    }

    return graph;
  }

  /**
   * Process HIGHLIGHT events
   * - MAIN_IDEA: Create/strengthen topic node
   * - EVIDENCE: Add evidence to edge or create SUPPORTS edge
   * - DOUBT: Create gap edge (PREREQUISITE/EXPLAINS)
   */
  private async processHighlight(graphId: string, dto: GraphEventDto) {
    const { highlightKind, highlightId, selectedText, anchorJson, pageNumber, timestampMs } =
      dto.eventData;

    if (highlightKind === 'MAIN_IDEA') {
      // Create or strengthen a topic node
      const node = await this.findOrUpsertNode(graphId, selectedText, 'USER');
      this.logger.log(`MAIN_IDEA: Created/updated node ${node.id}`);
    } else if (highlightKind === 'EVIDENCE') {
      // Try to find a recent edge to add evidence to, or create a SUPPORTS edge
      const recentEdge = await this.findRecentEdge(graphId);
      if (recentEdge) {
        await this.createEvidence(recentEdge.id, {
          evidenceType: 'HIGHLIGHT',
          highlightId,
          anchorJson,
          pageNumber,
          timestampMs,
          excerpt: selectedText?.substring(0, 200),
        });
        this.logger.log(`EVIDENCE: Added evidence to edge ${recentEdge.id}`);
      } else {
        // Create a low-confidence SUPPORTS edge
        const fromNode = await this.findOrUpsertNode(graphId, selectedText, 'USER');
        // For simplicity, create a self-referential edge or skip if no context
        this.logger.log(`EVIDENCE: No recent edge found, created node ${fromNode.id}`);
      }
    } else if (highlightKind === 'DOUBT') {
      // Create a gap edge (PREREQUISITE or EXPLAINS) with low confidence
      const node = await this.findOrUpsertNode(graphId, selectedText, 'USER');
      // Create a self-referential PREREQUISITE edge to mark the gap
      const edge = await (this.prisma as any).topic_edges.create({
        data: {
          graph_id: graphId,
          from_node_id: node.id,
          to_node_id: node.id,
          edge_type: 'PREREQUISITE',
          confidence: 0.3,
          source: 'USER',
          rationale_json: { gap: true, sectionRef: dto.sectionRef },
        },
      });
      await this.createEvidence(edge.id, {
        evidenceType: 'HIGHLIGHT',
        highlightId,
        anchorJson,
        pageNumber,
        timestampMs,
        excerpt: selectedText?.substring(0, 200),
      });
      this.logger.log(`DOUBT: Created gap edge ${edge.id}`);
    }
  }

  /**
   * Process CORNELL_SYNTHESIS events
   * Extract 1-3 topics deterministically and create edges
   */
  private async processCornellSynthesis(graphId: string, dto: GraphEventDto) {
    const { summaryText, cornellNoteId, sectionRef } = dto.eventData;

    // Deterministic extraction: simple keyword extraction (can be enhanced)
    const topics = this.extractTopics(summaryText);
    this.logger.log(`CORNELL_SYNTHESIS: Extracted ${topics.length} topics`);

    const nodes = await Promise.all(
      topics.map((topic) => this.findOrUpsertNode(graphId, topic, 'USER')),
    );

    // Create edges between topics in the same section
    for (let i = 0; i < nodes.length - 1; i++) {
      const edge = await (this.prisma as any).topic_edges.create({
        data: {
          graph_id: graphId,
          from_node_id: nodes[i].id,
          to_node_id: nodes[i + 1].id,
          edge_type: 'LINKS_TO',
          confidence: 0.6,
          source: 'USER',
          rationale_json: { sectionRef },
        },
      });
      await this.createEvidence(edge.id, {
        evidenceType: 'CORNELL_SUMMARY',
        cornellNoteId,
        excerpt: summaryText?.substring(0, 200),
      });
      this.logger.log(`CORNELL_SYNTHESIS: Created edge ${edge.id}`);
    }
  }

  /**
   * Process MISSION_COMPLETED events
   * Map mission types to edge types
   */
  private async processMission(graphId: string, dto: GraphEventDto) {
    const { missionType, missionData, transferAttemptId } = dto.eventData;

    switch (missionType) {
      case 'HUGGING':
        await this.processMissionHugging(graphId, missionData, transferAttemptId);
        break;
      case 'BRIDGING':
        await this.processMissionBridging(graphId, missionData, transferAttemptId);
        break;
      case 'ANALOGY':
        await this.processMissionAnalogy(graphId, missionData, transferAttemptId);
        break;
      case 'ICEBERG':
      case 'CONNECTION_CIRCLE':
        await this.processMissionCausal(graphId, missionData, transferAttemptId);
        break;
      default:
        this.logger.warn(`Unknown mission type: ${missionType}`);
    }
  }

  private async processMissionHugging(graphId: string, data: any, transferAttemptId: string) {
    const { topic, domain } = data;
    const topicNode = await this.findOrUpsertNode(graphId, topic, 'USER');
    const domainNode = await this.findOrUpsertNode(graphId, domain, 'USER');

    const edge = await (this.prisma as any).topic_edges.create({
      data: {
        graph_id: graphId,
        from_node_id: topicNode.id,
        to_node_id: domainNode.id,
        edge_type: 'APPLIES_IN',
        confidence: 0.7,
        source: 'USER',
        rationale_json: { missionType: 'HUGGING' },
      },
    });
    await this.createEvidence(edge.id, {
      evidenceType: 'TIMESTAMP',
      excerpt: `Transfer attempt: ${transferAttemptId}`,
    });
    this.logger.log(`HUGGING: Created APPLIES_IN edge ${edge.id}`);
  }

  private async processMissionBridging(graphId: string, data: any, transferAttemptId: string) {
    const { topic, principle } = data;
    const topicNode = await this.findOrUpsertNode(graphId, topic, 'USER');
    const principleNode = await this.findOrUpsertNode(graphId, principle, 'USER');

    const edge = await (this.prisma as any).topic_edges.create({
      data: {
        graph_id: graphId,
        from_node_id: topicNode.id,
        to_node_id: principleNode.id,
        edge_type: 'EXPLAINS',
        confidence: 0.7,
        source: 'USER',
        rationale_json: { missionType: 'BRIDGING' },
      },
    });
    await this.createEvidence(edge.id, {
      evidenceType: 'TIMESTAMP',
      excerpt: `Transfer attempt: ${transferAttemptId}`,
    });
    this.logger.log(`BRIDGING: Created EXPLAINS edge ${edge.id}`);
  }

  private async processMissionAnalogy(graphId: string, data: any, transferAttemptId: string) {
    const { topicA, topicB, mapping } = data;
    const nodeA = await this.findOrUpsertNode(graphId, topicA, 'USER');
    const nodeB = await this.findOrUpsertNode(graphId, topicB, 'USER');

    const edge = await (this.prisma as any).topic_edges.create({
      data: {
        graph_id: graphId,
        from_node_id: nodeA.id,
        to_node_id: nodeB.id,
        edge_type: 'ANALOGY',
        confidence: 0.7,
        source: 'USER',
        rationale_json: { missionType: 'ANALOGY', mapping },
      },
    });
    await this.createEvidence(edge.id, {
      evidenceType: 'TIMESTAMP',
      excerpt: `Transfer attempt: ${transferAttemptId}`,
    });
    this.logger.log(`ANALOGY: Created ANALOGY edge ${edge.id}`);
  }

  private async processMissionCausal(graphId: string, data: any, transferAttemptId: string) {
    const { cause, effect, sign } = data; // sign: '+' or '-'
    const causeNode = await this.findOrUpsertNode(graphId, cause, 'USER');
    const effectNode = await this.findOrUpsertNode(graphId, effect, 'USER');

    const edge = await (this.prisma as any).topic_edges.create({
      data: {
        graph_id: graphId,
        from_node_id: causeNode.id,
        to_node_id: effectNode.id,
        edge_type: 'CAUSES',
        confidence: 0.7,
        source: 'USER',
        rationale_json: { sign, missionType: 'CAUSAL' },
      },
    });
    await this.createEvidence(edge.id, {
      evidenceType: 'TIMESTAMP',
      excerpt: `Transfer attempt: ${transferAttemptId}`,
    });
    this.logger.log(`CAUSAL: Created CAUSES edge ${edge.id} (sign: ${sign})`);
  }

  /**
   * Find or create a topic node (deterministic matching)
   */
  private async findOrUpsertNode(graphId: string, label: string, source: 'USER' | 'DETERMINISTIC') {
    const slug = this.slugify(label);

    let node = await (this.prisma as any).topic_nodes.findFirst({
      where: {
        graph_id: graphId,
        slug,
      },
    });

    if (!node) {
      node = await (this.prisma as any).topic_nodes.create({
        data: {
          graph_id: graphId,
          canonical_label: label,
          slug,
          confidence: source === 'USER' ? 0.5 : 0.7,
          source,
        },
      });
      this.logger.debug(`Created new node: ${node.canonical_label} (${node.id})`);
    }

    return node;
  }

  /**
   * Create evidence for an edge
   */
  private async createEvidence(edgeId: string, data: any) {
    await (this.prisma as any).topic_edge_evidence.create({
      data: {
        edge_id: edgeId,
        evidence_type: data.evidenceType,
        content_id: data.contentId,
        chunk_id: data.chunkId,
        page_number: data.pageNumber,
        timestamp_ms: data.timestampMs,
        anchor_json: data.anchorJson,
        highlight_id: data.highlightId,
        cornell_note_id: data.cornellNoteId,
        excerpt: data.excerpt,
      },
    });
  }

  /**
   * Find the most recent edge in the graph (for EVIDENCE highlights)
   */
  private async findRecentEdge(graphId: string) {
    return (this.prisma as any).topic_edges.findFirst({
      where: { graph_id: graphId },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Extract topics from text (simple keyword extraction)
   */
  private extractTopics(text: string): string[] {
    // Simple extraction: split by sentences, take nouns (simplified)
    // In production, use NLP or Tier2 terms from metadata
    const words = text
      .split(/[.!?]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10)
      .slice(0, 3);
    return words.length > 0 ? words : [text.substring(0, 50)];
  }

  /**
   * Slugify a label for matching
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Emit telemetry event
   */
  private async emitTelemetry(userId: string, contentId: string, graphId: string) {
    const nodeCount = await (this.prisma as any).topic_nodes.count({ where: { graph_id: graphId } });
    const edgeCount = await (this.prisma as any).topic_edges.count({ where: { graph_id: graphId } });
    const evidenceCount = await (this.prisma as any).topic_edge_evidence.count({
      where: { topic_edges: { graph_id: graphId } },
    });

    this.logger.log(
      `Telemetry: graph_learner_updated - Nodes: ${nodeCount}, Edges: ${edgeCount}, Evidence: ${evidenceCount}`,
    );

    // Could emit to telemetry service here
  }
}
