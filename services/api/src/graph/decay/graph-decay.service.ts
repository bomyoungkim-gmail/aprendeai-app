import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DecayPredictorService } from '../ml/decay-predictor.service';

/**
 * GRAPH SCRIPT 19.10: Temporal Decay Service
 * 
 * Implements exponential decay of node confidence over time,
 * similar to SRS (Spaced Repetition System) but for Knowledge Graphs.
 * 
 * Uses Raw SQL for maximum performance when processing millions of nodes.
 */
@Injectable()
export class GraphDecayService {
  private readonly logger = new Logger(GraphDecayService.name);

  // Configuration constants
  private readonly HALF_LIFE_DAYS = parseInt(
    process.env.GRAPH_DECAY_HALF_LIFE || '14',
    10,
  );
  private readonly MIN_CONFIDENCE = parseFloat(
    process.env.GRAPH_MIN_CONFIDENCE || '0.2',
  );
  
  // Feature flag for personalized decay
  // TODO: A/B Testing (future deployment)
  // TODO: Deploy to 10% of users
  // TODO: Track retention metrics
  // TODO: Compare vs baseline
  private readonly USE_PERSONALIZED_DECAY = process.env.GRAPH_USE_PERSONALIZED_DECAY === 'true';

  constructor(
    private readonly prisma: PrismaService,
    private readonly decayPredictor?: DecayPredictorService, // Optional for backward compatibility
  ) {
    // Validate configuration
    if (this.HALF_LIFE_DAYS <= 0) {
      throw new Error('GRAPH_DECAY_HALF_LIFE must be greater than 0');
    }
    if (this.MIN_CONFIDENCE < 0 || this.MIN_CONFIDENCE > 1) {
      throw new Error('GRAPH_MIN_CONFIDENCE must be between 0 and 1');
    }
    
    this.logger.log(
      `GraphDecayService initialized: halfLife=${this.HALF_LIFE_DAYS}d, minConfidence=${this.MIN_CONFIDENCE}`,
    );
  }

  /**
   * Apply decay to all LEARNER graph nodes using efficient bulk SQL update.
   * 
   * Formula: confidence = GREATEST(min, current * (0.5 ^ (days_since / half_life)))
   * 
   * Only updates nodes that:
   * - Belong to LEARNER graphs (not BASELINE)
   * - Haven't been reinforced in last 24 hours
   * - Have confidence above minimum threshold
   * 
   * @returns Number of nodes updated
   */
  async applyBulkDecay(): Promise<number> {
    this.logger.log('Starting bulk decay application...');

    try {
      // PostgreSQL Raw Query with JOIN to filter LEARNER graphs only
      const result = await this.prisma.$executeRaw`
        UPDATE topic_nodes AS n
        SET confidence = GREATEST(
          ${this.MIN_CONFIDENCE}::float, 
          n.confidence * POWER(0.5, 
            EXTRACT(EPOCH FROM (NOW() - n.last_reinforced_at)) / (86400 * ${this.HALF_LIFE_DAYS})
          )
        ),
        updated_at = NOW()
        FROM topic_graphs AS g
        WHERE n.graph_id = g.id
          AND g.type = 'LEARNER'
          AND n.confidence > ${this.MIN_CONFIDENCE}
          AND n.last_reinforced_at IS NOT NULL
          AND n.last_reinforced_at < NOW() - INTERVAL '1 day'
      `;

      this.logger.log(`Bulk decay complete: ${result} nodes updated`);
      return result as number;
    } catch (error) {
      this.logger.error(`Bulk decay failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Reinforce a specific node by updating its confidence and reset decay timer.
   * 
   * Used when user interacts with content related to this node
   * (highlights, missions, reviews, etc.)
   * 
   * @param nodeId - ID of the node to reinforce
   * @param boostAmount - Amount to increase confidence (default: 0.1)
   */
  async reinforceNode(nodeId: string, boostAmount: number = 0.1): Promise<void> {
    try {
      const node = await this.prisma.topic_nodes.findUnique({
        where: { id: nodeId },
        select: { confidence: true },
      });

      if (!node) {
        this.logger.warn(`Node ${nodeId} not found for reinforcement`);
        return;
      }

      const newConfidence = Math.min(node.confidence + boostAmount, 1.0);

      await this.prisma.topic_nodes.update({
        where: { id: nodeId },
        data: {
          confidence: newConfidence,
          last_reinforced_at: new Date(),
        },
      });

      this.logger.debug(
        `Reinforced node ${nodeId}: ${node.confidence.toFixed(2)} → ${newConfidence.toFixed(2)}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to reinforce node ${nodeId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Calculate theoretical decayed confidence for a node.
   * 
   * This is a pure function used for testing and validation.
   * The actual decay is applied via SQL for performance.
   * 
   * @param currentConfidence - Current confidence value
   * @param lastReinforcedAt - Last reinforcement timestamp
   * @returns Decayed confidence value
   */
  calculateDecay(
    currentConfidence: number,
    lastReinforcedAt: Date | null,
  ): number {
    if (!lastReinforcedAt) {
      return currentConfidence;
    }

    const now = new Date();
    const daysSinceReinforcement =
      (now.getTime() - lastReinforcedAt.getTime()) / (1000 * 60 * 60 * 24);

    // Exponential decay: C(t) = C₀ * (1/2)^(t/halfLife)
    const decayFactor = Math.pow(0.5, daysSinceReinforcement / this.HALF_LIFE_DAYS);
    const decayedConfidence = currentConfidence * decayFactor;

    // Apply floor
    return Math.max(decayedConfidence, this.MIN_CONFIDENCE);
  }
}
