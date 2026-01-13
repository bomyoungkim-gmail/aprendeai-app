import { Test, TestingModule } from "@nestjs/testing";
import { ExtractMetadataUseCase } from "./extract-metadata.use-case";
import { PrismaService } from "../../../prisma/prisma.service";
import { RedisService } from "../../../common/redis/redis.service";
import { ITransferMetadataRepository } from "../../domain/transfer-metadata.repository.interface";
import { AiServiceClient } from "../../../ai-service/ai-service.client";
import { TelemetryService } from "../../../telemetry/telemetry.service";

describe("ExtractMetadataUseCase", () => {
  let useCase: ExtractMetadataUseCase;
  let redisService: jest.Mocked<RedisService>;
  let repository: jest.Mocked<ITransferMetadataRepository>;

  // Create mock functions for Prisma
  const mockContentVersionsFindFirst = jest.fn();
  const mockLearningAssetsFindFirst = jest.fn();
  const mockContentChunksFindUnique = jest.fn();
  const mockHighlightsFindMany = jest.fn();
  const mockCornellNotesFindMany = jest.fn();
  const mockContentsFindUnique = jest.fn();

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExtractMetadataUseCase,
        {
          provide: PrismaService,
          useValue: {
            content_versions: {
              findFirst: mockContentVersionsFindFirst,
            },
            learning_assets: {
              findFirst: mockLearningAssetsFindFirst,
            },
            content_chunks: {
              findUnique: mockContentChunksFindUnique,
            },
            highlights: {
              findMany: mockHighlightsFindMany,
            },
            cornell_notes: {
              findMany: mockCornellNotesFindMany,
            },
            contents: {
              findUnique: mockContentsFindUnique,
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: ITransferMetadataRepository,
          useValue: {
            findByContentAndChunk: jest.fn(),
            upsert: jest.fn(),
            findManyByContent: jest.fn(),
          },
        },
        {
          provide: AiServiceClient,
          useValue: {
            extractTransferMetadata: jest.fn(),
          },
        },
        {
          provide: TelemetryService,
          useValue: {
            track: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<ExtractMetadataUseCase>(ExtractMetadataUseCase);
    redisService = module.get(RedisService) as jest.Mocked<RedisService>;
    repository = module.get(
      ITransferMetadataRepository,
    ) as jest.Mocked<ITransferMetadataRepository>;
  });

  describe("Cache Hit", () => {
    it("should return cached metadata when cache hit occurs", async () => {
      const cachedData = {
        conceptJson: { principle: "Test principle", keywords: ["test"] },
        tier2Json: ["word1", "word2"],
        analogiesJson: [],
        domainsJson: [],
      };

      redisService.get.mockResolvedValue(cachedData);

      const result = await useCase.execute({
        contentId: "content-1",
        chunkId: "chunk-1",
        scopeType: "USER",
      });

      expect(redisService.get).toHaveBeenCalled();
      expect(result.metadata.concept).toEqual(cachedData.conceptJson);
      expect(result.metadata.tier2).toEqual(cachedData.tier2Json);
      expect(result.cacheHitCount).toBe(1);
      expect(result.channel).toBe("CACHED_LLM");
      expect(mockContentVersionsFindFirst).not.toHaveBeenCalled();
    });
  });

  describe("Deterministic Tier 2 Extraction", () => {
    it("should extract Tier 2 vocabulary from content_versions.vocabulary_glossary", async () => {
      redisService.get.mockResolvedValue(null);
      repository.findByContentAndChunk.mockResolvedValue(null);

      mockContentVersionsFindFirst.mockResolvedValue({
        vocabulary_glossary: [
          { term: "photosynthesis" },
          { term: "chlorophyll" },
          { term: "glucose" },
        ],
      } as any);

      mockContentChunksFindUnique.mockResolvedValue({
        text: "Photosynthesis is the process by which plants make food.",
      } as any);

      repository.upsert.mockResolvedValue({
        id: "test-id",
        contentId: "content-1",
        tier2Json: ["photosynthesis", "chlorophyll", "glucose"],
      } as any);

      const result = await useCase.execute({
        contentId: "content-1",
        chunkId: "chunk-1",
        scopeType: "USER",
      });

      expect(result.metadata.tier2).toContain("photosynthesis");
      expect(result.metadata.tier2).toContain("chlorophyll");
      expect(result.cacheHitCount).toBe(0);
      expect(redisService.set).toHaveBeenCalled();
    });

    it("should fallback to learning_assets.glossary_json when content_versions is empty", async () => {
      redisService.get.mockResolvedValue(null);
      repository.findByContentAndChunk.mockResolvedValue(null);

      mockContentVersionsFindFirst.mockResolvedValue(null);
      mockLearningAssetsFindFirst.mockResolvedValue({
        glossary_json: [{ word: "mitochondria" }, { word: "respiration" }],
      } as any);

      mockContentChunksFindUnique.mockResolvedValue({
        text: "Mitochondria are the powerhouse of the cell.",
      } as any);

      repository.upsert.mockResolvedValue({
        id: "test-id",
        tier2Json: ["mitochondria", "respiration"],
      } as any);

      const result = await useCase.execute({
        contentId: "content-1",
        chunkId: "chunk-1",
        scopeType: "USER",
      });

      expect(result.metadata.tier2).toContain("mitochondria");
      expect(result.metadata.tier2).toContain("respiration");
    });
  });

  describe("Heuristic Concept Extraction (Text)", () => {
    it("should extract concept from text using first sentence heuristic", async () => {
      redisService.get.mockResolvedValue(null);
      repository.findByContentAndChunk.mockResolvedValue(null);

      mockContentVersionsFindFirst.mockResolvedValue(null);
      mockLearningAssetsFindFirst.mockResolvedValue(null);

      mockContentChunksFindUnique.mockResolvedValue({
        text: "Photosynthesis converts light energy into chemical energy. Plants use chlorophyll to capture sunlight. This process produces glucose and oxygen.",
      } as any);

      repository.upsert.mockResolvedValue({
        id: "test-id",
        conceptJson: {
          principle:
            "Photosynthesis converts light energy into chemical energy",
          keywords: expect.any(Array),
        },
      } as any);

      const result = await useCase.execute({
        contentId: "content-1",
        chunkId: "chunk-1",
        scopeType: "USER",
      });

      expect(result.metadata.concept.principle).toContain("Photosynthesis");
      expect(result.metadata.concept.keywords).toBeDefined();
    });

    it("should extract capitalized terms as keywords", async () => {
      redisService.get.mockResolvedValue(null);
      repository.findByContentAndChunk.mockResolvedValue(null);

      mockContentVersionsFindFirst.mockResolvedValue(null);
      mockLearningAssetsFindFirst.mockResolvedValue(null);

      mockContentChunksFindUnique.mockResolvedValue({
        text: "Albert Einstein developed the Theory of Relativity. Isaac Newton discovered Universal Gravitation.",
      } as any);

      repository.upsert.mockResolvedValue({
        id: "test-id",
        conceptJson: {
          principle: expect.any(String),
          keywords: ["Albert Einstein", "Theory", "Isaac Newton", "Universal"],
        },
      } as any);

      const result = await useCase.execute({
        contentId: "content-1",
        chunkId: "chunk-1",
        scopeType: "USER",
      });

      expect(result.metadata.concept.keywords).toEqual(
        expect.arrayContaining(["Albert Einstein", "Theory"]),
      );
    });
  });

  describe("Heuristic Concept Extraction (Annotations - PDF)", () => {
    it("should extract concept from highlights with MAIN_IDEA tag", async () => {
      redisService.get.mockResolvedValue(null);
      repository.findByContentAndChunk.mockResolvedValue(null);

      mockContentVersionsFindFirst.mockResolvedValue(null);
      mockLearningAssetsFindFirst.mockResolvedValue(null);
      mockContentChunksFindUnique.mockResolvedValue(null);

      mockHighlightsFindMany.mockResolvedValue([
        {
          comment_text: "DNA stores genetic information",
          tags_json: ["MAIN_IDEA"],
        },
        {
          comment_text: "Supporting detail",
          tags_json: ["EVIDENCE"],
        },
      ] as any);

      mockCornellNotesFindMany.mockResolvedValue([
        {
          cues_json: ["genetics", "heredity"],
          summary_text: "DNA is the blueprint of life",
        },
      ] as any);

      repository.upsert.mockResolvedValue({
        id: "test-id",
        conceptJson: {
          principle: "DNA stores genetic information",
          keywords: ["genetics", "heredity"],
        },
      } as any);

      const result = await useCase.execute({
        contentId: "content-1",
        pageNumber: 5,
        scopeType: "USER",
      });

      expect(result.metadata.concept.principle).toBe(
        "DNA stores genetic information",
      );
      expect(result.metadata.concept.keywords).toContain("genetics");
    });

    it("should fallback to Cornell notes summary when no MAIN_IDEA highlights", async () => {
      redisService.get.mockResolvedValue(null);
      repository.findByContentAndChunk.mockResolvedValue(null);

      mockContentVersionsFindFirst.mockResolvedValue(null);
      mockLearningAssetsFindFirst.mockResolvedValue(null);
      mockContentChunksFindUnique.mockResolvedValue(null);

      mockHighlightsFindMany.mockResolvedValue([]);

      mockCornellNotesFindMany.mockResolvedValue([
        {
          cues_json: ["evolution", "adaptation"],
          summary_text: "Natural selection drives evolution",
        },
      ] as any);

      repository.upsert.mockResolvedValue({
        id: "test-id",
        conceptJson: {
          principle: "Natural selection drives evolution",
          keywords: ["evolution", "adaptation"],
        },
      } as any);

      const result = await useCase.execute({
        contentId: "content-1",
        pageNumber: 10,
        scopeType: "USER",
      });

      expect(result.metadata.concept.principle).toBe(
        "Natural selection drives evolution",
      );
    });
  });

  describe("Cache Key Generation", () => {
    it("should generate correct cache key with all parameters", async () => {
      redisService.get.mockResolvedValue(null);
      repository.findByContentAndChunk.mockResolvedValue(null);
      mockContentVersionsFindFirst.mockResolvedValue(null);
      mockLearningAssetsFindFirst.mockResolvedValue(null);
      mockContentChunksFindUnique.mockResolvedValue({
        text: "Test",
      } as any);
      repository.upsert.mockResolvedValue({} as any);

      await useCase.execute({
        contentId: "content-123",
        chunkId: "chunk-456",
        scopeType: "FAMILY",
        educationLevel: "MEDIO",
        language: "en",
      });

      expect(redisService.get).toHaveBeenCalledWith(
        "transfer:metadata:content-123:chunk-456:MEDIO:en:FAMILY:1.0.0",
      );
    });

    it("should use defaults for missing optional parameters in cache key", async () => {
      redisService.get.mockResolvedValue(null);
      repository.findByContentAndChunk.mockResolvedValue(null);
      mockContentVersionsFindFirst.mockResolvedValue(null);
      mockLearningAssetsFindFirst.mockResolvedValue(null);
      mockContentChunksFindUnique.mockResolvedValue({
        text: "Test",
      } as any);
      repository.upsert.mockResolvedValue({} as any);

      await useCase.execute({
        contentId: "content-123",
        chunkIndex: 5,
        scopeType: "USER",
      });

      expect(redisService.get).toHaveBeenCalledWith(
        "transfer:metadata:content-123:idx_5:default:pt:USER:1.0.0",
      );
    });
  });

  describe("DB Caching", () => {
    it("should cache existing DB result when found", async () => {
      redisService.get.mockResolvedValue(null);

      const existingMetadata = {
        id: "existing-id",
        contentId: "content-1",
        conceptJson: { principle: "Existing principle" },
        tier2Json: ["existing", "words"],
      };

      repository.findByContentAndChunk.mockResolvedValue(
        existingMetadata as any,
      );

      const result = await useCase.execute({
        contentId: "content-1",
        chunkId: "chunk-1",
        scopeType: "USER",
      });

      expect(redisService.set).toHaveBeenCalledWith(
        expect.any(String),
        {
          conceptJson: existingMetadata.conceptJson,
          tier2Json: existingMetadata.tier2Json,
          analogiesJson: undefined,
          domainsJson: undefined,
        },
        604800,
      );
      expect(result.cacheHitCount).toBe(0);
      expect(result.channel).toBe("DETERMINISTIC");
    });
  });

  // PATCH 04v2: LLM Fallback Tests
  describe("LLM Fallback (PATCH 04v2)", () => {
    let mockAiService: any;
    let mockTelemetryService: any;

    beforeEach(() => {
      mockAiService = {
        extractTransferMetadata: jest.fn(),
      };
      mockTelemetryService = {
        track: jest.fn(),
      };

      // Inject mocks into useCase
      (useCase as any).aiService = mockAiService;
      (useCase as any).telemetryService = mockTelemetryService;
    });

    it("should call LLM when analogies are empty and allowLLM is true", async () => {
      // Setup: No cache, no existing metadata
      redisService.get.mockResolvedValue(null);
      repository.findByContentAndChunk.mockResolvedValue(null);

      // Mock deterministic extraction returns empty analogies
      mockContentVersionsFindFirst.mockResolvedValue(null);
      mockLearningAssetsFindFirst.mockResolvedValue(null);
      mockContentChunksFindUnique.mockResolvedValue({
        text: "Test chunk text",
      });
      mockHighlightsFindMany.mockResolvedValue([]);
      mockCornellNotesFindMany.mockResolvedValue([]);
      mockContentsFindUnique.mockResolvedValue({
        metadata: {},
      });

      // Mock LLM response
      mockAiService.extractTransferMetadata.mockResolvedValue({
        analogies: [
          {
            source_domain: "Computer",
            target_domain: "Brain",
            mapping: "CPU is like neurons",
          },
        ],
        domains: ["Computer Science", "Neuroscience"],
        tokensUsed: 150,
      });

      const result = await useCase.execute({
        contentId: "content-1",
        chunkId: "chunk-1",
        scopeType: "USER",
        userId: "user-123",
        fallbackConfig: {
          allowLLM: true,
          caps: { maxTokens: 1000, modelTier: "flash" },
          phase: "POST",
        },
      });

      // Verify LLM was called
      expect(mockAiService.extractTransferMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          contentId: "content-1",
          mode: "transfer_metadata",
          output: {
            need: ["analogies", "domains"],
            maxItems: { analogies: 2, domains: 3 },
          },
        }),
      );

      // Verify telemetry
      expect(mockTelemetryService.track).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "transfer_llm_fallback_triggered",
        }),
        "user-123",
      );

      // Verify result
      expect(result.usedLLMCount).toBe(1);
      expect(result.channel).toBe("LLM");
      expect(result.metadata.analogies).toHaveLength(1);
      expect(result.metadata.domains).toEqual([
        "Computer Science",
        "Neuroscience",
      ]);
    });

    it("should use LLM cache when available", async () => {
      // Setup: No main cache, no existing metadata
      redisService.get
        .mockResolvedValueOnce(null) // Main cache miss
        .mockResolvedValueOnce({
          // LLM cache hit
          analogies: [{ source_domain: "A", target_domain: "B", mapping: "X" }],
          domains: ["Domain1"],
        });

      repository.findByContentAndChunk.mockResolvedValue(null);

      // Mock deterministic extraction returns empty
      mockContentVersionsFindFirst.mockResolvedValue(null);
      mockLearningAssetsFindFirst.mockResolvedValue(null);
      mockContentChunksFindUnique.mockResolvedValue({ text: "Test" });
      mockHighlightsFindMany.mockResolvedValue([]);
      mockCornellNotesFindMany.mockResolvedValue([]);
      mockContentsFindUnique.mockResolvedValue({ metadata: {} });

      const result = await useCase.execute({
        contentId: "content-1",
        chunkId: "chunk-1",
        scopeType: "USER",
        userId: "user-123",
        fallbackConfig: {
          allowLLM: true,
          caps: { maxTokens: 1000, modelTier: "flash" },
        },
      });

      // Verify LLM was NOT called (cache hit)
      expect(mockAiService.extractTransferMetadata).not.toHaveBeenCalled();

      // Verify telemetry shows cache hit
      expect(mockTelemetryService.track).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "transfer_llm_fallback_triggered",
          data: expect.objectContaining({
            cacheHit: true,
          }),
        }),
        "user-123",
      );

      // Verify result
      expect(result.cacheHitCount).toBe(1);
      expect(result.channel).toBe("CACHED_LLM");
    });

    it("should emit denied telemetry when allowLLM is false", async () => {
      // Setup
      redisService.get.mockResolvedValue(null);
      repository.findByContentAndChunk.mockResolvedValue(null);

      // Mock deterministic extraction returns empty
      mockContentVersionsFindFirst.mockResolvedValue(null);
      mockLearningAssetsFindFirst.mockResolvedValue(null);
      mockContentChunksFindUnique.mockResolvedValue({ text: "Test" });
      mockHighlightsFindMany.mockResolvedValue([]);
      mockCornellNotesFindMany.mockResolvedValue([]);
      mockContentsFindUnique.mockResolvedValue({ metadata: {} });

      const result = await useCase.execute({
        contentId: "content-1",
        chunkId: "chunk-1",
        scopeType: "USER",
        userId: "user-123",
        fallbackConfig: {
          allowLLM: false,
        },
      });

      // Verify LLM was NOT called
      expect(mockAiService.extractTransferMetadata).not.toHaveBeenCalled();

      // Verify denied telemetry
      expect(mockTelemetryService.track).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "transfer_llm_fallback_denied",
          data: expect.objectContaining({
            reason: "policy/budget",
          }),
        }),
        "user-123",
      );

      // Verify result uses deterministic channel
      expect(result.usedLLMCount).toBe(0);
      expect(result.channel).toBe("DETERMINISTIC");
    });

    it("should not call LLM when analogies/domains are already present", async () => {
      // Setup: Return existing metadata from DB (already has analogies/domains)
      redisService.get.mockResolvedValue(null);
      repository.findByContentAndChunk.mockResolvedValue({
        id: "meta-1",
        contentId: "content-1",
        chunkId: "chunk-1",
        conceptJson: { principle: "Test" },
        tier2Json: ["word1"],
        analogiesJson: ["existing analogy"],
        domainsJson: ["existing domain"],
        version: "1.0.0",
        scopeType: "USER",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await useCase.execute({
        contentId: "content-1",
        chunkId: "chunk-1",
        scopeType: "USER",
        userId: "user-123",
        fallbackConfig: {
          allowLLM: true,
          caps: { maxTokens: 1000, modelTier: "flash" },
        },
      });

      // Verify LLM was NOT called (DB already had results)
      expect(mockAiService.extractTransferMetadata).not.toHaveBeenCalled();

      // Verify no telemetry events (no fallback needed)
      expect(mockTelemetryService.track).not.toHaveBeenCalled();

      // Verify result uses existing data
      expect(result.usedLLMCount).toBe(0);
      expect(result.channel).toBe("DETERMINISTIC");
      expect(result.metadata.analogies).toEqual(["existing analogy"]);
      expect(result.metadata.domains).toEqual(["existing domain"]);
    });
  });
});
