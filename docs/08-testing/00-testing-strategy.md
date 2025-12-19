# Testing Strategy

**Purpose:** Document comprehensive testing approach for Cornell Reader  
**Audience:** Dev | Antigravity  
**Last updated:** 2025-12-18  
**Owner:** Engineering Team

## Invariants (cannot break)

- Deterministic business logic has 100% unit test coverage
- API endpoints have integration tests
- Critical user flows have E2E tests
- Tests run in CI on every PR
- No merge without passing tests

## Scope

**In scope:**

- Unit tests (backend + frontend)
- Integration tests (with real DB)
- E2E tests (complete user flows)
- CI/CD automation

**Out of scope:**

- Manual testing
- Performance testing (separate)
- Visual regression (future)

## Test Pyramid

```
         /\
        /E2E\        17 tests - Critical flows
       /------\
      /Frontend\     21 tests - Components
     /  Unit   \
    /------------\
   /  Backend    \   49 tests - Business logic
  /    Unit       \
 /------------------\
    76 Integration    27 tests - API + DB
```

**Total:** 114 tests

## Testing Frameworks

| Layer               | Framework        | Why                               |
| ------------------- | ---------------- | --------------------------------- |
| Backend Unit        | Jest             | NestJS native, TypeScript support |
| Backend Integration | Jest + Supertest | Real HTTP + DB                    |
| Frontend Unit       | Vitest           | Faster than Jest, modern          |
| E2E                 | Playwright       | Cross-browser, reliable           |

## Coverage Targets

| Area                | Target | Current | Status |
| ------------------- | ------ | ------- | ------ |
| SRS Logic           | 100%   | 100%    | ✅     |
| Gating Logic        | 100%   | 100%    | ✅     |
| Sessions API        | 80%    | 85%     | ✅     |
| Cornell API         | 80%    | 90%     | ✅     |
| Review API          | 80%    | 85%     | ✅     |
| Frontend Components | 70%    | 75%     | ✅     |

## Test Organization

```
services/api/test/
  unit/
    srs.service.spec.ts          (31 tests)
    gating.service.spec.ts       (18 tests)
  integration/
    sessions.spec.ts             (6 tests)
    cornell.spec.ts              (10 tests)
    review-srs.spec.ts           (11 tests)

frontend/tests/
  unit/
    CornellPanel.spec.tsx        (13 tests)
    HighlightLink.spec.tsx       (8 tests)
  e2e/
    cornell-persistence.spec.ts  (5 tests)
    session-flow.spec.ts         (4 tests)
    review-srs.spec.ts           (8 tests)
```

## Running Tests

**Backend:**

```bash
cd services/api

# Unit
npm test -- test/unit

# Integration (requires DB)
npm test -- test/integration

# Coverage
npm test -- --coverage
```

**Frontend:**

```bash
cd frontend

# Unit
npm test

# E2E
npx playwright test

# E2E UI mode
npx playwright test --ui
```

**CI:** Runs automatically on PR

## What to Test

### ✅ Always Unit Test

- Business logic (SRS, Gating, DoD)
- Calculations (scores, dates)
- Validators
- Transformers

### ✅ Always Integration Test

- API endpoints (request → response)
- Database queries
- DoD validation (reject/accept)
- SRS transitions with DB

### ✅ Always E2E Test

- Session complete flow
- Cornell autosave + persistence
- Review flow
- Critical error scenarios

### ❌ Don't Test

- Framework internals
- Third-party libraries
- Obvious getters/setters
- Configuration files

## Test Patterns

**Unit Test Example:**

```typescript
it("should transition NEW + OK -> D1", () => {
  const result = service.calculateNextDue("NEW", "OK");
  expect(result.newStage).toBe("D1");
  expect(result.daysToAdd).toBe(1);
});
```

**Integration Test Example:**

```typescript
it("should create session", async () => {
  const response = await request(app.getHttpServer())
    .post(`/contents/${contentId}/sessions`)
    .expect(201);

  expect(response.body.phase).toBe("PRE");
});
```

**E2E Test Example:**

```typescript
it("should persist cornell summary", async ({ page }) => {
  await page.fill('[data-testid="summary-input"]', "Summary");
  await page.waitForTimeout(3000); // autosave
  await page.reload();
  expect(await page.inputValue('[data-testid="summary-input"]')).toBe(
    "Summary"
  );
});
```

## CI/CD Pipeline

**GitHub Actions:**

```yaml
jobs:
  backend-unit: # 49 tests, ~30s
  backend-integration: # 27 tests, ~2min (with DB)
  frontend-unit: # 21 tests, ~20s
  e2e: # 17 tests, ~5min (full stack)
```

**On PR:**

- All tests must pass
- Coverage thresholds met
- No lint errors

## Failure Modes & Safeguards

**Flaky tests:**

- Use `waitFor` instead of fixed timeouts
- Mock external dependencies
- Use test database (not dev)
- Retry E2E tests (max 2x in CI)

**Slow tests:**

- Parallelize when possible
- Mock slow operations in unit tests
- Use transactions in integration tests
- Limit E2E to critical paths

**Missing coverage:**

- CI fails if coverage < threshold
- Review PR if major feature untested

## Related Docs

- [Unit Tests](./01-unit-tests.md)
- [Integration Tests](./02-integration-tests.md)
- [E2E Tests](./03-e2e-tests.md)
- [Business Rules](../../02-business-rules/00-rules-index.md)
- [CI Workflow](../../.github/workflows/test-suite.yml)

## Implementation

**Files:**

- Backend: `services/api/test/`
- Frontend: `frontend/tests/`
- CI: `.github/workflows/test-suite.yml`

**Configs:**

- `services/api/package.json` (Jest)
- `frontend/vitest.config.ts` (Vitest)
- `frontend/playwright.config.ts` (Playwright)
