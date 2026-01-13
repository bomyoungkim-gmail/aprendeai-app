import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { BuildBaselineDto } from "./dto/build-baseline.dto";
import { TopicLinkingService } from "../registry/topic-linking.service";

interface TocItem {
  title: string;
  level: number;
  page?: number;
  children?: TocItem[];
}

import { GraphCacheService } from "../cache/graph-cache.service";

@Injectable()
export class GraphBaselineService {
  private readonly logger = new Logger(GraphBaselineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly topicLinking: TopicLinkingService,
    private readonly graphCache: GraphCacheService,
  ) {}

  /**
   * Build a BASELINE graph for a content
   */
  async buildBaseline(dto: BuildBaselineDto): Promise<{ graphId: string }> {
    this.logger.log(`Building baseline graph for content: ${dto.contentId}`);

    // Verify content exists
    const content = await this.prisma.contents.findUnique({
      where: { id: dto.contentId },
      include: {
        content_extractions: true,
        content_versions: true,
      },
    });

    if (!content) {
      throw new NotFoundException(`Content ${dto.contentId} not found`);
    }

    // Create or get baseline graph
    const graph = await this.ensureBaselineGraph(dto);

    // Extract nodes
    const nodes = await this.extractNodes(dto.contentId, graph.id, content);
    this.logger.log(`Extracted ${nodes.length} nodes`);

    // Extract edges
    const edges = await this.extractEdges(graph.id, nodes, content);
    this.logger.log(`Extracted ${edges.length} edges`);

    // SCRIPT 07: LLM Edge Typing (Stub with Cache/Budget)
    // In a real scenario, this would iterate edges and ask LLM for better types than PART_OF/MENTIONS.
    // Here we demonstrate the Cache + ProviderUsage pattern.
    await this.enhanceEdgesWithLlm(dto.contentId, edges);

    // GRAPH SCRIPT 06: Link topics to Global Registry
    try {
      const linkingResult = await this.topicLinking.linkTopics(
        dto.contentId,
        graph.id,
      );
      this.logger.log(
        `Linked topics: ${linkingResult.matched} matched, ${linkingResult.candidatesCreated} candidates created`,
      );
    } catch (error) {
      this.logger.error(`Failed to link topics to registry: ${error.message}`);
      // Continue even if linking fails
    }

    // Emit telemetry
    await this.emitTelemetry(
      dto.contentId,
      graph.id,
      nodes.length,
      edges.length,
    );

    return { graphId: graph.id };
  }

  /**
   * GRAPH SCRIPT 19.8: Find existing baseline graph for content
   * Used by ContentBaselineListener for idempotency check
   */
  async findBaseline(
    contentId: string,
    scopeType: string = "GLOBAL",
    scopeId: string = "system",
  ) {
    return (this.prisma as any).topic_graphs.findFirst({
      where: {
        type: "BASELINE",
        scope_type: scopeType,
        scope_id: scopeId,
        content_id: contentId,
      },
    });
  }

  /**
   * Ensure a BASELINE graph exists
   */
  private async ensureBaselineGraph(dto: BuildBaselineDto) {
    let graph = await (this.prisma as any).topic_graphs.findFirst({
      where: {
        type: "BASELINE",
        scope_type: dto.scopeType,
        scope_id: dto.scopeId,
        content_id: dto.contentId,
      },
    });

    if (!graph) {
      graph = await (this.prisma as any).topic_graphs.create({
        data: {
          type: "BASELINE",
          scope_type: dto.scopeType,
          scope_id: dto.scopeId,
          content_id: dto.contentId,
          title: `Baseline Graph - ${dto.contentId}`,
          created_by: "system",
        },
      });
      this.logger.log(`Created new baseline graph: ${graph.id}`);
    }

    return graph;
  }

  /**
   * Extract nodes from content (deterministic)
   * Priority: TOC > Glossary > Fallback
   */
  private async extractNodes(
    contentId: string,
    graphId: string,
    content: any,
  ): Promise<any[]> {
    const nodes: any[] = [];

    // 1. Extract from TOC
    if (content.content_extractions?.toc_json) {
      const tocNodes = this.extractNodesFromToc(
        content.content_extractions.toc_json,
      );
      nodes.push(...tocNodes);
      this.logger.debug(`Extracted ${tocNodes.length} nodes from TOC`);
    }

    // 2. Extract from Glossary
    if (content.content_versions?.[0]?.vocabulary_glossary) {
      const glossaryNodes = this.extractNodesFromGlossary(
        content.content_versions[0].vocabulary_glossary,
      );
      nodes.push(...glossaryNodes);
      this.logger.debug(
        `Extracted ${glossaryNodes.length} nodes from Glossary`,
      );
    }

    // 3. Fallback: Document title
    if (nodes.length === 0) {
      nodes.push({
        label: content.title || content.file_name || "Untitled",
        slug: this.slugify(content.title || content.file_name || "untitled"),
      });
      this.logger.debug("Using fallback node (document title)");
    }

    // Persist nodes
    const persistedNodes = [];
    for (const nodeData of nodes) {
      const node = await this.findOrUpsertNode(
        graphId,
        nodeData.label,
        "DETERMINISTIC",
      );
      persistedNodes.push(node);
    }

    return persistedNodes;
  }

  /**
   * Extract nodes from TOC structure
   */
  private extractNodesFromToc(
    tocJson: any,
  ): Array<{ label: string; slug: string }> {
    const nodes: Array<{ label: string; slug: string }> = [];

    const traverse = (items: TocItem[]) => {
      for (const item of items) {
        if (item.title) {
          nodes.push({
            label: item.title,
            slug: this.slugify(item.title),
          });
        }
        if (item.children) {
          traverse(item.children);
        }
      }
    };

    if (Array.isArray(tocJson)) {
      traverse(tocJson);
    }

    return nodes;
  }

