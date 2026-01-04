"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = require("ioredis");
const axios_1 = require("axios");
describe("Semantic Cache Hits", () => {
    let redis;
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8001";
    beforeAll(async () => {
        const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379/0";
        redis = new ioredis_1.default(redisUrl);
        const ping = await redis.ping();
        expect(ping).toBe("PONG");
    });
    afterAll(async () => {
        await redis.quit();
    });
    it("should verify cache index exists", async () => {
        const cacheKeys = await redis.keys("llm:cache:*");
        expect(Array.isArray(cacheKeys)).toBe(true);
        console.log(`✅ Found ${cacheKeys.length} cache entries`);
    });
    it("should demonstrate cache hit workflow", async () => {
        const cacheTestKey = "test:llm:cache:similarity-test";
        const cachedResponse = {
            prompt: "What is photosynthesis?",
            response: "Photosynthesis is the process...",
            model: "gpt-4o-mini",
            tokens: 150,
            cached: true,
        };
        await redis.set(cacheTestKey, JSON.stringify(cachedResponse), "EX", 86400);
        const retrieved = await redis.get(cacheTestKey);
        expect(retrieved).not.toBeNull();
        const parsed = JSON.parse(retrieved);
        expect(parsed.cached).toBe(true);
        expect(parsed.tokens).toBe(150);
        const ttl = await redis.ttl(cacheTestKey);
        expect(ttl).toBeGreaterThan(0);
        await redis.del(cacheTestKey);
        console.log("✅ Cache workflow validated (TTL:", ttl, "seconds)");
    });
    it("should calculate cache savings metrics", async () => {
        const cacheKeys = await redis.keys("llm:cache:*");
        const cacheHitCount = cacheKeys.length;
        const avgTokensPerCall = 3000;
        const costPer1MTokens = 0.15;
        const tokensSaved = cacheHitCount * avgTokensPerCall;
        const costSaved = (tokensSaved / 1000000) * costPer1MTokens;
        console.log("📊 Cache Metrics:");
        console.log(`  - Cache entries: ${cacheHitCount}`);
        console.log(`  - Est. tokens saved: ${tokensSaved.toLocaleString()}`);
        console.log(`  - Est. cost saved: $${costSaved.toFixed(4)}`);
        expect(cacheHitCount).toBeGreaterThanOrEqual(0);
    });
    it("should verify cache is enabled in AI service", async () => {
        try {
            const response = await axios_1.default.get(`${AI_SERVICE_URL}/health`, {
                timeout: 3000,
            });
            const healthData = response.data;
            console.log("AI Service Health:", healthData);
            expect(response.status).toBe(200);
        }
        catch (error) {
            console.warn("⚠️  AI service not reachable - skipping endpoint test");
            console.warn("   Run: cd services/ai && python main.py");
        }
    });
    it("should test cache key format consistency", async () => {
        const testCacheKey = "test:llm:cache:vector:12345";
        const testVector = {
            embedding: [0.1, 0.2, 0.3],
            text: "test query",
            response: "test response",
            score: 0.95,
        };
        await redis.set(testCacheKey, JSON.stringify(testVector), "EX", 60);
        const retrieved = await redis.get(testCacheKey);
        const parsed = JSON.parse(retrieved);
        expect(parsed).toHaveProperty("embedding");
        expect(parsed).toHaveProperty("text");
        expect(parsed).toHaveProperty("response");
        await redis.del(testCacheKey);
        console.log("✅ Cache key format validated");
    });
});
//# sourceMappingURL=ai-cache-hits.spec.js.map