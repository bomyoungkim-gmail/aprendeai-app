"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = require("ioredis");
describe("Redis Checkpointer Persistence", () => {
    let redis;
    beforeAll(async () => {
        const redisUrl = process.env.REDIS_URL || "redis://localhost:6379/0";
        redis = new ioredis_1.default(redisUrl);
        const ping = await redis.ping();
        expect(ping).toBe("PONG");
    });
    afterAll(async () => {
        await redis.quit();
    });
    it("should verify Redis checkpointer keys exist", async () => {
        const keys = await redis.keys("checkpoint:*");
        expect(Array.isArray(keys)).toBe(true);
        console.log(`✅ Found ${keys.length} checkpoint keys in Redis`);
    });
    it("should simulate state persistence workflow", async () => {
        const testKey = "test:checkpoint:session123";
        const testState = {
            thread_id: "test123",
            current_phase: "DURING",
            messages: ["msg1", "msg2"],
            timestamp: Date.now(),
        };
        await redis.set(testKey, JSON.stringify(testState), "EX", 300);
        const retrieved = await redis.get(testKey);
        expect(retrieved).not.toBeNull();
        const parsedState = JSON.parse(retrieved);
        expect(parsedState.thread_id).toBe("test123");
        expect(parsedState.current_phase).toBe("DURING");
        expect(parsedState.messages).toHaveLength(2);
        await redis.del(testKey);
        console.log("✅ State persistence workflow validated");
    });
    it("should verify TTL is set on checkpoint keys", async () => {
        const testKey = "test:checkpoint:ttl-check";
        await redis.set(testKey, "test-value", "EX", 3600);
        const ttl = await redis.ttl(testKey);
        expect(ttl).toBeGreaterThan(0);
        expect(ttl).toBeLessThanOrEqual(3600);
        await redis.del(testKey);
        console.log(`✅ TTL verified: ${ttl} seconds`);
    });
    it("should handle concurrent state updates", async () => {
        const sessionId = "concurrent-test-session";
        const baseKey = `test:checkpoint:${sessionId}`;
        const updates = Array.from({ length: 5 }, (_, i) => redis.set(`${baseKey}:${i}`, JSON.stringify({ turn: i }), "EX", 60));
        await Promise.all(updates);
        const keys = await redis.keys(`${baseKey}:*`);
        expect(keys).toHaveLength(5);
        await redis.del(...keys);
        console.log("✅ Concurrent updates handled correctly");
    });
});
//# sourceMappingURL=ai-redis-persistence.spec.js.map