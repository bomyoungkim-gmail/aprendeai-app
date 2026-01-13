import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export interface RecommendationItem {
  contentId: string;
  title: string;
  reason: string;
  score: number;
}

export interface RecommendationResult {
  recommendations: RecommendationItem[];
  strategies: {
    gapRecovery: number;
    prerequisites: number;
  };
}

@Injectable()
export class GraphRecommendationService {
  private readonly logger = new Logger(GraphRecommendationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate content recommendations for a user.
   *
   * Strategy 1: Critical Gaps - Find contents covering missing topics
   * Strategy 2: Prerequisites - Find contents covering prerequisite topics
   *
   * @param userId - User ID
   * @param contextContentId - Optional content ID for context
   * @returns Top 5 recommendations
   */
  async getRecommendations(
    userId: string,
    contextContentId?: string,
  ): Promise<RecommendationResult> {
    this.logger.log(`Generating recommendations for user ${userId}`);

    const recommendations: RecommendationItem[] = [];
    const strategies = { gapRecovery: 0, prerequisites: 0 };

    // Strategy 1: Gap Recovery
    const gapRecs = await this.getGapRecoveryRecommendations(
      userId,
      contextContentId,
    );
    recommendations.push(...gapRecs);
    strategies.gapRecovery = gapRecs.length;

    // Strategy 2: Prerequisites
    const prereqRecs = await this.getPrerequisiteRecommendations(
      userId,
      contextContentId,
    );
    recommendations.push(...prereqRecs);
    strategies.prerequisites = prereqRecs.length;

    // Deduplicate and sort by score
    const uniqueRecs = this.deduplicateAndSort(recommendations);

    // Return top 5
    const top5 = uniqueRecs.slice(0, 5);

    this.logger.log(
      `Generated ${top5.length} recommendations (${strategies.gapRecovery} gap, ${strategies.prerequisites} prereq)`,
    );

    return {
      recommendations: top5,
      strategies,
    };
  }

  /**
   * Strategy 1: Find contents that cover topics missing in user's graph.
   */
  private async getGapRecoveryRecommendations(
    userId: string,
    contextContentId?: string,
  ): Promise<RecommendationItem[]> {
    // Find user's latest diff
    const userDiff = await (this.prisma as any).graph_diffs.findFirst({
      where: {
        user_id: userId,
        ...(contextContentId && { content_id: contextContentId }),
      },
      orderBy: { created_at: "desc" },
    });

    if (!userDiff) {
      this.logger.debug("No diff found for user, skipping gap recovery");
      return [];
    }

    const diffData = userDiff.diff_json as any;
    const missingNodes = diffData?.nodes?.missing || [];

    if (missingNodes.length === 0) {
      this.logger.debug("No missing nodes in diff");
      return [];
    }

    this.logger.debug(`Found ${missingNodes.length} missing nodes`);

    // Find contents that cover these missing topics
    const recommendations: RecommendationItem[] = [];

    for (const missingNode of missingNodes.slice(0, 10)) {
      // Limit search
      const slug = missingNode.slug || missingNode.label;

      // Find baseline graphs that contain this node
      const coveringContents = await (this.prisma as any).topic_nodes.findMany({
        where: {
          slug,
          topic_graphs: {
            type: "BASELINE",
            content_id: { not: contextContentId }, // Exclude current content
          },
        },
        include: {
          topic_graphs: {
            include: {
              contents: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        take: 3,
      });

      for (const node of coveringContents) {
        const content = node.topic_graphs?.contents;
        if (content) {
          recommendations.push({
            contentId: content.id,
            title: content.title,
            reason: `Covers missing topic: ${missingNode.label}`,
            score: 10, // Gap recovery is high priority
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Strategy 2: Find contents covering prerequisite topics.
   */
  private async getPrerequisiteRecommendations(
    userId: string,
    contextContentId?: string,
  ): Promise<RecommendationItem[]> {
    // Find user's weak topics (from learner graph or diff)
    const userGraph = await (this.prisma as any).topic_graphs.findFirst({
      where: {
        type: "LEARNER",
        scope_type: "USER",
        scope_id: userId,
        ...(contextContentId && { content_id: contextContentId }),
      },
      include: {
        topic_nodes: false, // Don't fetch nodes here, we fetch them separately below
      },
    });

    if (!userGraph) {
      this.logger.debug("No learner graph found");
      return [];
    }

    // Identify weak nodes (low evidence count) using edges
    // Since we cannot include topic_evidences directly on nodes (it's on edges), we fetch edges first.
    // Or we use a raw query, but let's try to do it with relation traversal.
    // We need nodes where total evidence on connected edges is low.

    // Optimized: Fetch nodes with their edges and evidence counts
    const userNodes = await (this.prisma as any).topic_nodes.findMany({
      where: {
        graph_id: userGraph.id,
      },
      include: {
        edges_to: {
          include: { topic_edge_evidence: true },
        },
        edges_from: {
          include: { topic_edge_evidence: true },
        },
      },
      take: 20, // Optimization: only check top X nodes? Or filter in memory.
    });

    const weakNodes = userNodes.filter((node) => {
      const evidenceCount =
        node.edges_to.reduce(
          (acc, edge) => acc + edge.topic_edge_evidence.length,
          0,
        ) +
        node.edges_from.reduce(
          (acc, edge) => acc + edge.topic_edge_evidence.length,
          0,
        );
      return evidenceCount < 2;
    });

    this.logger.debug(`Found ${weakNodes.length} weak nodes`);

    const recommendations: RecommendationItem[] = [];

    for (const weakNode of weakNodes.slice(0, 5)) {
      // Find prerequisites from edge_priors (Global scope)
      const prerequisites = await (this.prisma as any).edge_priors.findMany({
        where: {
          to_slug: weakNode.slug,
          edge_type: "PREREQUISITE",
          scope_type: "GLOBAL",
          status: "ACTIVE",
        },
        take: 2,
      });

      for (const prereq of prerequisites) {
        // Find contents covering the prerequisite topic
        const coveringContents = await (
          this.prisma as any
        ).topic_nodes.findMany({
          where: {
            slug: prereq.from_slug,
            topic_graphs: {
              type: "BASELINE",
              content_id: { not: contextContentId },
            },
          },
          include: {
            topic_graphs: {
              include: {
                contents: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
          take: 2,
        });

        for (const node of coveringContents) {
          const content = node.topic_graphs?.contents;
          if (content) {
            recommendations.push({
              contentId: content.id,
              title: content.title,
              reason: `Prerequisite for ${weakNode.canonical_label}`,
              score: 7, // Prerequisites are medium-high priority
            });
          }
        }
      }
    }

    return recommendations;
  }

  /**
   * Deduplicate and sort recommendations by score.
   */
  private deduplicateAndSort(
    recommendations: RecommendationItem[],
  ): RecommendationItem[] {
    const seen = new Set<string>();
    const unique: RecommendationItem[] = [];

    for (const rec of recommendations) {
      if (!seen.has(rec.contentId)) {
        seen.add(rec.contentId);
        unique.push(rec);
      }
    }

    return unique.sort((a, b) => b.score - a.score);
  }
}
