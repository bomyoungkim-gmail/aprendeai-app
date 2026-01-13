import { Test, TestingModule } from "@nestjs/testing";
import { GraphBaselineService } from "./graph-baseline.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("GraphBaselineService", () => {
  let service: GraphBaselineService;
  let prisma: PrismaService;

  const mockPrisma = {
    contents: {
      findUnique: jest.fn(),
    },
    topic_graphs: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    topic_nodes: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    topic_edges: {
      create: jest.fn(),
    },
    topic_edge_evidence: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphBaselineService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<GraphBaselineService>(GraphBaselineService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("buildBaseline", () => {
    it("should build a baseline graph from TOC", async () => {
      const mockContent = {
        id: "content-1",
        title: "Test Content",
        content_extractions: {
          toc_json: [
            {
              title: "Chapter 1",
              level: 1,
              page: 1,
              children: [
                {
                  title: "Section 1.1",
                  level: 2,
                  page: 2,
                },
              ],
            },
          ],
        },
        content_versions: [],
      };

      const mockGraph = { id: "graph-1", type: "BASELINE" };
      const mockNode1 = {
        id: "node-1",
        canonical_label: "Chapter 1",
        slug: "chapter-1",
      };
      const mockNode2 = {
        id: "node-2",
        canonical_label: "Section 1.1",
        slug: "section-1-1",
      };

      mockPrisma.contents.findUnique.mockResolvedValue(mockContent);
      mockPrisma.topic_graphs.findFirst.mockResolvedValue(null);
      mockPrisma.topic_graphs.create.mockResolvedValue(mockGraph);
      mockPrisma.topic_nodes.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockPrisma.topic_nodes.create
        .mockResolvedValueOnce(mockNode1)
        .mockResolvedValueOnce(mockNode2);
      mockPrisma.topic_edges.create.mockResolvedValue({ id: "edge-1" });
      mockPrisma.topic_edge_evidence.create.mockResolvedValue({});

      const result = await service.buildBaseline({
        contentId: "content-1",
        scopeType: "GLOBAL" as any,
      });

      expect(result.graphId).toBe("graph-1");
      expect(mockPrisma.topic_nodes.create).toHaveBeenCalledTimes(2);
      expect(mockPrisma.topic_edges.create).toHaveBeenCalled();
    });

    it("should extract nodes from glossary", async () => {
      const mockContent = {
        id: "content-1",
        title: "Test Content",
        content_extractions: null,
        content_versions: [
          {
            vocabulary_glossary: [
              { term: "Photosynthesis" },
              { term: "Respiration" },
            ],
          },
        ],
      };

      const mockGraph = { id: "graph-1", type: "BASELINE" };
      const mockNode = {
        id: "node-1",
        canonical_label: "Photosynthesis",
        slug: "photosynthesis",
      };

      mockPrisma.contents.findUnique.mockResolvedValue(mockContent);
      mockPrisma.topic_graphs.findFirst.mockResolvedValue(null);
      mockPrisma.topic_graphs.create.mockResolvedValue(mockGraph);
      mockPrisma.topic_nodes.findFirst.mockResolvedValue(null);
      mockPrisma.topic_nodes.create.mockResolvedValue(mockNode);

      const result = await service.buildBaseline({
        contentId: "content-1",
        scopeType: "GLOBAL" as any,
      });

      expect(result.graphId).toBe("graph-1");
      expect(mockPrisma.topic_nodes.create).toHaveBeenCalled();
    });
  });
});
