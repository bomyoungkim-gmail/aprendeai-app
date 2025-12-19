# E2E Testing with Playwright

## Setup

```bash
cd frontend

# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install

# Run tests
npx playwright test
```

## Running Tests

```bash
# Run all E2E tests
npx playwright test

# Run in UI mode
npx playwright test --ui

# Run specific test file
npx playwright test tests/e2e/cornell-persistence.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

## Test Suites

### 1. Cornell Persistence (5 tests)

**File:** `cornell-persistence.spec.ts`

Tests full Cornell notes workflow:

- Autosave cue column with reload
- Summary persistence across sessions
- Concurrent edits to multiple sections
- Error handling and retry
- Save indicator visibility

### 2. Session Flow (4 tests)

**File:** `session-flow.spec.ts`

Tests complete session lifecycle:

- Full session with all DoD requirements
- Block finish without summary (DoD validation)
- Block finish without quiz response
- Show completion stats

### 3. Review SRS (8 tests)

**File:** `review-srs.spec.ts`

Tests vocabulary review system:

- Display review queue
- Complete review with OK result
- FAIL resets to D1
- EASY skips stage
- Due date updates
- Daily cap respect
- Multiple review navigation
- Completion summary

**Total:** 17 E2E tests

## Debugging

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

Failed tests automatically capture screenshots in `test-results/`

## CI Integration

Tests run automatically in GitHub Actions:

- Chromium (required)
- Firefox (optional)
- WebKit (optional)

## Best Practices

1. **Use data-testid attributes** for stable selectors
2. **Wait for network idle** before assertions
3. **Use expect.toBeVisible()** for UI elements
4. **Mock time** for consistent testing
5. **Clean up** test data after each test

## Common Issues

**Port already in use:**

```bash
# Kill process on port 3000
npx kill-port 3000
```

**Browser not installed:**

```bash
npx playwright install chromium
```

**Timeout errors:**

- Increase timeout in playwright.config.ts
- Check network conditions
- Verify dev server is running
