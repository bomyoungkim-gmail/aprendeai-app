import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { PrismaService } from "../../prisma/prisma.service";
import { GraphDecayService } from "../decay/graph-decay.service";

/**
 * GRAPH SCRIPT 19.10: Graph Reinforcement Listener
 *
 * Listens to user interaction events (highlights, missions, reviews)
 * and reinforces related nodes in the learner graph.
 *
 * This prevents decay of actively used knowledge.
 */
@Injectable()
export class GraphReinforcementListener {
  private readonly logger = new Logger(GraphReinforcementListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly decayService: GraphDecayService,
  ) {}

  /**
   * Reinforce nodes when user creates a highlight
   */
  @OnEvent("highlight.created")
  async handleHighlightCreated(payload: {
    highlightId: string;
    userId: string;
    contentId: string;
    selectedText: string;
  }) {
    try {
      // Find nodes matching the highlighted text
      const slug = this.slugify(payload.selectedText);

      const nodes = await this.prisma.topic_nodes.findMany({
        where: {
          slug: { contains: slug.substring(0, 20) },
          topic_graphs: {
            scope_id: payload.userId,
            content_id: payload.contentId,
            type: "LEARNER",
          },
        },
        select: { id: true },
      });

      // Reinforce matching nodes
      for (const node of nodes) {
        await this.decayService.reinforceNode(node.id, 0.15);
      }

      if (nodes.length > 0) {
        this.logger.log(
          `Reinforced ${nodes.length} nodes from highlight ${payload.highlightId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to reinforce nodes from highlight: ${error.message}`,
        error.stack,
      );
      // Don't throw - this is a best-effort operation
    }
  }

  /**
   * Reinforce nodes when user completes a mission
   */
  @OnEvent("mission.completed")
  async handleMissionCompleted(payload: {
    userId: string;
    contentId: string;
    missionData: any;
  }) {
    try {
      // Extract topics from mission data
      const topics = this.extractTopicsFromMission(payload.missionData);

      for (const topic of topics) {
        const slug = this.slugify(topic);

        const nodes = await this.prisma.topic_nodes.findMany({
          where: {
            slug,
            topic_graphs: {
              scope_id: payload.userId,
              content_id: payload.contentId,
              type: "LEARNER",
            },
          },
          select: { id: true },
        });

        // Stronger boost for missions (0.2 vs 0.15 for highlights)
        for (const node of nodes) {
          await this.decayService.reinforceNode(node.id, 0.2);
        }

        if (nodes.length > 0) {
          this.logger.log(
            `Reinforced ${nodes.length} nodes from mission completion`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to reinforce nodes from mission: ${error.message}`,
        error.stack,
      );
      // Don't throw - this is a best-effort operation
    }
  }

  /**
   * Slugify text for matching
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Extract topic strings from mission data
   */
  private extractTopicsFromMission(data: any): string[] {
    // Extract topic, domain, principle, etc. from mission data
    const topics: string[] = [];

    if (data.topic) topics.push(data.topic);
    if (data.domain) topics.push(data.domain);
    if (data.principle) topics.push(data.principle);
    if (data.topicA) topics.push(data.topicA);
    if (data.topicB) topics.push(data.topicB);
    if (data.cause) topics.push(data.cause);
    if (data.effect) topics.push(data.effect);

    return topics.filter((t) => typeof t === "string" && t.length > 0);
  }
}
