# E2E Tests

**Purpose:** Document end-to-end test coverage with Playwright  
**Audience:** Dev | Antigravity  
**Last updated:** 2025-12-18  
**Owner:** Engineering Team

## Invariants (cannot break)

- E2E tests cover critical user flows
- Tests run against full stack (backend + frontend)
- Playwright for cross-browser testing
- Tests must be deterministic
- Use data-testid for stable selectors

## Scope

**In scope:**

- Complete user journeys
- Cross-component interactions
- Real browser behavior
- Visual feedback (screenshots/videos on failure)

**Out of scope:**

- Unit logic testing
- API contract testing
- Performance testing

## E2E Tests (17 total)

### Cornell Persistence (5 tests)

**File:** `frontend/tests/e2e/cornell-persistence.spec.ts`

**User Flow:**

```
User creates notes → Autosave → Reload page → Notes persist
```

**Coverage:**

```typescript
describe('Cornell Notes Persistence', () => {
  ✅ Autosave cue column + verify after reload
  ✅ Summary persistence across sessions
  ✅ Concurrent edits to cue + summary (both save)
  ✅ Error handling on save failure + retry
  ✅ Save indicator visibility
});
```

**Example Test:**

```typescript
test("should autosave cue column and persist on reload", async ({ page }) => {
  // Login
  await page.goto("/login");
  await page.fill('[name="email"]', "test@example.com");
  await page.fill('[name="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard");

  // Navigate to content
  await page.click('[data-testid="content-item"]:first-child');
  await page.waitForURL(/\/contents\/.+/);

  // Switch to editing mode
  await page.click('[data-testid="toggle-mode-button"]');
  await expect(page.locator('[data-testid="editing-mode"]')).toBeVisible();

  // Type in cue column
  const cueInput = page.locator('[data-testid="cue-column-input"]');
  await cueInput.fill("What is the main concept?\nWhy is this important?");

  // Wait for autosave (3 seconds)
  await page.waitForTimeout(3000);

  // Verify save indicator
  await expect(page.locator('[data-testid="save-indicator"]')).toHaveText(
    /saved/i
  );

  // Reload page
  await page.reload();
  await page.waitForLoadState("networkidle");

  // Verify cue column persisted
  const cueText = await cueInput.inputValue();
  expect(cueText).toContain("What is the main concept?");
  expect(cueText).toContain("Why is this important?");
});
```

---

### Session Flow (4 tests)

**File:** `frontend/tests/e2e/session-flow.spec.ts`

**User Flow:**

```
Create session → Fill PRE → Complete DURING →
Fill POST (DoD) → Finish successfully
```

**Coverage:**

```typescript
describe('Complete Session Flow', () => {
  ✅ Happy path: Complete session with all DoD requirements
  ✅ DoD blocks: Cannot finish without Cornell summary
  ✅ DoD blocks: Cannot finish without quiz response
  ✅ Show completion stats after successful finish
});
```

**Example Test:**

