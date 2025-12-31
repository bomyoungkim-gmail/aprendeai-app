import { Test, TestingModule } from "@nestjs/testing";
import { LLMConfigService } from "./llm-config.service";
import { PrismaService } from "../prisma/prisma.service";

describe("LLMConfigService", () => {
  let service: LLMConfigService;
  let prismaService: PrismaService;

  const mockPrisma = {
    appConfig: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LLMConfigService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<LLMConfigService>(LLMConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getModelName", () => {
    it("should return model from database when available", async () => {
      mockPrisma.appConfig.findUnique.mockResolvedValue({
        id: "1",
        key: "llm.openai.model",
        value: "gpt-4-turbo",
      });

      const model = await service.getModelName("openai");
      expect(model).toBe("gpt-4-turbo");
      expect(mockPrisma.appConfig.findUnique).toHaveBeenCalledWith({
        where: { key: "llm.openai.model" },
      });
    });

    it("should return environment variable when database has no config", async () => {
      mockPrisma.appConfig.findUnique.mockResolvedValue(null);
      process.env.OPENAI_MODEL = "gpt-3.5-turbo";

      const model = await service.getModelName("openai");
      expect(model).toBe("gpt-3.5-turbo");
    });

    it("should return default value when no config or env var exists", async () => {
      mockPrisma.appConfig.findUnique.mockResolvedValue(null);
      delete process.env.OPENAI_MODEL;

      const model = await service.getModelName("openai");
      expect(model).toBe("gpt-4"); // Default
    });

    it("should use cache on subsequent calls", async () => {
      mockPrisma.appConfig.findUnique.mockResolvedValue({
        id: "1",
        key: "llm.gemini.model",
        value: "gemini-1.5-flash",
      });

      await service.getModelName("gemini");
      await service.getModelName("gemini"); // Second call

      // Should only call DB once due to cache
      expect(mockPrisma.appConfig.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe("clearCache", () => {
    it("should clear all cache when no provider specified", () => {
      service.clearCache();
      // Cache should be empty
      expect(service["cache"].size).toBe(0);
    });

    it("should clear specific provider cache", async () => {
      // Populate cache
      mockPrisma.appConfig.findUnique.mockResolvedValue({
        key: "llm.openai.model",
        value: "gpt-4",
      });
      await service.getModelName("openai");

      service.clearCache("openai");

      // Next call should hit DB again
      await service.getModelName("openai");
      expect(mockPrisma.appConfig.findUnique).toHaveBeenCalledTimes(2);
    });
  });
});
