import { Test, TestingModule } from '@nestjs/testing';
import { DcsCalculatorService } from './dcs-calculator.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('DcsCalculatorService', () => {
  let service: DcsCalculatorService;
  let prisma: PrismaService;

  const mockPrisma = {
    contents: {
      findUnique: jest.fn(),
    },
    content_chunks: {
      count: jest.fn(),
    },
    topic_graphs: {
      findMany: jest.fn(),
    },
    topic_edge_votes: {
      count: jest.fn(),
    },
    determinism_scores: {
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DcsCalculatorService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<DcsCalculatorService>(DcsCalculatorService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateDcs', () => {
    it('should calculate DCS with correct formula weights', async () => {
      // Mock all component methods to return known values
      mockPrisma.contents.findUnique.mockResolvedValue({
        metadata: { hasText: true, toc: ['Ch1'] },
      });
      mockPrisma.content_chunks.count.mockResolvedValue(0);
      mockPrisma.topic_graphs.findMany.mockResolvedValue([]);
      mockPrisma.topic_edge_votes.count.mockResolvedValue(0);

      const result = await service.calculateDcs('content-1', 'USER', 'user-1');

      // With doc=1.0, others=0: DCS = 0.15*1.0 = 0.15
      expect(result.dcs).toBeCloseTo(0.15, 2);
      expect(result.w_det).toBeCloseTo(0.15, 2);
      expect(result.w_llm).toBeCloseTo(0.85, 2);
    });

    it('should ensure w_det + w_llm = 1', async () => {
      mockPrisma.contents.findUnique.mockResolvedValue({
        metadata: { hasText: true },
      });
      mockPrisma.content_chunks.count.mockResolvedValue(0);
      mockPrisma.topic_graphs.findMany.mockResolvedValue([]);
      mockPrisma.topic_edge_votes.count.mockResolvedValue(0);

      const result = await service.calculateDcs('content-1', 'USER', 'user-1');

      const sum = result.w_det + result.w_llm;
      expect(sum).toBeCloseTo(1.0, 6);
    });

    it('should cap DCS at 1.0', async () => {
      // Even if components sum > 1, DCS should be capped
      mockPrisma.contents.findUnique.mockResolvedValue({
        metadata: { hasText: true, toc: ['Ch1'] },
      });
      mockPrisma.content_chunks.count.mockResolvedValue(10);
      mockPrisma.topic_graphs.findMany.mockResolvedValue([
        {
          type: 'CURATED',
          topic_edges: [
            {
              topic_edge_evidence: [{ id: '1' }, { id: '2' }, { id: '3' }],
            },
          ],
        },
      ]);
      mockPrisma.topic_edge_votes.count.mockResolvedValue(10);

      const result = await service.calculateDcs('content-1', 'USER', 'user-1');

      expect(result.dcs).toBeLessThanOrEqual(1.0);
      expect(result.w_det).toBeLessThanOrEqual(1.0);
    });
  });

  describe('persistScore', () => {
    it('should upsert DCS score to database', async () => {
      const result = {
        dcs: 0.75,
        w_det: 0.75,
        w_llm: 0.25,
        components: {
          docSupport: 1.0,
          coverage: 0.8,
          matchQuality: 0.9,
          evidenceStrength: 0.7,
          stability: 0.6,
          curation: 0.5,
        },
      };

      await service.persistScore('content-1', 'USER', 'user-1', result);

      expect(mockPrisma.determinism_scores.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            content_id: 'content-1',
            dcs: 0.75,
            w_det: 0.75,
            w_llm: 0.25,
          }),
        }),
      );
    });
  });
});