```typescript
test("should complete full session with DoD", async ({ page }) => {
  await page.goto("/login");
  await page.fill('[name="email"]', "test@example.com");
  await page.fill('[name="password"]', "password123");
  await page.click('button[type="submit"]');

  // Select content and start session
  await page.click('[data-testid="content-item"]:first-child');
  await page.click('[data-testid="start-session-button"]');
  await page.waitForURL(/\/sessions\/.+/);

  // Verify PRE phase
  await expect(page.locator('[data-testid="current-phase"]')).toHaveText("PRE");

  // Fill PRE data
  await page.fill('[data-testid="goal-input"]', "Understand main concepts");
  await page.fill('[data-testid="target-word-input"]', "algorithm");
  await page.click('[data-testid="add-target-word"]');
  await page.fill('[data-testid="prediction-input"]', "I expect to learn...");

  // Advance to DURING
  await page.click('[data-testid="advance-phase-button"]');
  await expect(page.locator('[data-testid="current-phase"]')).toHaveText(
    "DURING"
  );

  // Answer quiz (DoD requirement #2)
  await expect(page.locator('[data-testid="quiz-question"]')).toBeVisible();
  await page.click('[data-testid="quiz-option-1"]');
  await page.click('[data-testid="submit-quiz-answer"]');

  // Advance to POST
  await page.click('[data-testid="advance-phase-button"]');
  await expect(page.locator('[data-testid="current-phase"]')).toHaveText(
    "POST"
  );

  // Fill Cornell summary (DoD requirement #1)
  await page.click('[data-testid="open-cornell-button"]');
  await page.click('[data-testid="toggle-mode-button"]');
  await page
    .locator('[data-testid="summary-input"]')
    .fill("Key learnings: The content explained concepts clearly");
  await page.waitForTimeout(3000); // Autosave
  await page.click('[data-testid="close-cornell-button"]');

  // Submit production (DoD requirement #3)
  await page.fill(
    '[data-testid="production-input"]',
    "My own example: I would apply this..."
  );
  await page.click('[data-testid="submit-production"]');

  // Finish session - should succeed
  await page.click('[data-testid="finish-session-button"]');

  await expect(page.locator('[data-testid="session-complete"]')).toBeVisible();
  await expect(page.locator('[data-testid="session-complete"]')).toContainText(
    /completed successfully/i
  );

  // Verify completion stats shown
  await expect(page.locator('[data-testid="completion-time"]')).toBeVisible();
  await expect(
    page.locator('[data-testid="comprehension-score"]')
  ).toBeVisible();
});

test("should block finish without summary", async ({ page }) => {
  // ... complete PRE and DURING ...

  // In POST phase
  // Answer quiz ✅
  // Submit production ✅
  // Skip summary ❌

  // Try to finish
  await page.click('[data-testid="finish-session-button"]');

  // Should show error
  await expect(page.locator('[data-testid="dod-error"]')).toBeVisible();
  await expect(page.locator('[data-testid="dod-error"]')).toContainText(
    /summary is required/i
  );

  // Should still be in POST
  await expect(page.locator('[data-testid="current-phase"]')).toHaveText(
    "POST"
  );
});
```

---

### Review SRS (8 tests)

**File:** `frontend/tests/e2e/review-srs.spec.ts`

**User Flow:**

```
View review queue → Review items → Submit results →
SRS updates → Continue reviewing
```

**Coverage:**

```typescript
describe('Review SRS Flow', () => {
  ✅ Display review queue with due items
  ✅ Complete review with OK result (stage advances)
  ✅ FAIL result resets to D1
  ✅ EASY result skips stages
  ✅ Due date updates correctly
  ✅ Daily review cap respected (≤20)
  ✅ Navigate through multiple reviews
  ✅ Show completion summary
});
```

**Example Test:**

```typescript
test("should complete review with OK result", async ({ page }) => {
  await page.goto("/login");
  // ... login ...

  // Navigate to review
  await page.click('[data-testid="review-link"]');
  await page.waitForURL("/review");

  // Should show due items
  const dueCount = await page
    .locator('[data-testid="due-count"]')
    .textContent();
  expect(parseInt(dueCount || "0")).toBeGreaterThan(0);

  // Start first review
  await page.click('[data-testid="vocab-item"]:first-child');
  await page.waitForURL(/\/review\/.+/);

  // Should show word and current stage
  await expect(page.locator('[data-testid="review-word"]')).toBeVisible();
  const currentStage = await page
    .locator('[data-testid="current-stage"]')
    .textContent();
  expect(currentStage).toMatch(/NEW|D1|D3|D7|D14|D30|D60/);

  // Reveal answer
  await page.click('[data-testid="show-answer-button"]');
  await expect(page.locator('[data-testid="definition"]')).toBeVisible();

  // Submit OK
  await page.click('[data-testid="result-ok-button"]');

  // Should show success
  await expect(page.locator('[data-testid="review-success"]')).toBeVisible();

  // Should show new stage (advanced)
  const newStage = await page
    .locator('[data-testid="new-stage"]')
    .textContent();

  // Verify stage advanced
  if (currentStage === "NEW") expect(newStage).toBe("D1");
  if (currentStage === "D1") expect(newStage).toBe("D3");
});

test("should reset to D1 on FAIL", async ({ page }) => {
  await page.goto("/review");

  // Find item with advanced stage
  await page.click('[data-testid="vocab-item"][data-stage="D7"]');

  // Review and fail
  await page.click('[data-testid="show-answer-button"]');
  await page.click('[data-testid="result-fail-button"]');

  // Should reset to D1
  const newStage = await page
    .locator('[data-testid="new-stage"]')
    .textContent();
  expect(newStage).toBe("D1");

  // Should show lapse count incremented
  await expect(page.locator('[data-testid="lapse-count"]')).toBeVisible();
});
```

