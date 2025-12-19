import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LLMService } from './llm.service';
import { OpenAIProvider } from './providers/openai.provider';
import { DegradedModeProvider } from './providers/degraded.provider';

describe('LLMService', () => {
  let service: LLMService;
  let openaiProvider: OpenAIProvider;
  let degradedProvider: DegradedModeProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LLMService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                LLM_MAX_RETRIES: 3,
                LLM_RETRY_DELAY: 100, // Faster for tests
                OPENAI_API_KEY: 'test-key',
                OPENAI_MODEL: 'gpt-3.5-turbo',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
        {
          provide: OpenAIProvider,
          useValue: {
            name: 'openai',
            isAvailable: jest.fn(),
            generateText: jest.fn(),
            generateEmbedding: jest.fn(),
          },
        },
        {
          provide: DegradedModeProvider,
          useValue: {
            name: 'degraded',
            isAvailable: jest.fn().mockResolvedValue(true),
            generateText: jest.fn().mockResolvedValue({
              text: 'AI service temporarily unavailable',
              provider: 'degraded',
              model: 'none',
            }),
            generateEmbedding: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LLMService>(LLMService);
    openaiProvider = module.get<OpenAIProvider>(OpenAIProvider);
    degradedProvider = module.get<DegradedModeProvider>(DegradedModeProvider);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateText', () => {
    it('should use OpenAI when available', async () => {
      const mockResponse = {
        text: 'Generated text',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
      };

      jest.spyOn(openaiProvider, 'isAvailable').mockResolvedValue(true);
      jest.spyOn(openaiProvider, 'generateText').mockResolvedValue(mockResponse);

      const result = await service.generateText('test prompt');

      expect(result).toEqual(mockResponse);
      expect(openaiProvider.generateText).toHaveBeenCalledWith('test prompt', undefined);
    });

    it('should fallback to degraded mode when OpenAI fails', async () => {
      jest.spyOn(openaiProvider, 'isAvailable').mockResolvedValue(true);
      jest.spyOn(openaiProvider, 'generateText').mockRejectedValue(new Error('API Error'));

      const result = await service.generateText('test prompt', { allowDegraded: true });

      expect(result.provider).toBe('degraded');
      expect(degradedProvider.generateText).toHaveBeenCalled();
    });

    it('should retry 3 times before fallback', async () => {
      jest.spyOn(openaiProvider, 'isAvailable').mockResolvedValue(true);
      jest.spyOn(openaiProvider, 'generateText').mockRejectedValue(new Error('Transient error'));

      await service.generateText('test prompt', { allowDegraded: true });

      // 3 attempts with OpenAI, then degraded
      expect(openaiProvider.generateText).toHaveBeenCalledTimes(3);
    });

    it('should handle rate limit errors immediately', async () => {
      const rateLimitError = {
        status: 429,
        message: 'Rate limit exceeded',
      };

      jest.spyOn(openaiProvider, 'isAvailable').mockResolvedValue(true);
      jest.spyOn(openaiProvider, 'generateText').mockRejectedValue(rateLimitError);

      await service.generateText('test prompt', { allowDegraded: true });

      // Should only try once before moving to fallback
      expect(openaiProvider.generateText).toHaveBeenCalledTimes(1);
      expect(degradedProvider.generateText).toHaveBeenCalled();
    });

    it('should throw error when degraded mode not allowed', async () => {
      jest.spyOn(openaiProvider, 'isAvailable').mockResolvedValue(false);

      await expect(
        service.generateText('test prompt', { allowDegraded: false })
      ).rejects.toThrow('All LLM providers failed');
    });
  });

  describe('isAIAvailable', () => {
    it('should return true when OpenAI is available', async () => {
      jest.spyOn(openaiProvider, 'isAvailable').mockResolvedValue(true);

      const result = await service.isAIAvailable();

      expect(result).toBe(true);
    });

    it('should return false when only degraded mode is available', async () => {
      jest.spyOn(openaiProvider, 'isAvailable').mockResolvedValue(false);

      const result = await service.isAIAvailable();

      expect(result).toBe(false);
    });
  });
});
