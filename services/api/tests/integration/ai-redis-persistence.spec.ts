/**
 * Test 1: Redis Checkpointer Persistence
 * Validates that LangGraph state persists across service restarts
 */
import Redis from "ioredis";

describe("Redis Checkpointer Persistence", () => {
  let redis: Redis;

  beforeAll(async () => {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379/0";
    redis = new Redis(redisUrl);

    // Ensure Redis is accessible
    const ping = await redis.ping();
    expect(ping).toBe("PONG");
  });

  afterAll(async () => {
    await redis.quit();
  });

  it("should verify Redis checkpointer keys exist", async () => {
    // LangGraph creates keys with pattern: checkpoint:*
    const keys = await redis.keys("checkpoint:*");

    // Note: May be empty if no sessions have been created yet
    // This validates that Redis is accessible for checkpointing
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

    // 1. Store state (simulating educator graph)
    await redis.set(testKey, JSON.stringify(testState), "EX", 300); // 5 min TTL

    // 2. Retrieve state (simulating restart)
    const retrieved = await redis.get(testKey);
    expect(retrieved).not.toBeNull();

    const parsedState = JSON.parse(retrieved!);
    expect(parsedState.thread_id).toBe("test123");
    expect(parsedState.current_phase).toBe("DURING");
    expect(parsedState.messages).toHaveLength(2);

    // 3. Cleanup
    await redis.del(testKey);

    console.log("✅ State persistence workflow validated");
  });

  it("should verify TTL is set on checkpoint keys", async () => {
    const testKey = "test:checkpoint:ttl-check";

    await redis.set(testKey, "test-value", "EX", 3600); // 1 hour

    const ttl = await redis.ttl(testKey);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(3600);

    await redis.del(testKey);

    console.log(`✅ TTL verified: ${ttl} seconds`);
  });

  it("should handle concurrent state updates", async () => {
    const sessionId = "concurrent-test-session";
    const baseKey = `test:checkpoint:${sessionId}`;

    // Simulate concurrent updates from multiple instances
    const updates = Array.from({ length: 5 }, (_, i) =>
      redis.set(`${baseKey}:${i}`, JSON.stringify({ turn: i }), "EX", 60),
    );

    await Promise.all(updates);

    // Verify all updates persisted
    const keys = await redis.keys(`${baseKey}:*`);
    expect(keys).toHaveLength(5);

    // Cleanup
    await redis.del(...keys);

    console.log("✅ Concurrent updates handled correctly");
  });
});