  /**
   * Extract nodes from Glossary
   */
  private extractNodesFromGlossary(
    glossary: any,
  ): Array<{ label: string; slug: string }> {
    const nodes: Array<{ label: string; slug: string }> = [];

    if (Array.isArray(glossary)) {
      for (const term of glossary) {
        if (term.term || term.label) {
          const label = term.term || term.label;
          nodes.push({
            label,
            slug: this.slugify(label),
          });
        }
      }
    }

    return nodes;
  }

  /**
   * Extract edges from content (deterministic)
   */
  private async extractEdges(
    graphId: string,
    nodes: any[],
    content: any,
  ): Promise<any[]> {
    const edges: any[] = [];

    // 1. Extract PART_OF edges from TOC hierarchy
    if (content.content_extractions?.toc_json) {
      const tocEdges = await this.extractPartOfEdges(
        graphId,
        content.content_extractions.toc_json,
        nodes,
      );
      edges.push(...tocEdges);
      this.logger.debug(`Extracted ${tocEdges.length} PART_OF edges from TOC`);
    }

    return edges;
  }

  /**
   * Extract PART_OF edges from TOC hierarchy
   */
  private async extractPartOfEdges(
    graphId: string,
    tocJson: any,
    nodes: any[],
  ): Promise<any[]> {
    const edges: any[] = [];

    const traverse = async (
      items: TocItem[],
      parent: TocItem | null = null,
    ) => {
      for (const item of items) {
        if (parent && item.title && parent.title) {
          // Find nodes by slug
          const parentNode = nodes.find(
            (n) => n.slug === this.slugify(parent.title),
          );
          const childNode = nodes.find(
            (n) => n.slug === this.slugify(item.title),
          );

          if (parentNode && childNode) {
            const edge = await (this.prisma as any).topic_edges.create({
              data: {
                graph_id: graphId,
                from_node_id: parentNode.id,
                to_node_id: childNode.id,
                edge_type: "PART_OF",
                confidence: 0.9,
                source: "DETERMINISTIC",
                rationale_json: { toc_hierarchy: true },
              },
            });

            // Create evidence
            await (this.prisma as any).topic_edge_evidence.create({
              data: {
                edge_id: edge.id,
                evidence_type: "PAGE_AREA",
                page_number: item.page,
                excerpt: `${parent.title} -> ${item.title}`,
              },
            });

            edges.push(edge);
          }
        }

        if (item.children) {
          await traverse(item.children, item);
        }
      }
    };

    if (Array.isArray(tocJson)) {
      await traverse(tocJson);
    }

    return edges;
  }

  /**
   * Find or create a topic node (deterministic matching)
   */
  private async findOrUpsertNode(
    graphId: string,
    label: string,
    source: "DETERMINISTIC" | "LLM",
  ) {
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
          confidence: source === "DETERMINISTIC" ? 0.8 : 0.6,
          source,
          last_reinforced_at: new Date(), // GRAPH SCRIPT 19.10: Initialize for decay
        },
      });
      this.logger.debug(
        `Created new node: ${node.canonical_label} (${node.id})`,
      );
    }

    return node;
  }

  /**
   * Slugify a label for matching
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
   * Emit telemetry event
   */
  private async emitTelemetry(
    contentId: string,
    graphId: string,
    nodeCount: number,
    edgeCount: number,
  ) {
    this.logger.log(
      `Telemetry: graph_baseline_built - Content: ${contentId}, Nodes: ${nodeCount}, Edges: ${edgeCount}`,
    );
    // Could emit to telemetry service here
  }

  /**
   * SCRIPT 07: Enhance edges with LLM (Simulated)
   * Demonstrafes Caching & Provider usage recording.
   */
  private async enhanceEdgesWithLlm(contentId: string, edges: any[]) {
    if (edges.length === 0) return;

    this.logger.log("Starting LLM Edge Typing Enhancement...");

    // Simulate limit: only process first 5 edges to save "tokens"
    const edgesToProcess = edges.slice(0, 5);
    let cacheHits = 0;
    let llmCalls = 0;

    for (const edge of edgesToProcess) {
      const signature = `edge:${edge.source_slug}->${edge.target_slug}`;

      // 1. Check Cache
      const cachedType = await this.graphCache.getEdgeType(
        contentId,
        signature,
      );
      if (cachedType) {
        cacheHits++;
        // In real logic: update edge type if diff
        continue;
      }

      // 2. Call LLM (Simulated)
      // const llmResult = await this.aiService.classifyEdge(...)
      llmCalls++;

      // 3. Set Cache
      await this.graphCache.setEdgeType(
        contentId,
        signature,
        "ENHANCED_RELATION",
      );
    }

    // 4. Record Usage
    if (llmCalls > 0) {
      // Find owner of content to charge usage
      // Note: Using 'any' for prisma models to avoid TS errors if types not synced
      const content = await this.prisma.contents.findUnique({
        where: { id: contentId },
        select: { created_by: true },
      });

      try {
        await (this.prisma as any).provider_usage.create({
          data: {
            provider: "openai",
            model: "gpt-4o-stub",
            tokens_input: llmCalls * 50,
            tokens_output: llmCalls * 10,
            cost_usd: 0.0,
            feature_name: "graph_baseline_edge_typing",
            user_id: content?.created_by || "system",
            metadata: {
              content_id: contentId,
              edges_processed: llmCalls,
            },
          },
        });
      } catch (e) {
        this.logger.warn(`Failed to record provider usage: ${e.message}`);
      }
    }

    this.logger.log(
      `LLM Enhancement Complete: ${cacheHits} cache hits, ${llmCalls} LLM calls recorded.`,
    );
  }
}
