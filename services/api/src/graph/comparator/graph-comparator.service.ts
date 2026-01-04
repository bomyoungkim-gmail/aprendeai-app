import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface NodeMatch {
  matched: Array<{ baselineNode: any; learnerNode: any }>;
  missingInLearner: any[]; // Gaps
  extraInLearner: any[]; // New discoveries
}

interface EdgeMatch {
  matched: any[];
  baselineOnly: any[];
  learnerOnly: any[];
}

interface ClassifiedDiff {
  discoveries: any[];
  errors: any[];
  gaps: any[];
  undecided: any[];
}

import { GraphCacheService } from '../cache/graph-cache.service';

@Injectable()
export class GraphComparatorService {
  private readonly logger = new Logger(GraphComparatorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly graphCache: GraphCacheService,
  ) {}

  /**
   * Compare Baseline (A) and Learner (B) graphs
   */
  async compareGraphs(
    userId: string,
    contentId: string,
  ): Promise<{ diffId: string; diff_json: any; summary_json: any }> {
    this.logger.log(`Comparing graphs for user: ${userId}, content: ${contentId}`);

    // Find Baseline graph (GLOBAL or INSTITUTION scope)
    const baselineGraph = await (this.prisma as any).topic_graphs.findFirst({
      where: {
        type: 'BASELINE',
        content_id: contentId,
      },
      include: {
        topic_nodes: true,
        topic_edges: {
          include: {
            topic_edge_evidence: true,
          },
        },
      },
    });

    if (!baselineGraph) {
      throw new NotFoundException(`Baseline graph not found for content: ${contentId}`);
    }

    // Find Learner graph
    const learnerGraph = await (this.prisma as any).topic_graphs.findFirst({
      where: {
        type: 'LEARNER',
        scope_type: 'USER',
        scope_id: userId,
        content_id: contentId,
      },
      include: {
        topic_nodes: true,
        topic_edges: {
          include: {
            topic_edge_evidence: true,
          },
        },
      },
    });

    if (!learnerGraph) {
      throw new NotFoundException(`Learner graph not found for user: ${userId}, content: ${contentId}`);
    }

    // Match nodes
    const nodeMatch = this.matchNodes(baselineGraph.topic_nodes, learnerGraph.topic_nodes);

    // Match edges
    const edgeMatch = this.matchEdges(
      baselineGraph.topic_edges,
      learnerGraph.topic_edges,
      nodeMatch,
    );

    // Classify differences
    const classified = await this.classifyDifferences(edgeMatch, nodeMatch, contentId);

    // Build diff_json
    const diff_json = {
      nodes: {
        matched: nodeMatch.matched.length,
        missingInLearner: nodeMatch.missingInLearner.length,
        extraInLearner: nodeMatch.extraInLearner.length,
        details: {
          matched: nodeMatch.matched,
          gaps: nodeMatch.missingInLearner,
          new: nodeMatch.extraInLearner,
        },
      },
      edges: {
        matched: edgeMatch.matched.length,
        baselineOnly: edgeMatch.baselineOnly.length,
        learnerOnly: edgeMatch.learnerOnly.length,
        details: {
          matched: edgeMatch.matched,
          baselineOnly: edgeMatch.baselineOnly,
          learnerOnly: edgeMatch.learnerOnly,
        },
      },
      classified: {
        discoveries: classified.discoveries,
        errors: classified.errors,
        gaps: classified.gaps,
        undecided: classified.undecided,
      },
    };

    // Build summary_json
    const summary_json = {
      topGaps: classified.gaps.slice(0, 10),
      topDiscoveries: classified.discoveries.slice(0, 10),
      counts: {
        totalGaps: classified.gaps.length,
        totalDiscoveries: classified.discoveries.length,
        totalErrors: classified.errors.length,
      },
    };

    // Persist diff
    const diff = await this.upsertDiff(
      userId,
      contentId,
      baselineGraph.id,
      learnerGraph.id,
      diff_json,
      summary_json,
    );

    this.logger.log(`Diff created: ${diff.id}`);

    return {
      diffId: diff.id,
      diff_json,
      summary_json,
    };
  }

  /**
   * Match nodes between baseline and learner
   */
  private matchNodes(baselineNodes: any[], learnerNodes: any[]): NodeMatch {
    const matched: Array<{ baselineNode: any; learnerNode: any }> = [];
    const missingInLearner: any[] = [];
    const extraInLearner: any[] = [];

    const learnerNodeMap = new Map(learnerNodes.map((n) => [n.slug, n]));

    for (const baselineNode of baselineNodes) {
      const learnerNode = learnerNodeMap.get(baselineNode.slug);
      if (learnerNode) {
        matched.push({ baselineNode, learnerNode });
        learnerNodeMap.delete(baselineNode.slug);
      } else {
        missingInLearner.push(baselineNode);
      }
    }

    // Remaining learner nodes are "extra" (new discoveries)
    extraInLearner.push(...Array.from(learnerNodeMap.values()));

    return { matched, missingInLearner, extraInLearner };
  }

