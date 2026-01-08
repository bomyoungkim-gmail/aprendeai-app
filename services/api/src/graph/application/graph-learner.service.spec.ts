import { Test, TestingModule } from '@nestjs/testing';
import { GraphLearnerService } from './graph-learner.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GraphEventType } from './dto/graph-event.dto';
import { GraphCacheService } from '../cache/graph-cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('GraphLearnerService', () => {
  let service: GraphLearnerService;
  let prisma: PrismaService;
  let cacheService: GraphCacheService;
  let eventEmitter: EventEmitter2;

  const mockPrisma = {
    // ... existing mocks
    topic_graphs: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    topic_nodes: {
      findFirst: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    topic_edges: {
      create: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    topic_edge_evidence: {
      create: jest.fn(),
      count: jest.fn(),
    },
    pkm_notes: {
      groupBy: jest.fn(),
    },
  };

  const mockCacheService = {
    getVisualization: jest.fn(),
    setVisualization: jest.fn(),
    invalidateVisualization: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphLearnerService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: GraphCacheService,
          useValue: mockCacheService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<GraphLearnerService>(GraphLearnerService);
    prisma = module.get<PrismaService>(PrismaService);
    cacheService = module.get<GraphCacheService>(GraphCacheService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleGraphEvent - HIGHLIGHT MAIN_IDEA', () => {
    it('should create a node for MAIN_IDEA highlight', async () => {
      const mockGraph = { id: 'graph-1', type: 'LEARNER' };
      const mockNode = { id: 'node-1', canonical_label: 'Photosynthesis', slug: 'photosynthesis' };

      mockPrisma.topic_graphs.findFirst.mockResolvedValue(mockGraph);
      mockPrisma.topic_nodes.findFirst.mockResolvedValue(null);
      mockPrisma.topic_nodes.create.mockResolvedValue(mockNode);
      mockPrisma.topic_nodes.count.mockResolvedValue(1);
      mockPrisma.topic_edges.count.mockResolvedValue(0);
      mockPrisma.topic_edge_evidence.count.mockResolvedValue(0);

      await service.handleGraphEvent({
        userId: 'user-1',
        contentId: 'content-1',
        eventType: GraphEventType.HIGHLIGHT,
        eventData: {
          highlightKind: 'MAIN_IDEA',
          selectedText: 'Photosynthesis',
          highlightId: 'hl-1',
        },
      });

      expect(mockPrisma.topic_nodes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            canonical_label: 'Photosynthesis',
            slug: 'photosynthesis',
            source: 'USER',
          }),
        }),
      );
    });
  });

  describe('handleGraphEvent - CORNELL_SYNTHESIS', () => {
    it('should extract topics and create edges', async () => {
      const mockGraph = { id: 'graph-1', type: 'LEARNER' };
      const mockNode1 = { id: 'node-1', canonical_label: 'Topic 1' };
      const mockNode2 = { id: 'node-2', canonical_label: 'Topic 2' };
      const mockEdge = { id: 'edge-1' };

      mockPrisma.topic_graphs.findFirst.mockResolvedValue(mockGraph);
      mockPrisma.topic_nodes.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      mockPrisma.topic_nodes.create.mockResolvedValueOnce(mockNode1).mockResolvedValueOnce(mockNode2);
      mockPrisma.topic_edges.create.mockResolvedValue(mockEdge);
      mockPrisma.topic_edge_evidence.create.mockResolvedValue({});
      mockPrisma.topic_nodes.count.mockResolvedValue(2);
      mockPrisma.topic_edges.count.mockResolvedValue(1);
      mockPrisma.topic_edge_evidence.count.mockResolvedValue(1);

      await service.handleGraphEvent({
        userId: 'user-1',
        contentId: 'content-1',
        eventType: GraphEventType.CORNELL_SYNTHESIS,
        eventData: {
          summaryText: 'This is a summary with multiple topics. Another topic here.',
          cornellNoteId: 'cornell-1',
        },
      });

      expect(mockPrisma.topic_edges.create).toHaveBeenCalled();
      expect(mockPrisma.topic_edge_evidence.create).toHaveBeenCalled();
    });
  });

  describe('handleGraphEvent - MISSION HUGGING', () => {
    it('should create APPLIES_IN edge for HUGGING mission', async () => {
      const mockGraph = { id: 'graph-1', type: 'LEARNER' };
      const mockTopicNode = { id: 'node-1', canonical_label: 'Gravity' };
      const mockDomainNode = { id: 'node-2', canonical_label: 'Physics' };
      const mockEdge = { id: 'edge-1' };

      mockPrisma.topic_graphs.findFirst.mockResolvedValue(mockGraph);
      mockPrisma.topic_nodes.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      mockPrisma.topic_nodes.create
        .mockResolvedValueOnce(mockTopicNode)
        .mockResolvedValueOnce(mockDomainNode);
      mockPrisma.topic_edges.create.mockResolvedValue(mockEdge);
      mockPrisma.topic_edge_evidence.create.mockResolvedValue({});
      mockPrisma.topic_nodes.count.mockResolvedValue(2);
      mockPrisma.topic_edges.count.mockResolvedValue(1);
      mockPrisma.topic_edge_evidence.count.mockResolvedValue(1);

      await service.handleGraphEvent({
        userId: 'user-1',
        contentId: 'content-1',
        eventType: GraphEventType.MISSION_COMPLETED,
        eventData: {
          missionType: 'HUGGING',
          missionData: { topic: 'Gravity', domain: 'Physics' },
          transferAttemptId: 'transfer-1',
        },
      });

      expect(mockPrisma.topic_edges.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            edge_type: 'APPLIES_IN',
          }),
        }),
      );
    });
  });

  describe('getVisualizationGraph', () => {
    it('should return cached value if available', async () => {
      const cachedGraph = { nodes: [], edges: [], metadata: {} };
      (mockCacheService.getVisualization as jest.Mock).mockResolvedValue(cachedGraph);

      const result = await service.getVisualizationGraph('user-1', 'content-1');

      expect(mockCacheService.getVisualization).toHaveBeenCalledWith('user-1', 'content-1');
      expect(result).toBe(cachedGraph);
      expect(mockPrisma.topic_graphs.findFirst).not.toHaveBeenCalled();
    });

    it('should generate, merge and cache graph if cache miss', async () => {
      (mockCacheService.getVisualization as jest.Mock).mockResolvedValue(null);

      const mockBaseline = {
        id: 'bg-1',
        topic_nodes: [{ id: 'n1', slug: 'topic-1', canonical_label: 'Topic 1' }],
        topic_edges: [],
      };
      
      const mockLearner = {
        id: 'lg-1',
        topic_nodes: [{ id: 'n1', slug: 'topic-1', status: 'MASTERED', confidence: 0.9 }],
        topic_edges: [],
      };

      mockPrisma.topic_graphs.findFirst
        .mockResolvedValueOnce(mockBaseline) // Baseline
        .mockResolvedValueOnce(mockLearner); // Learner

      (mockPrisma.pkm_notes.groupBy as jest.Mock).mockResolvedValue([
        { topic_node_id: 'n1', _count: { id: 3 } }
      ]);

      const result = await service.getVisualizationGraph('user-1', 'content-1');

      // Check merging
      expect(result.nodes[0].status).toBe('MASTERED');
      expect(result.nodes[0].confidence).toBe(0.9);
      expect(result.nodes[0].annotationCount).toBe(3);

      // Check caching
      expect(mockCacheService.setVisualization).toHaveBeenCalledWith(
        'user-1', 
        'content-1', 
        expect.anything()
      );
    });
  });
});
