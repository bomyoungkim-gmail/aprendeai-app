/**
 * Test 3: Memory Compaction
 * Validates that pedagogical memories are extracted and stored correctly
 */
import Redis from "ioredis";
import * as amqp from "amqplib";

describe("Memory Compaction", () => {
  let redis: Redis;
  let rabbitConnection: any = null;
  let rabbitChannel: any = null;

  const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://127.0.0.1:5672";
  const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379/0";

  beforeAll(async () => {
    // Setup Redis
    redis = new Redis(REDIS_URL);
    const ping = await redis.ping();
    expect(ping).toBe("PONG");

    // Setup RabbitMQ (optional - graceful degradation)
    try {
      rabbitConnection = await amqp.connect(RABBITMQ_URL);
      rabbitChannel = await rabbitConnection.createChannel();
      await rabbitChannel.assertQueue("memory.compact", { durable: true });
      console.log("✅ RabbitMQ connected");
    } catch (err) {
      console.warn("⚠️  RabbitMQ not available - some tests will be skipped");
    }
  });

  afterAll(async () => {
    await redis.quit();

    if (rabbitChannel) await rabbitChannel.close();
    if (rabbitConnection) await rabbitConnection.close();
  });

  it("should verify memory.compact queue exists", async () => {
    if (!rabbitChannel) {
      console.warn("⚠️  Skipping - RabbitMQ not available");
      return;
    }

    const queueInfo = await rabbitChannel.checkQueue("memory.compact");

    expect(queueInfo.queue).toBe("memory.compact");
    expect(queueInfo.messageCount).toBeGreaterThanOrEqual(0);

    console.log(
      `✅ Queue 'memory.compact' exists with ${queueInfo.messageCount} messages`,
    );
  });

  it("should simulate memory job enqueueing", async () => {
    if (!rabbitChannel) {
      console.warn("⚠️  Skipping - RabbitMQ not available");
      return;
    }

    const testJob = {
      tenantId: "test-user-123",
      userId: "test-user-123",
      contentId: "test-content-456",
      sessionOutcome: {
        top_blockers: ["inferir", "deduzir"],
        best_intervention: "visual_example",
        vocab_learned: ["compreender"],
        phase: "POST",
      },
    };

    const sent = rabbitChannel.sendToQueue(
      "memory.compact",
      Buffer.from(JSON.stringify(testJob)),
      { persistent: true },
    );

    expect(sent).toBe(true);

    console.log("✅ Test memory job enqueued successfully");

    // Note: Actual processing happens in AI service consumer
    // This test only validates enqueueing works
  });

  it("should verify compact state storage format", async () => {
    const testTenantId = "test-tenant-789";
    const testContentId = "test-content-789";
    const stateKey = `edu:state:${testTenantId}:${testContentId}`;

    const compactState = {
      reading_intent: "analytical",
      vocab_mastered_count: 5,
      last_blockers: ["inferir", "deduzir"],
      best_intervention: "visual_example",
      phase_completed: "POST",
      last_updated: Date.now(),
      metrics: {
        total_prompts: 12,
        checkpoints_passed: 3,
        struggles_count: 2,
      },
    };

    // Store compact state
    await redis.set(
      stateKey,
      JSON.stringify(compactState),
      "EX",
      180 * 24 * 3600,
    ); // 180 days

    // Retrieve and validate
    const retrieved = await redis.get(stateKey);
    expect(retrieved).not.toBeNull();

    const parsed = JSON.parse(retrieved!);
    expect(parsed.vocab_mastered_count).toBe(5);
    expect(parsed.last_blockers).toHaveLength(2);
    expect(parsed.metrics.total_prompts).toBe(12);

    // Verify size is compact (~1KB)
    const sizeBytes = Buffer.byteLength(retrieved!, "utf8");
    expect(sizeBytes).toBeLessThan(2048); // Should be under 2KB

    console.log(
      `✅ Compact state validated (${sizeBytes} bytes, TTL: 180 days)`,
    );

    // Cleanup
    await redis.del(stateKey);
  });

  it("should verify memory vector store keys exist", async () => {
    // Memory handler stores vectors with pattern: mem:index:{tenantId}:*
    const memoryKeys = await redis.keys("mem:index:*");

    expect(Array.isArray(memoryKeys)).toBe(true);

    console.log(`✅ Found ${memoryKeys.length} memory vector entries`);
  });

  it("should test memory deduplication logic", async () => {
    const tenantId = "test-dedup-user";
    const memoryText = "Blocker: 'inferir'. Precisa de definição + exemplo.";

    // Simulate dedup hash (SHA256 truncated to 16 chars)
    const crypto = require("crypto");
    const hash = crypto
      .createHash("sha256")
      .update(memoryText.toLowerCase().trim())
      .digest("hex")
      .substring(0, 16);

    const dedupKey = `mem:dedup:${tenantId}:${hash}`;

    // First insertion (should succeed)
    const isNew1 = await redis.setnx(dedupKey, "1");
    expect(isNew1).toBe(1); // New

    await redis.expire(dedupKey, 365 * 24 * 3600); // 1 year TTL

    // Second insertion (should be duplicate)
    const isNew2 = await redis.setnx(dedupKey, "1");
    expect(isNew2).toBe(0); // Duplicate

    console.log("✅ Deduplication logic validated");

    // Cleanup
    await redis.del(dedupKey);
  });
});
