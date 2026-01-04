import { Test, TestingModule } from '@nestjs/testing';
import { GraphCuratorService } from './graph-curator.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('GraphCuratorService', () => {
  let service: GraphCuratorService;
  let prisma: PrismaService;

  const mockPrisma = {
    topic_graphs: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    topic_nodes: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    topic_edges: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    topic_edge_evidence: {
      create: jest.fn(),
    },
    topic_edge_votes: {
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphCuratorService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<GraphCuratorService>(GraphCuratorService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ensureCuratedGraph', () => {
    it('should return existing curated graph', async () => {
      const mockGraph = { id: 'curated-1', type: 'CURATED' };
      mockPrisma.topic_graphs.findFirst.mockResolvedValue(mockGraph);

      const result = await service.ensureCuratedGraph('INSTITUTION', 'inst-1');

      expect(result).toEqual(mockGraph);
      expect(mockPrisma.topic_graphs.findFirst).toHaveBeenCalled();
    });

    it('should create new curated graph if not exists', async () => {
      mockPrisma.topic_graphs.findFirst.mockResolvedValue(null);
      mockPrisma.topic_graphs.create.mockResolvedValue({ id: 'curated-new' });

      const result = await service.ensureCuratedGraph('STUDY_GROUP', 'group-1');

      expect(result.id).toBe('curated-new');
      expect(mockPrisma.topic_graphs.create).toHaveBeenCalled();
    });
  });

  describe('processCurationItems', () => {
    it('should promote edge to curated graph', async () => {
      const mockEdge = {
        id: 'edge-1',
        edge_type: 'EXPLAINS',
        confidence: 0.7,
        topic_graphs: { scope_type: 'USER', scope_id: 'user-1' },
        from_node: { id: 'node-1', slug: 'topic-a', canonical_label: 'Topic A' },
        to_node: { id: 'node-2', slug: 'topic-b', canonical_label: 'Topic B' },
        topic_edge_evidence: [],
      };

      mockPrisma.topic_edges.findUnique.mockResolvedValue(mockEdge);
      mockPrisma.topic_graphs.findFirst.mockResolvedValue(null);
      mockPrisma.topic_graphs.create.mockResolvedValue({ id: 'curated-1' });
      mockPrisma.topic_nodes.findFirst.mockResolvedValue(null);
      mockPrisma.topic_nodes.create.mockResolvedValueOnce({ id: 'node-curated-1' });
      mockPrisma.topic_nodes.create.mockResolvedValueOnce({ id: 'node-curated-2' });
      mockPrisma.topic_edges.findFirst.mockResolvedValue(null);
      mockPrisma.topic_edges.create.mockResolvedValue({ id: 'edge-curated-1' });

      const result = await service.processCurationItems({
        diffId: 'diff-1',
        items: [{ edgeId: 'edge-1', action: 'PROMOTE' }],
        curatorUserId: 'curator-1',
      });

      expect(result.promoted).toBe(1);
      expect(mockPrisma.topic_edges.create).toHaveBeenCalled();
    });
  });

  describe('castVote', () => {
    it('should upsert vote and recalculate confidence', async () => {
      const mockEdge = {
        id: 'edge-1',
        confidence: 0.7,
        topic_edge_votes: [
          { vote: 1 },
          { vote: 1 },
          { vote: -1 },
        ],
      };

      mockPrisma.topic_edge_votes.upsert.mockResolvedValue({});
      mockPrisma.topic_edges.findUnique.mockResolvedValue(mockEdge);
      mockPrisma.topic_edges.update.mockResolvedValue({});

      await service.castVote('user-1', 'edge-1', 1, 'Good connection');

      expect(mockPrisma.topic_edge_votes.upsert).toHaveBeenCalled();
      expect(mockPrisma.topic_edges.update).toHaveBeenCalled();
    });
  });
});
