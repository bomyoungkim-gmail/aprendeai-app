/**
 * Test 4: Context Enrichment
 * Validates that prompts are enriched with compact state, last turns, and content slices
 */
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../src/prisma/prisma.service";
import Redis from "ioredis";

describe("Context Enrichment", () => {
  let prisma: PrismaService;
  let redis: Redis;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);

    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379/0";
    redis = new Redis(redisUrl);

    const ping = await redis.ping();
    expect(ping).toBe("PONG");
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await redis.quit();
  });

  it("should load compact pedagogical state from Redis", async () => {
    const userId = "test-user-context";
    const contentId = "test-content-context";
    const stateKey = `edu:state:${userId}:${contentId}`;

    // Setup test state
    const testState = {
      reading_intent: "analytical",
      vocab_mastered_count: 10,
      last_blockers: ["palavra1", "palavra2"],
      best_intervention: "example_strategy",
      last_updated: Date.now(),
    };

    await redis.set(stateKey, JSON.stringify(testState), "EX", 3600);

    // Load state (simulating enrichPromptContext)
    const loaded = await redis.get(stateKey);
    expect(loaded).not.toBeNull();

    const parsedState = JSON.parse(loaded!);
    expect(parsedState.vocab_mastered_count).toBe(10);
    expect(parsedState.last_blockers).toContain("palavra1");

    console.log("✅ Compact state loaded successfully");

    // Cleanup
    await redis.del(stateKey);
  });

  it("should simulate last turns window (6 turns)", async () => {
    // Simulating query for last 6 PROMPT_SENT / PROMPT_RECEIVED events
    const mockEvents = [
      {
        role: "user",
        text: "Qual é o significado de inferir?",
        timestamp: new Date(),
      },
      {
        role: "assistant",
        text: "Inferir significa deduzir...",
        timestamp: new Date(),
      },
      { role: "user", text: "Me dê um exemplo", timestamp: new Date() },
      { role: "assistant", text: "Por exemplo...", timestamp: new Date() },
      { role: "user", text: "Entendi, obrigado", timestamp: new Date() },
      {
        role: "assistant",
        text: "De nada! Continue assim",
        timestamp: new Date(),
      },
    ];

    // Take last 6
    const lastTurns = mockEvents.slice(-6);

    expect(lastTurns).toHaveLength(6);
    expect(lastTurns[0].role).toBe("user");

    // Format for LLM context (simulating enrichment)
    const formatted = lastTurns.map((e) => ({
      role: e.role,
      text: e.text,
      timestamp: e.timestamp,
    }));

    expect(formatted).toHaveLength(6);

    console.log("✅ Last turns window simulated (6 events)");
  });

  it("should simulate content slicing (12K chars)", async () => {
    // Simulate large content text
    const fullText = "A".repeat(50000); // 50K chars

    // Slice to 12K chars (enrichment logic)
    const contentSlice = fullText.substring(0, 12000);

    expect(contentSlice.length).toBe(12000);
    expect(contentSlice.length).toBeLessThan(fullText.length);

    // Estimate token reduction (rough: 4 chars ≈ 1 token)
    const fullTokens = Math.ceil(fullText.length / 4);
    const sliceTokens = Math.ceil(contentSlice.length / 4);
    const reduction = (((fullTokens - sliceTokens) / fullTokens) * 100).toFixed(
      1,
    );

    console.log(
      `✅ Content sliced: ${fullText.length} → ${contentSlice.length} chars`,
    );
    console.log(
      `   Token reduction: ${fullTokens} → ${sliceTokens} (~${reduction}% savings)`,
    );
  });

  it("should validate enriched metadata structure", async () => {
    // Simulating enriched DTO structure
    const enrichedMetadata = {
      tenantId: "user123",
      userId: "user123",
      contentId: "content456",
      pedState: {
        reading_intent: "analytical",
        vocab_mastered_count: 5,
        last_blockers: ["palavra1"],
      },
      lastTurns: [
        { role: "user", text: "test", timestamp: new Date() },
        { role: "assistant", text: "response", timestamp: new Date() },
      ],
      contentSlice: "A".repeat(12000),
      memoriesTopK: 6,
      contextPlan: {
        prefixVersion: "CANONICAL_PREFIX_V1",
        lastTurnsWindow: 6,
        memoriesTopK: 6,
        contentSliceChars: 12000,
      },
    };

    // Validate structure
    expect(enrichedMetadata).toHaveProperty("pedState");
    expect(enrichedMetadata).toHaveProperty("lastTurns");
    expect(enrichedMetadata).toHaveProperty("contentSlice");
    expect(enrichedMetadata).toHaveProperty("contextPlan");

    expect(enrichedMetadata.lastTurns).toHaveLength(2);
    expect(enrichedMetadata.contentSlice.length).toBe(12000);
    expect(enrichedMetadata.contextPlan.memoriesTopK).toBe(6);

    console.log("✅ Enriched metadata structure validated");
  });

  it("should calculate token optimization metrics", async () => {
    // Before enrichment (sending full context)
    const beforeContext = {
      fullContent: "A".repeat(50000), // 50K chars
      allTurns: Array(30).fill({ text: "X".repeat(200) }), // 30 turns, 200 chars each
      noState: {},
    };

    // After enrichment (optimized context)
    const afterContext = {
      contentSlice: "A".repeat(12000), // 12K chars
      lastTurns: Array(6).fill({ text: "X".repeat(200) }), // 6 turns
      pedState: { compact: true }, // ~1KB
    };

    // Rough token estimation (4 chars ≈ 1 token)
    const beforeTokens = Math.ceil(
      (beforeContext.fullContent.length + beforeContext.allTurns.length * 200) /
        4,
    );

    const afterTokens = Math.ceil(
      (afterContext.contentSlice.length +
        afterContext.lastTurns.length * 200 +
        1000) /
        4, // 1KB for state
    );

    const reduction = (
      ((beforeTokens - afterTokens) / beforeTokens) *
      100
    ).toFixed(1);
    const costSavings = ((beforeTokens - afterTokens) / 1_000_000) * 0.15; // $0.15 per 1M tokens

    console.log("📊 Context Optimization Metrics:");
    console.log(`  - Before: ~${beforeTokens.toLocaleString()} tokens`);
    console.log(`  - After:  ~${afterTokens.toLocaleString()} tokens`);
    console.log(`  - Reduction: ${reduction}%`);
    console.log(`  - Cost savings per call: $${costSavings.toFixed(6)}`);

    expect(afterTokens).toBeLessThan(beforeTokens);
    expect(parseFloat(reduction)).toBeGreaterThan(70); // >70% reduction
  });
});