  /**
   * Match edges between baseline and learner
   */
  private matchEdges(
    baselineEdges: any[],
    learnerEdges: any[],
    nodeMatch: NodeMatch,
  ): EdgeMatch {
    const matched: any[] = [];
    const baselineOnly: any[] = [];
    const learnerOnly: any[] = [];

    // Create a map of matched node IDs
    const nodeIdMap = new Map<string, string>();
    for (const match of nodeMatch.matched) {
      nodeIdMap.set(match.baselineNode.id, match.learnerNode.id);
    }

    // Create edge key for matching
    const getEdgeKey = (edge: any, nodeMap: Map<string, string>) => {
      const fromId = nodeMap.get(edge.from_node_id) || edge.from_node_id;
      const toId = nodeMap.get(edge.to_node_id) || edge.to_node_id;
      return `${fromId}:${toId}:${edge.edge_type}`;
    };

    const learnerEdgeMap = new Map(
      learnerEdges.map((e) => [getEdgeKey(e, new Map()), e]),
    );

    for (const baselineEdge of baselineEdges) {
      const key = getEdgeKey(baselineEdge, nodeIdMap);
      const learnerEdge = learnerEdgeMap.get(key);

      if (learnerEdge) {
        matched.push({ baselineEdge, learnerEdge });
        learnerEdgeMap.delete(key);
      } else {
        // Check for weak match (LINKS_TO ~= SUPPORTS)
        const weakKey = key.replace(':SUPPORTS', ':LINKS_TO');
        const weakMatch = learnerEdgeMap.get(weakKey);
        if (weakMatch) {
          matched.push({ baselineEdge, learnerEdge: weakMatch, weakMatch: true });
          learnerEdgeMap.delete(weakKey);
        } else {
          baselineOnly.push(baselineEdge);
        }
      }
    }

    // Remaining learner edges
    learnerOnly.push(...Array.from(learnerEdgeMap.values()));

    return { matched, baselineOnly, learnerOnly };
  }



  /**
   * Resolve undecided edges using cache or (simulated) Agent
   */
  private async resolveUndecided(contentId: string, edge: any): Promise<string> {
      const signature = `undecided:${edge.source_slug}->${edge.target_slug}:${edge.edge_type}`;
      
      // 1. Check Cache
      const cached = await this.graphCache.getUndecidedResolution(contentId, signature);
      if (cached) {
          // If cached as VALID, return classification
          return cached.classification; // e.g. 'DISCOVERY_CONFIRMED'
      }

      // 2. Simulate Agent Call (omitted, default to UNDECIDED)
      // In real script 07, we would call the agent here if budget allows.
      // For hardening, we just show the caching hook.
      
      // 3. Set Cache (e.g. if we resolved it)
      // await this.graphCache.setUndecidedResolution(contentId, signature, { classification: 'UNDECIDED', reason: '...' });

      return 'UNDECIDED';
  }

  /**
   * Classify differences (DISCOVERY, ERROR, GAP)
   */
  private async classifyDifferences(edgeMatch: EdgeMatch, nodeMatch: NodeMatch, contentId: string): Promise<ClassifiedDiff> {
    const discoveries: any[] = [];
    const errors: any[] = [];
    const gaps: any[] = [];
    const undecided: any[] = [];

    // Classify learner-only edges
    for (const edge of edgeMatch.learnerOnly) {
      const evidenceCount = edge.topic_edge_evidence?.length || 0;
      const hasStrongEvidence = evidenceCount >= 2;
      const isUserSource = edge.source === 'USER';

      if (hasStrongEvidence && isUserSource && edge.confidence >= 0.6) {
        discoveries.push({
          edge,
          classification: 'DISCOVERY_PLAUSIBLE',
          reason: `Strong evidence (${evidenceCount} items) and user-generated`,
        });
      } else if (evidenceCount < 2 || edge.confidence < 0.5) {
        errors.push({
          edge,
          classification: 'ERROR_LIKELY',
          reason: 'Weak evidence or low confidence',
        });
      } else {
        // Undecided - Try to resolve via cache/agent
        const resolution = await this.resolveUndecided(contentId, edge);
        
        if (resolution !== 'UNDECIDED') {
             if (resolution === 'DISCOVERY_CONFIRMED') {
                 discoveries.push({ edge, classification: resolution, reason: 'Agent confirmed' });
             } else {
                 errors.push({ edge, classification: resolution, reason: 'Agent rejected' });
             }
        } else {
            undecided.push({
            edge,
            classification: 'UNDECIDED',
            reason: 'Requires review',
            });
        }
      }
    }

    // Classify baseline-only edges (gaps)
    for (const edge of edgeMatch.baselineOnly) {
      // Check if edge involves central topics (high degree)
      const fromNode = nodeMatch.matched.find((m) => m.baselineNode.id === edge.from_node_id);
      const toNode = nodeMatch.matched.find((m) => m.baselineNode.id === edge.to_node_id);

      const isCritical = edge.confidence >= 0.8; // High confidence baseline edge

      if (isCritical) {
        gaps.push({
          edge,
          classification: 'GAP_CRITICAL',
          reason: 'Missing critical baseline knowledge',
          fromNode: fromNode?.baselineNode,
          toNode: toNode?.baselineNode,
        });
      } else {
        gaps.push({
          edge,
          classification: 'GAP_MINOR',
          reason: 'Missing baseline knowledge',
        });
      }
    }

    return { discoveries, errors, gaps, undecided };
  }

  /**
   * Upsert diff to database
   */
  private async upsertDiff(
    userId: string,
    contentId: string,
    baselineGraphId: string,
    learnerGraphId: string,
    diff_json: any,
    summary_json: any,
  ) {
    const existing = await (this.prisma as any).graph_diffs.findFirst({
      where: {
        user_id: userId,
        content_id: contentId,
      },
    });

    if (existing) {
      return (this.prisma as any).graph_diffs.update({
        where: { id: existing.id },
        data: {
          baseline_graph_id: baselineGraphId,
          learner_graph_id: learnerGraphId,
          diff_json,
          summary_json,
        },
      });
    }

    return (this.prisma as any).graph_diffs.create({
      data: {
        user_id: userId,
        content_id: contentId,
        baseline_graph_id: baselineGraphId,
        learner_graph_id: learnerGraphId,
        diff_json,
        summary_json,
      },
    });
  }
}
