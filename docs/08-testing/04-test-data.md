# Test Data & Fixtures

**Purpose:** Document strategy for test data management and fixtures  
**Audience:** Dev | Antigravity  
**Last updated:** 2025-12-18  
**Owner:** Engineering Team

## Invariants (cannot break)

- Integration tests always run in transactions (clean slate)
- Seed data scripts must be idempotent
- Do not use production dumps for testing (GDPR/Security)
- Factories generate valid data by default
- Hardcoded IDs only for constant fixtures (e.g. layers)

## Scope

**In scope:**

- Database seeding
- Test factories (helpers)
- Mocks and stubs
- Static fixtures

**Out of scope:**

- Migration data
- Production backups

## Data Strategy by Test Type

| Test Type       | Strategy                        | Tool                      |
| --------------- | ------------------------------- | ------------------------- |
| **Unit**        | Mocks / In-memory objects       | Jest Mocks                |
| **Integration** | Real DB + Transaction Rollback  | Prisma / Factories        |
| **E2E**         | Real DB (Seeded) or API mocking | Playwright / Seed Scripts |
| **Local Dev**   | `seed.ts` script                | Prisma Seed               |

---

## Test Factories (Integration Tests)

Located in `services/api/test/integration/helpers.ts`.

### User Factory

```typescript
export async function createUser(overrides = {}) {
  return prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      passwordHash: "hashed_secret",
      name: "Test User",
      ...overrides,
    },
  });
}
```

### Content Factory

```typescript
export async function createContent(
  userId: string,
  type: "TEXT" | "PDF" = "TEXT"
) {
  return prisma.content.create({
    data: {
      userId,
      title: "Test Content",
      type,
      rawText: "Sample raw text for testing integration.",
      originalLanguage: "EN",
    },
  });
}
```

### Session Factory

```typescript
export async function createSession(contentId: string, userId: string) {
  return prisma.readingSession.create({
    data: {
      userId,
      contentId,
      phase: "PRE",
      modality: "READING",
    },
  });
}
```

---

## E2E Test Data

For Playwright, we often need a predictable state.

### 1. Database Reset

Before E2E suite runs:

```bash
npm run prisma:reset
```

### 2. Seeding for E2E

```typescript
// prisma/seed.ts
async function main() {
  // Create standard test user
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      passwordHash: await hash("password123"),
      name: "E2E Test User",
    },
  });

  // Create standard content
  await prisma.content.create({
    data: {
      userId: user.id,
      title: "E2E Test Article",
      type: "TEXT",
      rawText: "This is a test article for E2E testing.",
    },
  });
}
```

### 3. Dynamic Data in Tests

Playwright tests create their own isolated data when possible to avoid conflicts.

```typescript
// e2e/session-flow.spec.ts
test("creates unique session", async ({ page }) => {
  // Uses UI to create data, ensuring the path is tested
  await page.click("[data-testid=create-content-btn]");
  // ...
});
```

---

## Mock Data (Unit Tests)

### SRS Mock

```typescript
const mockSrsResult = {
  newStage: "D1",
  daysToAdd: 1,
  lapseIncrement: 0,
  masteryDelta: 10,
};
```

### Prisma Mock

```typescript
// srs.service.spec.ts
const mockVocab = {
  id: "vocab_1",
  srsStage: "NEW",
  dueAt: new Date(),
  attemptCount: 0,
};

jest.spyOn(prisma.userVocabulary, "findUnique").mockResolvedValue(mockVocab);
```

---

## Standard Fixtures

### User Personas (for Manual Testing)

| Email                | Password   | Role/State                          |
| -------------------- | ---------- | ----------------------------------- |
| `new@example.com`    | `password` | No sessions, empty stats            |
| `active@example.com` | `password` | 10 sessions, L2 eligible            |
| `power@example.com`  | `password` | 50 sessions, L3 eligible, 500 vocab |

### Content Samples

Located in `services/api/prisma/fixtures/`:

- `sample-article.txt`: Plain text English article
- `sample-paper.pdf`: PDF with formatting
- `sample-dialogue.json`: Structured content

---

## Cleanup Strategy

### Integration Tests

Uses SQL transactions.

```typescript
beforeEach(async () => {
  await prisma.$executeRaw`BEGIN`;
});

afterEach(async () => {
  await prisma.$executeRaw`ROLLBACK`;
});
```

### E2E Tests

Tests should clean up created resources via UI/API or reset DB after suite.

```typescript
// teardown
test.afterAll(async () => {
  await prisma.user.delete({ where: { email: "test@example.com" } });
});
```

## Related

- [Testing Strategy](./00-testing-strategy.md)
- [Unit Tests](./01-unit-tests.md)
- [Integration Tests](./02-integration-tests.md)
