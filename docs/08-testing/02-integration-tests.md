# Integration Tests

**Purpose:** Document integration test coverage for API endpoints  
**Audience:** Dev | Antigravity  
**Last updated:** 2025-12-18  
**Owner:** Engineering Team

## Invariants (cannot break)

- All integration tests use real database (Postgres)
- Tests run in transactions (rollback after each)
- Supertest for HTTP testing
- No mocking of Prisma or DB
- Tests must be idempotent

## Scope

**In scope:**

- API endpoints (request → response)
- Database queries and mutations
- DoD validation
- Error handling
- Multi-step workflows

**Out of scope:**

- Business logic in isolation (unit tests)
- Complete user flows (E2E tests)
- External API calls (mocked)

## Integration Tests (27 total)

### Sessions API (6 tests)

**File:** `services/api/test/integration/sessions.spec.ts`

**Coverage:**

```typescript
describe('Sessions API Integration', () => {
  ✅ POST /contents/:id/sessions → Creates session (201)
  ✅ POST /sessions/:id/advance (PRE→DURING) → Success (200)
  ✅ POST /sessions/:id/advance (DURING→POST) → Success (200)
  ✅ POST /sessions/:id/advance (POST→FINISHED) without DoD → Error (400)
  ✅ POST /sessions/:id/advance (POST→FINISHED) with DoD → Success (200)
  ✅ POST /sessions/:id/events → Records event (201)
});
```

**Example Test:**

```typescript
it("should reject finish without DoD", async () => {
  // Setup: Create session in POST phase
  const content = await createContent(userId);
  const session = await createSession(content.id, userId);
  await advanceToPhase(session.id, "POST");

  // Missing: Cornell summary, quiz, production
  // Attempt to finish
  const response = await request(app.getHttpServer())
    .post(`/sessions/${session.id}/advance`)
    .set("Authorization", `Bearer ${token}`)
    .send({ toPhase: "FINISHED" })
    .expect(400);

  expect(response.body.message).toContain("Cornell summary is required");

  // Verify session still in POST
  const check = await prisma.readingSession.findUnique({
    where: { id: session.id },
  });
  expect(check.phase).toBe("POST");
});

it("should finish session with complete DoD", async () => {
  const content = await createContent(userId);
  const session = await createSession(content.id, userId);
  await advanceToPhase(session.id, "POST");

  // Satisfy DoD requirement 1: Cornell summary
  await saveCornell(content.id, userId, {
    summaryText: "This is my summary of the content",
  });

  // Satisfy DoD requirement 2: Quiz response
  await recordEvent(session.id, "QUIZ_RESPONSE", { correct: true });

  // Satisfy DoD requirement 3: Production submission
  await recordEvent(session.id, "PRODUCTION_SUBMIT", {
    text: "My own example",
  });

  // Now finish should succeed
  const response = await request(app.getHttpServer())
    .post(`/sessions/${session.id}/advance`)
    .set("Authorization", `Bearer ${token}`)
    .send({ toPhase: "FINISHED" })
    .expect(200);

  expect(response.body.phase).toBe("FINISHED");
  expect(response.body.finishedAt).toBeTruthy();
  expect(response.body.outcome).toBeTruthy();
});
```

---

### Cornell API (10 tests)

**File:** `services/api/test/integration/cornell.spec.ts`

**Coverage:**

```typescript
describe('Cornell API Integration', () => {
  // Auto-creation (2 tests)
  ✅ GET /contents/:id/cornell (first time) → Auto-creates (200)
  ✅ GET with sessionId → Creates session-specific note (200)

  // Save & Retrieve (3 tests)
  ✅ PUT /contents/:id/cornell → Saves notes (200)
  ✅ GET after PUT → Returns saved data (200)
  ✅ Multiple PUTs → Updates without data loss (200)

  // Highlights (3 tests)
  ✅ POST /contents/:id/highlights → Creates highlight (201)
  ✅ GET cornell → Includes highlights (200)
  ✅ DELETE /highlights/:id → Removes highlight (204)

  // Validation (2 tests)
  ✅ PUT with invalid data → Error (400)
  ✅ GET non-existent content → Error (404)
});
```

**Example Test:**

```typescript
it("should auto-create Cornell note on first GET", async () => {
  const content = await createContent(userId);

  // First GET auto-creates
  const response = await request(app.getHttpServer())
    .get(`/contents/${content.id}/cornell`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  expect(response.body).toMatchObject({
    id: expect.any(String),
    userId,
    contentId: content.id,
    mainNotes: {},
    cueColumn: null,
    summaryText: null,
  });

  // Verify in DB
  const cornell = await prisma.cornellNote.findFirst({
    where: { contentId: content.id, userId },
  });
  expect(cornell).toBeTruthy();
});

it("should persist Cornell notes across requests", async () => {
  const content = await createContent(userId);

  // Save notes
  const saveData = {
    mainNotes: { "1": "Note 1", "2": "Note 2" },
    cueColumn: "What is X?\nWhy Y?",
    summaryText: "Summary goes here",
  };

  await request(app.getHttpServer())
    .put(`/contents/${content.id}/cornell`)
    .set("Authorization", `Bearer ${token}`)
    .send(saveData)
    .expect(200);

  // Retrieve in new request
  const response = await request(app.getHttpServer())
    .get(`/contents/${content.id}/cornell`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  expect(response.body).toMatchObject(saveData);
});
```

---

### Review & SRS API (11 tests)

