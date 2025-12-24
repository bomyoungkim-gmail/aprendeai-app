# Test Suite - Sprints 1+2+3 Implementation

## Overview

This directory contains comprehensive test suites for the 3 sprints implementation:

- **Sprint 1**: Media Content (VIDEO/AUDIO enum, duration field, file.storageKey)
- **Sprint 2**: Solo Reading Sessions (enhanced getSession, messages, quickReplies)
- **Sprint 3**: Annotation Audit Trail (SessionEvent creation)

## Test Structure

### Integration Tests (`test/integration/`)

- `media-content.integration.spec.ts` - Sprint 1 tests
- `solo-sessions.integration.spec.ts` - Sprint 2 tests
- `annotation-audit.integration.spec.ts` - Sprint 3 tests

### Unit Tests (`test/unit/`)

- `annotation-service.spec.ts` - Unit tests for AnnotationService

### E2E Tests (Frontend)

- See `frontend/tests/e2e/sprints-integration.spec.ts`

## Running Tests

### Backend Tests

```bash
# All tests
npm test

# Only integration tests
npm run test:integration

# Only unit tests
npm run test:unit

# Specific sprint tests
npm run test:integration -- media-content.integration.spec.ts
npm run test:integration -- solo-sessions.integration.spec.ts
npm run test:integration -- annotation-audit.integration.spec.ts

# With coverage
npm run test:cov
```

### Frontend E2E Tests

```bash
cd ../frontend

# All E2E tests
npx playwright test

# Only sprint integration tests
npx playwright test tests/e2e/sprints-integration.spec.ts

# With UI
npx playwright test --ui

# Specific test
npx playwright test -g "should create and access solo reading session"
```

## Test Coverage

### Sprint 1: Media Content

- ✅ CREATE VIDEO content with duration
- ✅ CREATE AUDIO content with duration
- ✅ Reject invalid content types
- ✅ Accept null duration for non-media
- ✅ UPDATE duration field
- ✅ GET returns file.storageKey
- ✅ Static file serving at /api/uploads

### Sprint 2: Solo Sessions

- ✅ GET /sessions/:id returns enhanced structure
- ✅ Returns messages array from SessionEvents
- ✅ Returns quickReplies from last event
- ✅ Exposes file.storageKey in content
- ✅ Returns 404 for non-existent session
- ✅ Returns 403 for unauthorized access
- ✅ POST /sessions/:id/prompt creates events

### Sprint 3: Annotation Audit

- ✅ PATCH /annotations/:id/favorite creates SessionEvent
- ✅ Event contains correct annotationId and favorite status
- ✅ POST /annotations/:id/reply creates SessionEvent
- ✅ Event contains annotationId and replyId
- ✅ Multiple events for multiple actions
- ✅ Search annotations works (existing functionality)

## Database Verification

After running tests, verify SessionEvents were created:

```bash
# Connect to test database
psql -U postgres -d aprendeai_test

# Check annotation events
SELECT
  eventtype as type,
  payload_json->>'annotationId' as annotation_id,
  payload_json->>'favorite' as favorite,
  payload_json->>'replyId' as reply_id,
  created_at
FROM session_events
WHERE event_type LIKE 'ANNOTATION_%'
ORDER BY created_at DESC
LIMIT 10;
```

## CI/CD Integration

Add to `.github/workflows/test.yml`:

```yaml
name: Test Sprints Implementation

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci
        working-directory: services/api

      - name: Run integration tests
        run: npm run test:integration
        working-directory: services/api
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test

      - name: Run unit tests
        run: npm run test:unit
        working-directory: services/api

  frontend-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test tests/e2e/sprints-integration.spec.ts
        working-directory: frontend
```

## Troubleshooting

### Tests Failing with "Cannot find module"

```bash
cd services/api
npm install
npx prisma generate
```

### Database Connection Errors

Check `.env.test` file exists:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/aprendeai_test"
```

### E2E Tests Timeout

Increase timeout in `playwright.config.ts`:

```typescript
timeout: 60000, // 60 seconds
```

## Manual Verification Checklist

After automated tests pass, manually verify:

1. [ ] Create VIDEO content via UI
2. [ ] Check duration field appears in forms
3. [ ] Navigate to /reading/:id without group context
4. [ ] Toggle annotation favorite
5. [ ] Create annotation reply
6. [ ] Query `session_events` table for new event types

## Next Steps

1. Run all tests: `npm run test:all`
2. Review coverage report
3. If all green, deploy to staging
4. Run smoke tests in staging
5. Monitor SessionEvent table in production
