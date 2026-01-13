import { Test, TestingModule } from "@nestjs/testing";
import { DeterministicSourceService } from "./deterministic-source.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("DeterministicSourceService", () => {
  let service: DeterministicSourceService;
  let prisma: PrismaService;

  const mockPrisma = {
    topic_graphs: {
      findMany: jest.fn(),
    },
    topic_registry: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    topic_aliases: {
      upsert: jest.fn(),
    },
    edge_priors: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    deterministic_build_runs: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeterministicSourceService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<DeterministicSourceService>(
      DeterministicSourceService,
    );
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("computeNodeValidation", () => {
    it("should promote node with sufficient evidence and recurrence", () => {
      const candidate = {
        slug: "test-node",
        canonical_label: "Test Node",
        aliases: [],
        domain_tags: [],
        tier2: [],
        source_graph_type: "LEARNER",
        evidence_strength: 3,
        recurrence: 2,
        vote_score: 1,
        curated_source: false,
      };

      const result = service.computeNodeValidation(candidate);

      expect(result.shouldPromote).toBe(true);
      expect(result.score).toBeGreaterThan(0.7);
    });

    it("should not promote node with insufficient evidence", () => {
      const candidate = {
        slug: "test-node",
        canonical_label: "Test Node",
        aliases: [],
        domain_tags: [],
        tier2: [],
        source_graph_type: "LEARNER",
        evidence_strength: 1,
        recurrence: 2,
        vote_score: 0,
        curated_source: false,
      };

      const result = service.computeNodeValidation(candidate);

      expect(result.shouldPromote).toBe(false);
    });

    it("should promote curated node regardless of votes", () => {
      const candidate = {
        slug: "test-node",
        canonical_label: "Test Node",
        aliases: [],
        domain_tags: [],
        tier2: [],
        source_graph_type: "CURATED",
        evidence_strength: 2,
        recurrence: 2,
        vote_score: 0,
        curated_source: true,
      };

      const result = service.computeNodeValidation(candidate);

      expect(result.shouldPromote).toBe(true);
    });
  });

  describe("computeEdgeValidation", () => {
    it("should promote edge with sufficient evidence and stability", () => {
      const candidate = {
        from_slug: "node-a",
        to_slug: "node-b",
        edge_type: "EXPLAINS",
        source_graph_type: "LEARNER",
        evidence_count: 3,
        vote_score: 1,
        stability: 2,
        curated_source: false,
        rationale_json: {},
      };

      const result = service.computeEdgeValidation(candidate);

      expect(result.shouldPromote).toBe(true);
      expect(result.score).toBeGreaterThan(0.6);
    });

    it("should not promote edge with low stability", () => {
      const candidate = {
        from_slug: "node-a",
        to_slug: "node-b",
        edge_type: "EXPLAINS",
        source_graph_type: "LEARNER",
        evidence_count: 2,
        vote_score: 1,
        stability: 1,
        curated_source: false,
        rationale_json: {},
      };

      const result = service.computeEdgeValidation(candidate);

      expect(result.shouldPromote).toBe(false);
    });
  });
});