**File:** `services/api/test/integration/review-srs.spec.ts`

**Coverage:**

```typescript
describe('Review & SRS API Integration', () => {
  // Queue (3 tests)
  ✅ GET /review/queue → Returns due items only (200)
  ✅ GET with dailyCap=5 → Returns max 5 items (200)
  ✅ GET when nothing due → Empty queue (200)

  // Attempt & Transitions (5 tests)
  ✅ POST /review/attempt (result=OK) → Advances stage (200)
  ✅ POST /review/attempt (result=FAIL) → Resets to D1 (200)
  ✅ POST /review/attempt (result=EASY) → Skips stage (200)
  ✅ Verify dueAt updated correctly
  ✅ Verify attempt recorded in DB

  // Edge Cases (3 tests)
  ✅ Attempt on MASTERED + OK → Stays MASTERED (200)
  ✅ Multiple attempts in sequence → All process correctly
  ✅ Non-existent vocab → Error (404)
});
```

**Example Test:**

```typescript
it("should return only due items in queue", async () => {
  // Create vocab items
  const dueNow = await createVocab(userId, {
    word: "algorithm",
    dueAt: new Date(Date.now() - 1000), // Past
  });

  const dueLater = await createVocab(userId, {
    word: "dataset",
    dueAt: new Date(Date.now() + 86400000), // Tomorrow
  });

  // Get queue
  const response = await request(app.getHttpServer())
    .get("/review/queue")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  expect(response.body.queue).toHaveLength(1);
  expect(response.body.queue[0].id).toBe(dueNow.id);
});

it("should transition NEW + OK -> D1", async () => {
  const vocab = await createVocab(userId, {
    word: "algorithm",
    srsStage: "NEW",
    dueAt: new Date(),
  });

  const response = await request(app.getHttpServer())
    .post("/review/attempt")
    .set("Authorization", `Bearer ${token}`)
    .send({ vocabItemId: vocab.id, result: "OK" })
    .expect(200);

  expect(response.body.vocabItem.srsStage).toBe("D1");
  expect(response.body.transition).toMatchObject({
    from: "NEW",
    to: "D1",
    daysAdded: 1,
    masteryDelta: 10,
  });

  // Verify dueAt is ~1 day from now
  const dueAt = new Date(response.body.vocabItem.dueAt);
  const expectedDue = new Date(Date.now() + 86400000);
  const diff = Math.abs(dueAt.getTime() - expectedDue.getTime());
  expect(diff).toBeLessThan(5000); // Within 5 seconds
});
```

---

## Test Setup

### Database Configuration

```typescript
// test/jest-integration.config.js
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/test/integration/**/*.spec.ts"],
  setupFilesAfterEnv: ["<rootDir>/test/integration/setup.ts"],
  maxWorkers: 1, // Sequential execution
  testTimeout: 30000, // 30s timeout
};
```

### Setup File

```typescript
// test/integration/setup.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

beforeAll(async () => {
  // Run migrations
  // await prisma.$executeRaw`...`;
});

beforeEach(async () => {
  // Start transaction
  await prisma.$executeRaw`BEGIN`;
});

afterEach(async () => {
  // Rollback transaction
  await prisma.$executeRaw`ROLLBACK`;
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

---

## Helper Functions

```typescript
// test/integration/helpers.ts

export async function createUser(email: string) {
  return prisma.user.create({
    data: { email, passwordHash: "hashed" },
  });
}

export async function createContent(userId: string) {
  return prisma.content.create({
    data: {
      userId,
      title: "Test Content",
      type: "TEXT",
      rawText: "Sample text",
      originalLanguage: "EN",
    },
  });
}

export async function createSession(contentId: string, userId: string) {
  return prisma.readingSession.create({
    data: { userId, contentId, phase: "PRE" },
  });
}

export async function advanceToPhase(
  sessionId: string,
  phase: "DURING" | "POST" | "FINISHED"
) {
  return prisma.readingSession.update({
    where: { id: sessionId },
    data: { phase },
  });
}
```

---

## Running Integration Tests

```bash
cd services/api

# All integration tests
npm test -- test/integration

# Specific file
npm test -- test/integration/sessions.spec.ts

# With coverage
npm test -- test/integration --coverage

# Debug mode
node --inspect-brk node_modules/.bin/jest test/integration
```

---

## Database Requirements

**Prerequisites:**

1. PostgreSQL running
2. Test database created
3. Environment variable set:
   ```
   DATABASE_URL=postgresql://user:pass@localhost:5432/cornell_test
   ```

**Migration:**

```bash
npx prisma migrate deploy
```

---

## Best Practices

### DO:

- ✅ Use transactions for isolation
- ✅ Test real database behavior
- ✅ Test error scenarios
- ✅ Use helper functions
- ✅ Clean up after tests
- ✅ Test multi-step workflows

### DON'T:

- ❌ Mock Prisma (defeats purpose)
- ❌ Share state between tests
- ❌ Use production database
- ❌ Skip transaction cleanup
- ❌ Test business logic (use unit tests)

---

## Related docs

- [Testing Strategy](./00-testing-strategy.md)
- [Unit Tests](./01-unit-tests.md)
- [E2E Tests](./03-e2e-tests.md)
- [API Contracts](../../05-api/01-rest-contracts.md)
- [Schema](../../04-data/00-schema.md)

## Implementation

**Tests:** `services/api/test/integration/`  
**Config:** `services/api/test/jest-integration.config.js`  
**Total:** 27 integration tests
