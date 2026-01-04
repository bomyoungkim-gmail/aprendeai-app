import { Test, TestingModule } from '@nestjs/testing';
import { GraphComparatorService } from './graph-comparator.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('GraphComparatorService', () => {
  let service: GraphComparatorService;
  let prisma: PrismaService;

  const mockPrisma = {
    topic_graphs: {
      findFirst: jest.fn(),
    },
    graph_diffs: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphComparatorService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<GraphComparatorService>(GraphComparatorService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('compareGraphs', () => {
    it('should compare baseline and learner graphs', async () => {
      const mockBaselineGraph = {
        id: 'baseline-1',
        type: 'BASELINE',
        topic_nodes: [
          { id: 'node-1', slug: 'photosynthesis', canonical_label: 'Photosynthesis' },
          { id: 'node-2', slug: 'respiration', canonical_label: 'Respiration' },
        ],
        topic_edges: [
          {
            id: 'edge-1',
            from_node_id: 'node-1',
            to_node_id: 'node-2',
            edge_type: 'SUPPORTS',
            confidence: 0.9,
            topic_edge_evidence: [],
          },
        ],
      };

      const mockLearnerGraph = {
        id: 'learner-1',
        type: 'LEARNER',
        topic_nodes: [
          { id: 'node-3', slug: 'photosynthesis', canonical_label: 'Photosynthesis' },
        ],
        topic_edges: [
          {
            id: 'edge-2',
            from_node_id: 'node-3',
            to_node_id: 'node-3',
            edge_type: 'LINKS_TO',
            confidence: 0.7,
            source: 'USER',
            topic_edge_evidence: [{ id: 'ev-1' }, { id: 'ev-2' }],
          },
        ],
      };

      mockPrisma.topic_graphs.findFirst
        .mockResolvedValueOnce(mockBaselineGraph)
        .mockResolvedValueOnce(mockLearnerGraph);
      mockPrisma.graph_diffs.findFirst.mockResolvedValue(null);
      mockPrisma.graph_diffs.create.mockResolvedValue({ id: 'diff-1' });

      const result = await service.compareGraphs('user-1', 'content-1');

      expect(result.diffId).toBe('diff-1');
      expect(result.diff_json.nodes.matched).toBe(1);
      expect(result.diff_json.nodes.missingInLearner).toBe(1); // Respiration missing
      expect(result.summary_json.topGaps).toBeDefined();
    });

    it('should classify learner-only edges as discoveries', async () => {
      const mockBaselineGraph = {
        id: 'baseline-1',
        type: 'BASELINE',
        topic_nodes: [
          { id: 'node-1', slug: 'topic-a', canonical_label: 'Topic A' },
        ],
        topic_edges: [],
      };

      const mockLearnerGraph = {
        id: 'learner-1',
        type: 'LEARNER',
        topic_nodes: [
          { id: 'node-2', slug: 'topic-a', canonical_label: 'Topic A' },
          { id: 'node-3', slug: 'topic-b', canonical_label: 'Topic B' },
        ],
        topic_edges: [
          {
            id: 'edge-1',
            from_node_id: 'node-2',
            to_node_id: 'node-3',
            edge_type: 'EXPLAINS',
            confidence: 0.8,
            source: 'USER',
            topic_edge_evidence: [{ id: 'ev-1' }, { id: 'ev-2' }],
          },
        ],
      };

      mockPrisma.topic_graphs.findFirst
        .mockResolvedValueOnce(mockBaselineGraph)
        .mockResolvedValueOnce(mockLearnerGraph);
      mockPrisma.graph_diffs.findFirst.mockResolvedValue(null);
      mockPrisma.graph_diffs.create.mockResolvedValue({ id: 'diff-1' });

      const result = await service.compareGraphs('user-1', 'content-1');

      expect(result.diff_json.classified.discoveries.length).toBeGreaterThan(0);
      expect(result.diff_json.classified.discoveries[0].classification).toBe('DISCOVERY_PLAUSIBLE');
    });
  });
});
