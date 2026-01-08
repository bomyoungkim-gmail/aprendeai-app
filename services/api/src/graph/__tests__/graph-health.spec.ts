import { Test, TestingModule } from '@nestjs/testing';
import { GraphHealthService } from '../health/graph-health.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('GraphHealthService', () => {
  let service: GraphHealthService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      topic_graphs: {
        count: jest.fn(),
      },
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphHealthService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<GraphHealthService>(GraphHealthService);
  });

  describe('Job Status Tracking', () => {
    it('should record job start', () => {
      service.recordJobStart('test-job');
      const status = service.getJobStatus('test-job');
      
      expect(status.name).toBe('test-job');
      expect(status.lastRun).toBeInstanceOf(Date);
    });

    it('should record job success', () => {
      service.recordJobStart('test-job');
      service.recordJobSuccess('test-job');
      
      const status = service.getJobStatus('test-job');
      
      expect(status.status).toBe('healthy');
      expect(status.lastSuccess).toBeInstanceOf(Date);
    });

    it('should record job failure', () => {
      service.recordJobStart('test-job');
      service.recordJobFailure('test-job', 'Test error');
      
      const status = service.getJobStatus('test-job');
      
      expect(status.status).toBe('error');
      expect(status.message).toContain('Test error');
      expect(status.lastFailure).toBeInstanceOf(Date);
    });

    it('should return warning for job that never ran', () => {
      const status = service.getJobStatus('never-ran');
      
      expect(status.status).toBe('warning');
      expect(status.message).toContain('never run');
    });
  });

  describe('Health Metrics', () => {
    it('should return comprehensive health metrics', async () => {
      // Arrange
      prismaService.topic_graphs.count.mockResolvedValue(100);
      prismaService.$queryRaw
        .mockResolvedValueOnce([{ avg: 0.75 }]) // avg confidence
        .mockResolvedValueOnce([{ count: BigInt(25) }]); // graphs needing comparison

      service.recordJobStart('graph-comparison');
      service.recordJobSuccess('graph-comparison');
      service.recordJobStart('graph-decay');
      service.recordJobSuccess('graph-decay');

      // Act
      const metrics = await service.getHealthMetrics();

      // Assert
      expect(metrics.totalLearnerGraphs).toBe(100);
      expect(metrics.averageConfidence).toBe(0.75);
      expect(metrics.graphsNeedingComparison).toBe(25);
      expect(metrics.lastComparisonJob.status).toBe('healthy');
      expect(metrics.lastDecayJob.status).toBe('healthy');
    });
  });
});
