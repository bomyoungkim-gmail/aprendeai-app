import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { GraphMetricsService } from '../metrics/graph-metrics.service';
import { GraphHealthService } from '../health/graph-health.service';
import { GraphDiffController } from '../diff/graph-diff.controller';
import { GraphMetricsController } from '../metrics/graph-metrics.controller';
import { GraphHealthController } from '../health/graph-health.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { GraphDiffService } from '../diff/graph-diff.service';

/**
 * E2E Integration Tests for Graph Automation Enhancements
 * Covers: Metrics, Health, and Graph Diff endpoints
 */
describe('Graph Automation (e2e)', () => {
  let app: INestApplication;
  let metricsService: GraphMetricsService;

  const mockPrismaService = {
    topic_graphs: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(10),
    },
    graph_comparison_outcomes: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    $queryRaw: jest.fn().mockResolvedValue([]),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        GraphMetricsController,
        GraphHealthController,
        GraphDiffController,
      ],
      providers: [
        GraphMetricsService,
        GraphHealthService,
        GraphDiffService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    metricsService = moduleFixture.get<GraphMetricsService>(GraphMetricsService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/metrics/graph (GET)', () => {
    it('should return 200 and Prometheus formatted metrics', () => {
      // Pre-seed some metrics
      metricsService.recordJobExecution('test-job', 100, true, 5);

      return request(app.getHttpServer())
        .get('/metrics/graph')
        .expect(200)
        .expect('Content-Type', /text\/plain/)
        .expect((res) => {
          expect(res.text).toContain('# HELP graph_job_duration_ms');
          expect(res.text).toContain('# TYPE graph_job_duration_ms summary');
          expect(res.text).toContain('graph_job_executions_total{job="test-job",status="success"} 1');
        });
    });
  });

  describe('/health/graph-automation (GET)', () => {
    it('should return 200 and health status', () => {
      return request(app.getHttpServer())
        .get('/health/graph-automation')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalLearnerGraphs');
          expect(res.body).toHaveProperty('averageConfidence');
          expect(res.body).toHaveProperty('lastComparisonJob');
          expect(res.body).toHaveProperty('lastDecayJob');
        });
    });
  });

  describe('/graph/diff/:userId (GET)', () => {
    it('should return 200 and diff structure', () => {
      return request(app.getHttpServer())
        .get('/graph/diff/user123?since=7d')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('period');
          expect(res.body).toHaveProperty('summary');
          expect(res.body).toHaveProperty('changes');
          expect(res.body.changes).toHaveProperty('added');
          expect(res.body.changes).toHaveProperty('removed');
        });
    });

    it('should support contentId parameter', () => {
      return request(app.getHttpServer())
        .get('/graph/diff/user123/content456?since=24h')
        .expect(200);
    });
  });
});
