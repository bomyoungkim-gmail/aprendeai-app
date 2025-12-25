import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ReadingSessionsService } from '../../src/sessions/reading-sessions.service';
import { AiServiceClient } from '../../src/ai-service/ai-service.client';
import { ProviderUsageService } from '../../src/observability/provider-usage.service';

describe('AI Gateway - Token Tracking Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let aiServiceClient: AiServiceClient;

  const mockAiServiceClient = {
    sendPrompt: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        ReadingSessionsService,
        ProviderUsageService,
        PrismaService,
        {
          provide: AiServiceClient,
          useValue: mockAiServiceClient,
        },
        // Add other required providers...
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    aiServiceClient = moduleFixture.get<AiServiceClient>(AiServiceClient);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /sessions/reading/:sessionId/prompt', () => {
    it('should track usage when AI service returns usage metadata', async () => {
      // Mock AI Service response with usage data
      const mockAiResponse = {
        threadId: 'thread-123',
        nextPrompt: 'AI response text',
        quickReplies: [],
        usage: {
          prompt_tokens: 150,
          completion_tokens: 80,
          total_tokens: 230,
          cost_est_usd: 0.0023,
        },
      };

      mockAiServiceClient.sendPrompt.mockResolvedValue(mockAiResponse);

      // Spy on ProviderUsageService
      const trackUsageSpy = jest.spyOn(
        ProviderUsageService.prototype,
        'trackUsage',
      );

      const sessionId = 'test-session-123';
      const userId = 'test-user-456';

      // Mock session lookup
      jest.spyOn(prisma.readingSession, 'findUnique').mockResolvedValue({
        id: sessionId,
        userId,
        contentId: 'content-1',
        // ... other fields
      } as any);

      // Mock user context lookup
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: userId,
        institutionId: 'inst-789',
        // ... other fields
      } as any);

      jest.spyOn(prisma.familyMember, 'findFirst').mockResolvedValue({
        userId,
        familyId: 'family-999',
        // ... other fields
      } as any);

      const response = await request(app.getHttpServer())
        .post(`/api/v1/sessions/reading/${sessionId}/prompt`)
        .send({
          promptMessage: {
            threadId: 'thread-123',
            text: 'Test prompt',
            actorRole: 'LEARNER',
          },
        })
        .expect(HttpStatus.OK);

      // Verify AI service was called
      expect(mockAiServiceClient.sendPrompt).toHaveBeenCalled();

      // Verify usage was tracked with correct data
      expect(trackUsageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'educator_agent',
          operation: 'turn',
          promptTokens: 150,
          completionTokens: 80,
          tokens: 230,
          costUsd: 0.0023,
          userId,
          familyId: 'family-999',
          institutionId: 'inst-789',
          feature: 'educator_chat',
        }),
      );

      // Verify response includes usage
      expect(response.body.usage).toEqual(mockAiResponse.usage);
    });

    it('should not crash when AI service does not return usage metadata', async () => {
      // AI response without usage field
      const mockAiResponse = {
        threadId: 'thread-123',
        nextPrompt: 'AI response without usage',
        quickReplies: [],
        // NO usage field
      };

      mockAiServiceClient.sendPrompt.mockResolvedValue(mockAiResponse);

      const sessionId = 'test-session-123';

      jest.spyOn(prisma.readingSession, 'findUnique').mockResolvedValue({
        id: sessionId,
        userId: 'test-user',
        contentId: 'content-1',
      } as any);

      const trackUsageSpy = jest.spyOn(
        ProviderUsageService.prototype,
        'trackUsage',
      );

      await request(app.getHttpServer())
        .post(`/api/v1/sessions/reading/${sessionId}/prompt`)
        .send({
          promptMessage: {
            threadId: 'thread-123',
            text: 'Test',
            actorRole: 'LEARNER',
          },
        })
        .expect(HttpStatus.OK);

      // trackUsage should NOT be called
      expect(trackUsageSpy).not.toHaveBeenCalled();
    });

    it('should track usage even when user has no family', async () => {
      const mockAiResponse = {
        threadId: 'thread-123',
        nextPrompt: 'Response',
        usage: {
          prompt_tokens: 50,
          completion_tokens: 30,
          total_tokens: 80,
        },
      };

      mockAiServiceClient.sendPrompt.mockResolvedValue(mockAiResponse);

      const sessionId = 'session-solo';
      const userId = 'solo-user';

      jest.spyOn(prisma.readingSession, 'findUnique').mockResolvedValue({
        id: sessionId,
        userId,
        contentId: 'content-1',
      } as any);

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: userId,
        institutionId: null,
      } as any);

      // No family membership
      jest.spyOn(prisma.familyMember, 'findFirst').mockResolvedValue(null);

      const trackUsageSpy = jest.spyOn(
        ProviderUsageService.prototype,
        'trackUsage',
      );

      await request(app.getHttpServer())
        .post(`/api/v1/sessions/reading/${sessionId}/prompt`)
        .send({
          promptMessage: {
            threadId: 'thread-123',
            text: 'Test',
            actorRole: 'LEARNER',
          },
        })
        .expect(HttpStatus.OK);

      // Should still track, but with null familyId
      expect(trackUsageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          familyId: null,
          institutionId: null,
        }),
      );
    });
  });

  describe('Database Persistence', () => {
    it('should persist complete usage record to database', async () => {
      const usageData = {
        provider: 'educator_agent',
        operation: 'turn',
        tokens: 200,
        promptTokens: 120,
        completionTokens: 80,
        costUsd: 0.002,
        userId: 'db-user-123',
        familyId: 'db-family-456',
        institutionId: 'db-inst-789',
        feature: 'educator_chat',
        metadata: { sessionId: 'db-session-999' },
      };

      // Use actual Prisma to test database write
      const createdUsage = await prisma.providerUsage.create({
        data: {
          ...usageData,
          timestamp: new Date(),
        },
      });

      expect(createdUsage).toMatchObject({
        provider: 'educator_agent',
        promptTokens: 120,
        completionTokens: 80,
        totalTokens: 200,
        costUsd: 0.002,
        feature: 'educator_chat',
      });

      // Cleanup
      await prisma.providerUsage.delete({ where: { id: createdUsage.id } });
    });
  });
});
