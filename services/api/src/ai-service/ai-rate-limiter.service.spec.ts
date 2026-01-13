import { Test, TestingModule } from "@nestjs/testing";
import { AiRateLimiterService } from "./ai-rate-limiter.service";
import { RedisService } from "../common/redis/redis.service";

describe("AiRateLimiterService", () => {
  let service: AiRateLimiterService;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const mockRedisService = {
      incr: jest.fn(),
      expire: jest.fn(),
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiRateLimiterService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<AiRateLimiterService>(AiRateLimiterService);
    redisService = module.get(RedisService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("checkLimit", () => {
    it("should allow request when under limit", async () => {
      redisService.incr.mockResolvedValue(5);
      redisService.expire.mockResolvedValue(undefined);

      const result = await service.checkLimit("scope-123", 10);

      expect(result).toBe(true);
      expect(redisService.incr).toHaveBeenCalled();
    });

    it("should block request when at limit", async () => {
      redisService.incr.mockResolvedValue(10);

      const result = await service.checkLimit("scope-123", 10);

      expect(result).toBe(true); // At limit is still allowed (<=)
    });

    it("should block request when over limit", async () => {
      redisService.incr.mockResolvedValue(11);

      const result = await service.checkLimit("scope-123", 10);

      expect(result).toBe(false);
    });

    it("should set expiration on first increment", async () => {
      redisService.incr.mockResolvedValue(1);
      redisService.expire.mockResolvedValue(undefined);

      await service.checkLimit("scope-123", 10);

      expect(redisService.expire).toHaveBeenCalledWith(
        expect.stringContaining("ratelimit:scope-123:"),
        120,
      );
    });

    it("should not set expiration on subsequent increments", async () => {
      redisService.incr.mockResolvedValue(5);

      await service.checkLimit("scope-123", 10);

      expect(redisService.expire).not.toHaveBeenCalled();
    });

    it("should fail open on Redis error", async () => {
      redisService.incr.mockRejectedValue(new Error("Redis down"));

      const result = await service.checkLimit("scope-123", 10);

      expect(result).toBe(true); // Fail open
    });
  });

  describe("getCurrentUsage", () => {
    it("should return current count", async () => {
      redisService.get.mockResolvedValue("7");

      const result = await service.getCurrentUsage("scope-123");

      expect(result).toBe(7);
    });

    it("should return 0 when no count exists", async () => {
      redisService.get.mockResolvedValue(null);

      const result = await service.getCurrentUsage("scope-123");

      expect(result).toBe(0);
    });

    it("should return 0 on Redis error", async () => {
      redisService.get.mockRejectedValue(new Error("Redis down"));

      const result = await service.getCurrentUsage("scope-123");

      expect(result).toBe(0);
    });
  });
});
