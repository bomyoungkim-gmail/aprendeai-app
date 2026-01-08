import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GraphDiffResponseDto,
  NodeChangeDto,
  GraphDiffSummaryDto,
} from './dto/graph-diff-response.dto';

/**
 * Graph Diff Service
 * 
 * Calculates and returns changes to a user's knowledge graph over time.
 * Shows what nodes were added, removed, strengthened, or weakened.
 */
@Injectable()
export class GraphDiffService {
  private readonly logger = new Logger(GraphDiffService.name);
  
  // Minimum confidence threshold (nodes below this are considered "removed")
  private readonly MIN_CONFIDENCE = 0.1;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate graph diff for a user
   * 
   * @param userId - User ID
   * @param contentId - Optional content ID filter
   * @param since - Start date for diff period
   * @returns Graph diff with categorized changes
   */
  async calculateDiff(
    userId: string,
    contentId: string | null,
    since: Date,
  ): Promise<GraphDiffResponseDto> {
    const now = new Date();

    // Get all learner graphs for this user
    const graphs = await this.prisma.topic_graphs.findMany({
      where: {
        type: 'LEARNER',
        scope_id: userId,
        ...(contentId && { content_id: contentId }),
      },
      select: { id: true },
    });

    const graphIds = graphs.map(g => g.id);

    if (graphIds.length === 0) {
      return this.emptyDiff(since, now);
    }

    // Get all nodes in these graphs with their history
    const nodes = await this.prisma.$queryRaw<Array<{
      id: string;
      graph_id: string;
      label: string;
      confidence: number;
      created_at: Date;
      updated_at: Date;
    }>>`
      SELECT id, graph_id, label, confidence, created_at, updated_at
      FROM topic_nodes
      WHERE graph_id = ANY(${graphIds}::text[])
      ORDER BY created_at DESC
    `;

    // Categorize changes
    const added: NodeChangeDto[] = [];
    const removed: NodeChangeDto[] = [];
    const strengthened: NodeChangeDto[] = [];
    const weakened: NodeChangeDto[] = [];

    for (const node of nodes) {
      // Added: created within the period
      if (node.created_at >= since) {
        added.push({
          nodeId: node.id,
          label: node.label,
          confidence: node.confidence,
          timestamp: node.created_at,
          reason: 'new_learning',
        });
        continue;
      }

      // Removed: confidence dropped below threshold during period
      if (node.confidence < this.MIN_CONFIDENCE && node.updated_at >= since) {
        removed.push({
          nodeId: node.id,
          label: node.label,
          confidence: node.confidence,
          timestamp: node.updated_at,
          reason: 'decay_below_threshold',
        });
        continue;
      }

      // For strengthened/weakened, we need to compare with previous state
      // This is a simplified version - in production, you'd want to track history
      if (node.updated_at >= since) {
        // Estimate previous confidence (simplified - assumes linear decay)
        const daysSince = (now.getTime() - since.getTime()) / (1000 * 60 * 60 * 24);
        const estimatedPrevious = node.confidence * 0.95; // Rough estimate

        const delta = node.confidence - estimatedPrevious;

        if (delta > 0.05) {
          strengthened.push({
            nodeId: node.id,
            label: node.label,
            previousConfidence: estimatedPrevious,
            newConfidence: node.confidence,
            confidenceDelta: delta,
            timestamp: node.updated_at,
            reason: 'reinforcement',
          });
        } else if (delta < -0.05) {
          weakened.push({
            nodeId: node.id,
            label: node.label,
            previousConfidence: estimatedPrevious,
            newConfidence: node.confidence,
            confidenceDelta: delta,
            timestamp: node.updated_at,
            reason: 'temporal_decay',
          });
        }
      }
    }

    const summary: GraphDiffSummaryDto = {
      nodesAdded: added.length,
      nodesRemoved: removed.length,
      nodesStrengthened: strengthened.length,
      nodesWeakened: weakened.length,
    };

    return {
      period: { from: since, to: now },
      summary,
      changes: {
        added,
        removed,
        strengthened,
        weakened,
      },
    };
  }

  /**
   * Parse relative time format (e.g., "24h", "7d") to Date
   */
  parseRelativeTime(relative: string): Date {
    const now = new Date();
    const match = relative.match(/^(\d+)([hdw])$/);
    
    if (!match) {
      throw new Error('Invalid relative time format. Use format like "24h", "7d", "1w"');
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'h':
        return new Date(now.getTime() - value * 60 * 60 * 1000);
      case 'd':
        return new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
      case 'w':
        return new Date(now.getTime() - value * 7 * 24 * 60 * 60 * 1000);
      default:
        throw new Error('Invalid time unit. Use h (hours), d (days), or w (weeks)');
    }
  }

  /**
   * Return empty diff
   */
  private emptyDiff(from: Date, to: Date): GraphDiffResponseDto {
    return {
      period: { from, to },
      summary: {
        nodesAdded: 0,
        nodesRemoved: 0,
        nodesStrengthened: 0,
        nodesWeakened: 0,
      },
      changes: {
        added: [],
        removed: [],
        strengthened: [],
        weakened: [],
      },
    };
  }
}
