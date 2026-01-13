import { buildSessionContext, ContextBuilderDeps } from "./context-builder";

describe("buildSessionContext", () => {
  let mockDeps: ContextBuilderDeps;

  beforeEach(() => {
    mockDeps = {
      prisma: {
        users: {
          findUnique: jest.fn().mockResolvedValue({ name: "João" }),
        },
        reading_sessions: {
          findUnique: jest.fn().mockResolvedValue({
            started_at: new Date("2026-01-05T09:00:00Z"),
            finished_at: new Date("2026-01-05T09:15:00Z"),
          }),
        },
        contents: {
          findUnique: jest.fn().mockResolvedValue({ title: "Harry Potter" }),
        },
        vocab_items: {
          count: jest.fn().mockResolvedValue(42),
          findFirst: jest.fn().mockResolvedValue({
            due_at: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          }),
        },
        session_events: {
          count: jest.fn().mockResolvedValue(3),
        },
      } as any,
      gamificationService: {
        getDashboard: jest.fn().mockResolvedValue({
          totalXp: 1000,
          dailyActivity: { xp: 50 },
          currentStreak: 7,
        }),
      } as any,
      scaffoldingInitializer: {
        getInitialLevel: jest.fn().mockReturnValue(2), // Default to L2
      } as any,
      scaffoldingBehaviorAdapter: {
        getBehaviorModifiers: jest.fn().mockReturnValue({
          responseFormat: "DIRECT",
          useSocraticMode: false,
          includeExamples: false,
          includeVerification: false,
          quickReplies: [],
          tone: "conversational",
          phaseAdjustments: { duringReading: false, postReading: false },
        }),
        formatSystemPrompt: jest.fn().mockReturnValue(""),
      } as any,
    };
  });

  it("should build complete context with all data available", async () => {
    const context = await buildSessionContext(
      "session-123",
      "user-456",
      "content-789",
      mockDeps,
    );

    expect(context.LEARNER).toBe("João");
    expect(context.XP).toBe(1000);
    expect(context.XP_TODAY).toBe(50);
    expect(context.STREAK).toBe(7);
    expect(context.MIN).toBe(15);
    expect(context.WORDS_MARKED).toBe(3);
    expect(context.TITLE).toBe("Harry Potter");
    expect(context.VOCAB_COUNT).toBe(42);
    expect(context.DAYS).toBe(5); // 5 days until review
  });

  it("should use fallbacks when data is missing", async () => {
    mockDeps.prisma.users.findUnique = jest.fn().mockResolvedValue(null);
    mockDeps.prisma.reading_sessions.findUnique = jest
      .fn()
      .mockResolvedValue(null);
    mockDeps.prisma.contents.findUnique = jest.fn().mockResolvedValue(null);
    mockDeps.gamificationService.getDashboard = jest
      .fn()
      .mockRejectedValue(new Error("Service down"));
    mockDeps.prisma.vocab_items.count = jest
      .fn()
      .mockRejectedValue(new Error("DB error"));
    mockDeps.prisma.vocab_items.findFirst = jest
      .fn()
      .mockRejectedValue(new Error("DB error"));
    mockDeps.prisma.session_events.count = jest
      .fn()
      .mockRejectedValue(new Error("DB error"));

    const context = await buildSessionContext(
      "session-123",
      "user-456",
      "content-789",
      mockDeps,
    );

    expect(context.LEARNER).toBe("você");
    expect(context.XP).toBe(0);
    expect(context.XP_TODAY).toBe(0);
    expect(context.STREAK).toBe(0);
    expect(context.MIN).toBe(0);
    expect(context.WORDS_MARKED).toBe(0);
    expect(context.TITLE).toBe("este conteúdo");
    expect(context.VOCAB_COUNT).toBe(0);
    expect(context.DAYS).toBeUndefined();
  });

  it("should return minimal context on catastrophic failure", async () => {
    mockDeps.prisma.users.findUnique = jest
      .fn()
      .mockRejectedValue(new Error("DB down"));

    const context = await buildSessionContext(
      "session-123",
      "user-456",
      "content-789",
      mockDeps,
    );

    expect(context.LEARNER).toBe("você");
    expect(context.XP).toBe(0);
  });
});
