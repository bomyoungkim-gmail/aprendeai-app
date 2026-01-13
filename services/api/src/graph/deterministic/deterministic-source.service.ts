import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

interface NodeCandidate {
  slug: string;
  canonical_label: string;
  aliases: string[];
  domain_tags: string[];
  tier2: string[];
  source_graph_type: string;
  evidence_strength: number;
  recurrence: number;
  vote_score: number;
  curated_source: boolean;
}

interface EdgeCandidate {
  from_slug: string;
  to_slug: string;
  edge_type: string;
  source_graph_type: string;
  evidence_count: number;
  vote_score: number;
  stability: number;
  curated_source: boolean;
  rationale_json: any;
}

@Injectable()
export class DeterministicSourceService {
  private readonly logger = new Logger(DeterministicSourceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Collect node and edge candidates from graphs
   */
  async collectCandidates(
    scopeType: string,
    scopeId: string | null,
    contentIds?: string[],
  ): Promise<{ nodes: NodeCandidate[]; edges: EdgeCandidate[] }> {
    this.logger.log(`Collecting candidates for scope: ${scopeType}/${scopeId}`);

    const whereClause: any = {
      scope_type: scopeType,
      scope_id: scopeId,
    };

    if (contentIds && contentIds.length > 0) {
      whereClause.content_id = { in: contentIds };
    }

    // Fetch all relevant graphs
    const graphs = await (this.prisma as any).topic_graphs.findMany({
      where: whereClause,
      include: {
        topic_nodes: true,
        topic_edges: {
          include: {
            topic_edge_evidence: true,
            topic_edge_votes: true,
            from_node: true,
            to_node: true,
          },
        },
      },
    });

    const nodeMap = new Map<string, NodeCandidate>();
    const edgeMap = new Map<string, EdgeCandidate>();

    // Process each graph (prioritize: CURATED > LEARNER > BASELINE)
    const sortedGraphs = graphs.sort((a, b) => {
      const priority = { CURATED: 3, LEARNER: 2, BASELINE: 1 };
      return (priority[b.type] || 0) - (priority[a.type] || 0);
    });

    for (const graph of sortedGraphs) {
      const isCurated = graph.type === "CURATED";

      // Collect nodes
      for (const node of graph.topic_nodes) {
        if (!nodeMap.has(node.slug)) {
          nodeMap.set(node.slug, {
            slug: node.slug,
            canonical_label: node.canonical_label,
            aliases: Array.isArray(node.aliases_json)
              ? (node.aliases_json as string[])
              : [],
            domain_tags: Array.isArray(node.domain_tags_json)
              ? (node.domain_tags_json as string[])
              : [],
            tier2: Array.isArray(node.tier2_json)
              ? (node.tier2_json as string[])
              : [],
            source_graph_type: graph.type,
            evidence_strength: 0,
            recurrence: 1,
            vote_score: 0,
            curated_source: isCurated,
          });
        } else {
          // Increment recurrence
          const existing = nodeMap.get(node.slug)!;
          existing.recurrence += 1;
          if (isCurated) {
            existing.curated_source = true;
          }
        }
      }

      // Collect edges
      for (const edge of graph.topic_edges) {
        const edgeKey = `${edge.from_node_id}:${edge.to_node_id}:${edge.edge_type}`;
        const evidenceCount = edge.topic_edge_evidence?.length || 0;
        const voteScore =
          edge.topic_edge_votes?.reduce((sum, v) => sum + v.vote, 0) || 0;

        if (!edgeMap.has(edgeKey)) {
          edgeMap.set(edgeKey, {
            from_slug: edge.from_node?.slug || "",
            to_slug: edge.to_node?.slug || "",
            edge_type: edge.edge_type,
            source_graph_type: graph.type,
            evidence_count: evidenceCount,
            vote_score: voteScore,
            stability: 1,
            curated_source: isCurated,
            rationale_json: edge.rationale_json,
          });
        } else {
          const existing = edgeMap.get(edgeKey)!;
          existing.stability += 1;
          existing.evidence_count += evidenceCount;
          existing.vote_score += voteScore;
          if (isCurated) {
            existing.curated_source = true;
            existing.rationale_json = edge.rationale_json; // Curated rationale takes precedence
          }
        }
      }
    }

    // Update evidence_strength for nodes based on edges
    for (const edge of edgeMap.values()) {
      const fromNode = nodeMap.get(edge.from_slug);
      const toNode = nodeMap.get(edge.to_slug);
      if (fromNode) fromNode.evidence_strength += edge.evidence_count;
      if (toNode) toNode.evidence_strength += edge.evidence_count;
    }

    return {
      nodes: Array.from(nodeMap.values()),
      edges: Array.from(edgeMap.values()),
    };
  }

  /**
   * Compute node validation score (0-1)
   * Rule: Promote to ACTIVE if evidence_strength >= 2 AND recurrence >= 2 AND (vote_score >= 1 OR curated_source)
   */
  computeNodeValidation(candidate: NodeCandidate): {
    score: number;
    shouldPromote: boolean;
  } {
    const { evidence_strength, recurrence, vote_score, curated_source } =
      candidate;

    let score = 0;

    // Evidence contribution
    if (evidence_strength >= 2) score += 0.4;
    else if (evidence_strength >= 1) score += 0.2;

    // Recurrence contribution
    if (recurrence >= 3) score += 0.3;
    else if (recurrence >= 2) score += 0.2;

    // Vote/Curation contribution
    if (curated_source) score += 0.3;
    else if (vote_score >= 1) score += 0.1;

    const shouldPromote =
      evidence_strength >= 2 &&
      recurrence >= 2 &&
      (vote_score >= 1 || curated_source);

    return { score: Math.min(score, 1.0), shouldPromote };
  }

  /**
   * Compute edge validation score (0-1)
   * Rule: Promote to ACTIVE if evidence_count >= 2 AND (vote_score >= 1 OR curated_source) AND stability >= 2
   */
  computeEdgeValidation(candidate: EdgeCandidate): {
    score: number;
    shouldPromote: boolean;
  } {
    const { evidence_count, vote_score, stability, curated_source } = candidate;

    let score = 0;

    // Evidence contribution
    if (evidence_count >= 3) score += 0.4;
    else if (evidence_count >= 2) score += 0.3;
    else if (evidence_count >= 1) score += 0.1;

    // Stability contribution
    if (stability >= 3) score += 0.3;
    else if (stability >= 2) score += 0.2;

    // Vote/Curation contribution
    if (curated_source) score += 0.3;
    else if (vote_score >= 1) score += 0.1;

    const shouldPromote =
      evidence_count >= 2 &&
      (vote_score >= 1 || curated_source) &&
      stability >= 2;

    return { score: Math.min(score, 1.0), shouldPromote };
  }

  /**
   * Upsert topic registry and aliases
   */
  async upsertRegistry(
    candidates: NodeCandidate[],
    scopeType: string,
    scopeId: string | null,
  ): Promise<{ promoted: number; updated: number }> {
    let promoted = 0;
    let updated = 0;

    for (const candidate of candidates) {
      const validation = this.computeNodeValidation(candidate);

      const existingRegistry = await (
        this.prisma as any
      ).topic_registry.findUnique({
        where: {
          scope_type_scope_id_slug: {
            scope_type: scopeType as any,
            scope_id: scopeId,
            slug: candidate.slug,
          },
        },
      });

      const newStatus = validation.shouldPromote ? "ACTIVE" : "CANDIDATE";

      if (existingRegistry) {
        await (this.prisma as any).topic_registry.update({
          where: { id: existingRegistry.id },
          data: {
            canonical_label: candidate.canonical_label,
            aliases_json: candidate.aliases,
            domain_tags_json: candidate.domain_tags,
            tier2_json: candidate.tier2,
            stats_json: {
              ...(existingRegistry.stats_json as any),
              last_seen: new Date().toISOString(),
              recurrence: candidate.recurrence,
              evidence_strength: candidate.evidence_strength,
            },
            status: newStatus as any,
            confidence: validation.score,
          },
        });

        if (newStatus === "ACTIVE" && existingRegistry.status !== "ACTIVE") {
          promoted++;
        } else {
          updated++;
        }
      } else {
        await (this.prisma as any).topic_registry.create({
          data: {
            scope_type: scopeType as any,
            scope_id: scopeId,
            canonical_label: candidate.canonical_label,
            slug: candidate.slug,
            aliases_json: candidate.aliases,
            domain_tags_json: candidate.domain_tags,
            tier2_json: candidate.tier2,
            stats_json: {
              last_seen: new Date().toISOString(),
              recurrence: candidate.recurrence,
              evidence_strength: candidate.evidence_strength,
            },
            status: newStatus as any,
            confidence: validation.score,
          },
        });

        if (newStatus === "ACTIVE") {
          promoted++;
        }
      }

      // Upsert aliases
      for (const alias of candidate.aliases) {
        const normalized = alias.toLowerCase().trim();
        if (normalized && normalized !== candidate.slug) {
          await (this.prisma as any).topic_aliases.upsert({
            where: {
              registry_id_normalized: {
                registry_id: existingRegistry?.id || "",
                normalized,
              },
            },
            create: {
              registry_id: existingRegistry?.id || "",
              alias,
              normalized,
              weight: 0.5,
              source: candidate.source_graph_type,
            },
            update: {
              alias,
              weight: 0.6, // Slightly increase weight on update
            },
          });
        }
      }
    }

    this.logger.log(
      `Registry upsert: ${promoted} promoted, ${updated} updated`,
    );
    return { promoted, updated };
  }

  /**
   * Upsert edge priors
   */
  async upsertPriors(
    candidates: EdgeCandidate[],
    scopeType: string,
    scopeId: string | null,
  ): Promise<{ promoted: number; updated: number }> {
    let promoted = 0;
    let updated = 0;

    for (const candidate of candidates) {
      const validation = this.computeEdgeValidation(candidate);

      const existingPrior = await (this.prisma as any).edge_priors.findUnique({
        where: {
          scope_type_scope_id_from_slug_to_slug_edge_type: {
            scope_type: scopeType as any,
            scope_id: scopeId,
            from_slug: candidate.from_slug,
            to_slug: candidate.to_slug,
            edge_type: candidate.edge_type as any,
          },
        },
      });

      const newStatus = validation.shouldPromote ? "ACTIVE" : "CANDIDATE";
      const newWeight = validation.shouldPromote
        ? Math.min(0.3 + validation.score * 0.6, 0.9)
        : 0.3;

      if (existingPrior) {
        const updateData: any = {
          evidence_count: candidate.evidence_count,
          vote_score: candidate.vote_score,
          status: newStatus as any,
          prior_weight: newWeight,
        };

        // Only update rationale if source is curated
        if (candidate.curated_source) {
          updateData.rationale_json = candidate.rationale_json;
        }

        await (this.prisma as any).edge_priors.update({
          where: { id: existingPrior.id },
          data: updateData,
        });

        if (newStatus === "ACTIVE" && existingPrior.status !== "ACTIVE") {
          promoted++;
        } else {
          updated++;
        }
      } else {
        await (this.prisma as any).edge_priors.create({
          data: {
            scope_type: scopeType as any,
            scope_id: scopeId,
            from_slug: candidate.from_slug,
            to_slug: candidate.to_slug,
            edge_type: candidate.edge_type as any,
            evidence_count: candidate.evidence_count,
            vote_score: candidate.vote_score,
            rationale_json: candidate.curated_source
              ? candidate.rationale_json
              : {},
            status: newStatus as any,
            prior_weight: newWeight,
          },
        });

        if (newStatus === "ACTIVE") {
          promoted++;
        }
      }
    }

    this.logger.log(`Priors upsert: ${promoted} promoted, ${updated} updated`);
    return { promoted, updated };
  }

  /**
   * Run deterministic build
   */
  async runBuild(params: {
    scopeType: string;
    scopeId?: string;
    contentIds?: string[];
    mode?: "INCREMENTAL" | "FULL";
    dryRun?: boolean;
    createdBy?: string;
  }): Promise<any> {
    const startTime = Date.now();
    const { scopeType, scopeId, contentIds, mode, dryRun, createdBy } = params;

    this.logger.log(
      `Starting DSB build: ${scopeType}/${scopeId || "null"} (${mode || "FULL"}, dryRun: ${dryRun})`,
    );

    // Create build run record
    const buildRun = await (this.prisma as any).deterministic_build_runs.create(
      {
        data: {
          scope_type: scopeType as any,
          scope_id: scopeId || null,
          content_id: contentIds?.[0] || null,
          mode: mode || "FULL",
          dry_run: dryRun || false,
          created_by: createdBy || null,
        },
      },
    );

    try {
      // Step 1: Collect candidates
      const { nodes, edges } = await this.collectCandidates(
        scopeType,
        scopeId || null,
        contentIds,
      );

      this.logger.log(`Collected ${nodes.length} nodes, ${edges.length} edges`);

      let registryResult = { promoted: 0, updated: 0 };
      let priorsResult = { promoted: 0, updated: 0 };

      if (!dryRun) {
        // Step 2: Upsert registry
        registryResult = await this.upsertRegistry(
          nodes,
          scopeType,
          scopeId || null,
        );

        // Step 3: Upsert priors
        priorsResult = await this.upsertPriors(
          edges,
          scopeType,
          scopeId || null,
        );
      }

      const summary = {
        nodesCollected: nodes.length,
        edgesCollected: edges.length,
        promotedNodes: registryResult.promoted,
        updatedNodes: registryResult.updated,
        promotedEdges: priorsResult.promoted,
        updatedEdges: priorsResult.updated,
        durationMs: Date.now() - startTime,
      };

      // Update build run
      await (this.prisma as any).deterministic_build_runs.update({
        where: { id: buildRun.id },
        data: {
          finished_at: new Date(),
          summary_json: summary,
        },
      });

      this.logger.log(`DSB build complete: ${JSON.stringify(summary)}`);

      return { buildRunId: buildRun.id, summary };
    } catch (error) {
      this.logger.error(`DSB build failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
