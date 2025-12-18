# Testing Suite

## Running Tests

### Unit Tests (Fast, No DB)

```bash
npm test -- test/unit
```

### Integration Tests (With DB)

```bash
# Setup test database first
npm run prisma:migrate:test

# Run integration tests
npm test -- test/integration
```

### All Tests

```bash
npm test
```

## Test Database Setup

Integration tests require a separate test database:

```bash
# Create test database
createdb aprendeai_test

# Set test database URL
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aprendeai_test"

# Run migrations
npx prisma migrate deploy
```

## Current Coverage

### Unit Tests: 49/49 ✅

- **SRS:** 31 tests (transitions, dates, deltas)
- **Gating:** 18 tests (L2/L3 eligibility)

### Integration Tests: 0/6 ⏳

- **Sessions:** 6 test cases (created, not run yet)

## Test Structure

```
test/
├── unit/                    # Fast tests with mocks
│   ├── srs.service.spec.ts
│   └── gating.service.spec.ts
├── integration/             # Tests with real DB
│   └── sessions.spec.ts
└── e2e/                     # Full stack tests
    └── (to be created)
```

## Writing Tests

### Unit Test Example

```typescript
it("should transition NEW + OK -> D1", () => {
  const result = service.calculateNextDue("NEW", "OK");
  expect(result.newStage).toBe("D1");
});
```

### Integration Test Example

```typescript
it("should create a session", async () => {
  const response = await request(app.getHttpServer())
    .post(`/contents/${contentId}/sessions`)
    .expect(201);

  expect(response.body.phase).toBe("PRE");
});
```

## Debugging

```bash
# Run specific test
npm test -- test/unit/srs.service.spec.ts

# Run with verbose output
npm test -- test/unit --verbose

# Run in watch mode
npm test -- test/unit --watch
```
