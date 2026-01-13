import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export interface LinkingResult {
  matched: number;
  candidatesCreated: number;
  details: Array<{
    nodeSlug: string;
    action: "MATCHED" | "CANDIDATE_CREATED";
    registryId?: string;
  }>;
}

@Injectable()
export class TopicLinkingService {
  private readonly logger = new Logger(TopicLinkingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Link baseline graph nodes to the Global Registry.
   * Executes during baseline build (Script 02).
   *
   * @param contentId - The content being processed
   * @param baselineGraphId - The baseline graph ID
   * @returns Linking statistics
   */
  async linkTopics(
    contentId: string,
    baselineGraphId: string,
  ): Promise<LinkingResult> {
    this.logger.log(
      `Linking topics for content ${contentId} (baseline: ${baselineGraphId})`,
    );

    const result: LinkingResult = {
      matched: 0,
      candidatesCreated: 0,
      details: [],
    };

    // Fetch baseline nodes
    const baselineNodes = await (this.prisma as any).topic_nodes.findMany({
      where: { graph_id: baselineGraphId },
      select: {
        id: true,
        canonical_label: true,
        slug: true,
        aliases_json: true,
        attributes_json: true,
      },
    });

    this.logger.log(`Found ${baselineNodes.length} baseline nodes to link`);

    for (const node of baselineNodes) {
      const aliases = Array.isArray(node.aliases_json) ? node.aliases_json : [];
      const searchTerms = [
        node.slug,
        ...aliases.map((a: any) => a.normalized || a),
      ];

      // Try to match against Global Registry
      const registryMatch = await (this.prisma as any).topic_registry.findFirst(
        {
          where: {
            scope_type: "GLOBAL",
            scope_id: null,
            OR: [
              { slug: { in: searchTerms } },
              {
                topic_aliases: {
                  some: {
                    normalized: { in: searchTerms },
                  },
                },
              },
            ],
            status: "ACTIVE",
          },
        },
      );

      if (registryMatch) {
        // Match found: Link this node to registry
        this.logger.debug(
          `Matched node ${node.slug} to registry ${registryMatch.canonical_label}`,
        );

        // Store the link in node attributes_json
        const currentAttributes = (node.attributes_json as any) || {};
        await (this.prisma as any).topic_nodes.update({
          where: { id: node.id },
          data: {
            attributes_json: {
              ...currentAttributes,
              registry_id: registryMatch.id,
              registry_label: registryMatch.canonical_label,
            },
          },
        });

        result.matched++;
        result.details.push({
          nodeSlug: node.slug,
          action: "MATCHED",
          registryId: registryMatch.id,
        });
      } else {
        // No match: Create candidate in registry
        this.logger.debug(`No match for ${node.slug}, creating candidate`);

        const candidate = await (this.prisma as any).topic_registry.create({
          data: {
            scope_type: "GLOBAL",
            scope_id: null,
            canonical_label: node.canonical_label,
            slug: node.slug,
            aliases_json: aliases,
            status: "CANDIDATE",
            confidence: 0.3, // Low confidence for auto-created candidates
            stats_json: {
              source_content_id: contentId,
              created_from: "baseline_linking",
            },
          },
        });

        // Link node to the new candidate
        const currentAttributes = (node.attributes_json as any) || {};
        await (this.prisma as any).topic_nodes.update({
          where: { id: node.id },
          data: {
            attributes_json: {
              ...currentAttributes,
              registry_id: candidate.id,
              registry_label: candidate.canonical_label,
              registry_status: "CANDIDATE",
            },
          },
        });

        result.candidatesCreated++;
        result.details.push({
          nodeSlug: node.slug,
          action: "CANDIDATE_CREATED",
          registryId: candidate.id,
        });
      }
    }

    this.logger.log(
      `Linking complete: ${result.matched} matched, ${result.candidatesCreated} candidates created`,
    );

    return result;
  }

  /**
   * Ensure the Global Registry Graph exists.
   * Creates it if not present.
   */
  async ensureGlobalGraph(): Promise<string> {
    const existing = await (this.prisma as any).topic_graphs.findFirst({
      where: {
        type: "CURATED",
        scope_type: "GLOBAL",
        content_id: null,
      },
    });

    if (existing) {
      return existing.id;
    }

    this.logger.log("Creating Global Registry Graph");
    const globalGraph = await (this.prisma as any).topic_graphs.create({
      data: {
        type: "CURATED",
        scope_type: "GLOBAL",
        scope_id: null,
        content_id: null,
        title: "Global Topic Registry", // Use title instead of metadata description
        created_by: "system",
      },
    });

    return globalGraph.id;
  }
}