---

## Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

---

## Running E2E Tests

```bash
cd frontend

# Install browsers (first time)
npx playwright install

# Run all E2E tests
npx playwright test

# Run in UI mode (interactive)
npx playwright test --ui

# Run specific test
npx playwright test cornell-persistence

# Run in headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Generate code (record actions)
npx playwright codegen http://localhost:3000
```

---

## Test Patterns

### Stable Selectors

```typescript
// ✅ Use data-testid
await page.click('[data-testid="submit-button"]');

// ❌ Avoid CSS classes (brittle)
await page.click(".btn-primary");

// ❌ Avoid text content (i18n breaks)
await page.click("text=Submit");
```

### Wait Strategies

```typescript
// Wait for navigation
await page.waitForURL("/dashboard");

// Wait for element
await page.waitForSelector('[data-testid="content"]');

// Wait for network
await page.waitForLoadState("networkidle");

// Wait for timeout (last resort)
await page.waitForTimeout(3000); // Only for autosave
```

### Error Handling

```typescript
test("should retry on failure", async ({ page }) => {
  // Mock API to fail first time
  await page.route("**/api/save", (route) => {
    if (!route.request().headers()["x-retry"]) {
      route.abort("failed");
    } else {
      route.continue();
    }
  });

  // ... test retry logic ...
});
```

---

## Debugging E2E Tests

### View Test Report

```bash
npx playwright show-report
```

### Generate Trace

```bash
npx playwright test --trace on
npx playwright show-trace trace.zip
```

### Screenshots

Failed tests automatically capture:

- Screenshot at failure point
- Full page HTML
- Console logs

Located in: `test-results/`

---

## Best Practices

### DO:

- ✅ Use data-testid for elements
- ✅ Wait for network idle
- ✅ Test critical user flows
- ✅ Handle async operations properly
- ✅ Take screenshots on failure
- ✅ Run in CI

### DON'T:

- ❌ Test every edge case (use unit tests)
- ❌ Use fixed timeouts except for autosave
- ❌ Rely on CSS classes
- ❌ Test API directly (use integration tests)
- ❌ Share state between tests

---

## CI Integration

**GitHub Actions:**

```yaml
jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4

      # Start backend
      - run: cd services/api && npm ci && npm run start:prod &

      # Install Playwright
      - run: cd frontend && npm ci
      - run: npx playwright install --with-deps chromium

      # Run tests
      - run: npx playwright test

      # Upload artifacts on failure
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Related docs

- [Testing Strategy](./00-testing-strategy.md)
- [Unit Tests](./01-unit-tests.md)
- [Integration Tests](./02-integration-tests.md)
- [Session Flow](../../02-business-rules/01-study-sessions.md)
- [SRS System](../../02-business-rules/02-srs.md)

## Implementation

**Tests:** `frontend/tests/e2e/`  
**Config:** `frontend/playwright.config.ts`  
**Total:** 17 E2E tests (5 Cornell + 4 Session + 8 Review)
