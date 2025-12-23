# Unit Tests

**Purpose:** Document unit test coverage and patterns  
**Audience:** Dev | Antigravity  
**Last updated:** 2025-12-22  
**Owner:** Engineering Team

## Invariants (cannot break)

- Business logic has 100% unit test coverage
- SRS: 31 tests (all transitions)
- Gating: 18 tests (all criteria)
- Family: 23 tests (all ownership/membership flows)
- Tests run in isolation (no DB, no external deps)
- All tests must pass before merge

## Scope

**In scope:**

- Business logic (SRS, Gating, Scoring)
- Calculations (dates, scores, deltas)
- Validators and transformers
- Frontend components

**Out of scope:**

- Database queries (integration tests)
- API endpoints (integration tests)
- User flows (E2E tests)

## Backend Unit Tests (72 total)

### SRS Service (31 tests)

**File:** `services/api/test/unit/srs.service.spec.ts`

**Coverage:**

```typescript
describe('SrsService', () => {
  // Stage Transitions (12 tests)
  ✅ NEW + OK → D1
  ✅ D1 + OK → D3
  ✅ D3 + OK → D7
  ✅ D7 + OK → D14
  ✅ D14 + OK → D30
  ✅ D30 + OK → D60
  ✅ D60 + OK → MASTERED
  ✅ NEW + EASY → D3 (skip)
  ✅ D1 + EASY → D7 (skip)
  ✅ D7 + HARD → D3 (regress)
  ✅ D14 + HARD → D7 (regress)
  ✅ ANY + FAIL → D1 (reset)

  // Edge Cases (8 tests)
  ✅ NEW + HARD → D1 (floor at D1)
  ✅ D1 + HARD → D1 (floor at D1)
  ✅ MASTERED + OK → MASTERED (ceiling)
  ✅ MASTERED + EASY → MASTERED (ceiling)
  ✅ MASTERED + FAIL → D1 (reset from top)
  ✅ MASTERED + HARD → D60 (regress from top)
  ✅ D60 + EASY → MASTERED (skip to ceiling)
  ✅ NEW + FAIL → D1 (reset from bottom)

  // Date Calculations (6 tests)
  ✅ addDays(now, 1) for D1
  ✅ addDays(now, 3) for D3
  ✅ addDays(now, 7) for D7
  ✅ addDays(now, 14) for D14
  ✅ addDays(now, 30) for D30
  ✅ addDays(now, 180) for MASTERED

  // Mastery Deltas (5 tests)
  ✅ FAIL: -20 points
  ✅ HARD: -5 points
  ✅ OK: +10 points
  ✅ EASY: +15 points
  ✅ Clamp to 0-100 range
});
```

**Example Test:**

```typescript
it("should transition NEW + OK -> D1", () => {
  const result = service.calculateNextDue("NEW", "OK");

  expect(result).toEqual({
    newStage: "D1",
    daysToAdd: 1,
    lapseIncrement: 0,
    masteryDelta: 10,
  });
});

it("should reset ANY stage + FAIL -> D1", () => {
  const stages = ["D3", "D7", "D14", "D30", "D60", "MASTERED"];

  stages.forEach((stage) => {
    const result = service.calculateNextDue(stage, "FAIL");
    expect(result.newStage).toBe("D1");
    expect(result.lapseIncrement).toBe(1);
    expect(result.masteryDelta).toBe(-20);
  });
});
```

---

### Gating Service (18 tests)

**File:** `services/api/test/unit/gating.service.spec.ts`

**Coverage:**

```typescript
describe('GatingService', () => {
  // L2 Eligibility (6 tests)
  ✅ 0 sessions → ineligible
  ✅ 2 sessions → ineligible (need 3)
  ✅ 3 sessions, comp=70, frust=40 → eligible
  ✅ 3 sessions, comp=50 → ineligible (need 60)
  ✅ 3 sessions, comp=70, frust=60 → ineligible (max 50)
  ✅ 10 sessions (uses last 10 for avg)

  // L3 Eligibility (6 tests)
  ✅ 0 sessions → ineligible
  ✅ 4 sessions → ineligible (need 5)
  ✅ 5 sessions, all criteria met → eligible
  ✅ 5 sessions, comp=70 → ineligible (need 75)
  ✅ 5 sessions, prod=65 → ineligible (need 70)
  ✅ 5 sessions, frust=45 → ineligible (max 40)

  // Fallback Logic (6 tests)
  ✅ Request L3, eligible → L3
  ✅ Request L3, ineligible, L2 eligible → L2
  ✅ Request L3, both ineligible → L1
  ✅ Request L2, eligible → L2
  ✅ Request L2, ineligible → L1
  ✅ Request L1 → always L1
});
```

**Example Test:**

```typescript
it("should return L2 when eligible", async () => {
  // Mock 3 sessions with good scores
  mockPrisma.readingSession.findMany.mockResolvedValue([
    { outcome: { comprehensionScore: 70, frustrationIndex: 40 } },
    { outcome: { comprehensionScore: 65, frustrationIndex: 45 } },
    { outcome: { comprehensionScore: 80, frustrationIndex: 30 } },
  ]);

  const result = await service.checkL2Eligibility("user_1");

  expect(result).toBe(true);
  // Avg comp = 71.67 >= 60 ✅
  // Avg frust = 38.33 <= 50 ✅
});

it("should fallback L3 -> L2 -> L1", async () => {
  // Mock 3 sessions (not enough for L3)
  mockPrisma.readingSession.findMany.mockResolvedValue([
    {
      outcome: {
        comprehensionScore: 80,
        productionScore: 75,
        frustrationIndex: 35,
      },
    },
    {
      outcome: {
        comprehensionScore: 85,
        productionScore: 80,
        frustrationIndex: 30,
      },
    },
    {
      outcome: {
        comprehensionScore: 78,
        productionScore: 72,
        frustrationIndex: 38,
      },
    },
  ]);

  const layer = await service.determineLayer("user_1", "L3");

  expect(layer).toBe("L2");
  // L3: ineligible (only 3 sessions, need 5)
  // L2: eligible (3 sessions, good scores)
});
```

````

---

### Family Service (23 tests)

**File:** `services/api/test/unit/family.service.spec.ts`

**Coverage:**

```typescript
describe('FamilyService', () => {
  // Family Creation (3 tests)
  ✅ should create family with current user as owner
  ✅ should set owner role to OWNER
  ✅ should set status to ACTIVE

  // Member Invitation (3 tests)
  ✅ should invite existing user
  ✅ should create placeholder for new email
  ✅ should reject duplicate invitations

  // Invite Acceptance (2 tests)
  ✅ should accept invitation
  ✅ should activate placeholder user

  // Ownership Transfer (5 tests)
  ✅ should update family ownerId
  ✅ should downgrade old owner to GUARDIAN
  ✅ should upgrade new owner to OWNER
  ✅ should prevent non-owner from transferring
  ✅ should reject transfer to non-member

  // Billing Hierarchy (2 tests)
  ✅ should resolve to primary family
  ✅ should fallback to user scope if no families

  // Family Deletion (3 tests)
  ✅ should delete family and all members
  ✅ should only allow owner to delete
  ✅ should throw if family not found

  // Validation (5 tests)
  ✅ should validate family membership
  ✅ should validate owner permissions
  ✅ should prevent duplicate family names
  ✅ should enforce role constraints
  ✅ should maintain referential integrity
});
````

**Example Test:**

```typescript
it("should downgrade old owner to GUARDIAN", async () => {
  (prismaService.family.findUnique as jest.Mock).mockResolvedValue(mockFamily);

  await service.transferOwnership(familyId, currentOwnerId, newOwnerId);

  expect(prismaService.familyMember.update).toHaveBeenCalledWith({
    where: {
      familyId_userId: { familyId, userId: currentOwnerId },
    },
    data: expect.objectContaining({ role: "GUARDIAN" }),
  });
});

it("should create family with owner membership", async () => {
  const result = await service.create(userId, { name: "My Family" });

  expect(result.ownerId).toBe(userId);
  expect(prismaService.familyMember.create).toHaveBeenCalledWith({
    data: {
      userId,
      familyId: result.id,
      role: "OWNER",
      status: "ACTIVE",
    },
  });
});
```

---

## Frontend Unit Tests (21 total)

### CornellPanel Component (13 tests)

**File:** `frontend/tests/unit/CornellPanel.spec.tsx`

**Coverage:**

```typescript
describe('CornellPanel', () => {
  // Rendering (4 tests)
  ✅ Renders all 3 sections (cue, notes, summary)
  ✅ Starts in reading mode
  ✅ Shows content from props
  ✅ Shows empty state when no data

  // Mode Toggle (2 tests)
  ✅ Switches to editing mode on button click
  ✅ Switches back to reading mode

  // Autosave (4 tests)
  ✅ Debounces changes (2s delay)
  ✅ Multiple rapid changes → single save
  ✅ Shows "Saving..." indicator
  ✅ Shows "Saved" confirmation

  // Error Handling (3 tests)
  ✅ Shows error on save failure
  ✅ Retry button appears
  ✅ Retry succeeds after error
});
```

**Example Test:**

```typescript
it("should autosave cue column after 2s delay", async () => {
  vi.useFakeTimers();

  const { getByTestId } = render(<CornellPanel contentId="content_1" />);

  const cueInput = getByTestId("cue-column-input");
  fireEvent.change(cueInput, {
    target: { value: "What is ML?" },
  });

  // Should not save immediately
  expect(mockSaveCornell).not.toHaveBeenCalled();

  // Advance timer by 2s
  vi.advanceTimersByTime(2000);

  // Should save now
  await waitFor(() => {
    expect(mockSaveCornell).toHaveBeenCalledWith({
      cueColumn: "What is ML?",
    });
  });

  vi.useRealTimers();
});
```

---

### HighlightLink Component (8 tests)

**File:** `frontend/tests/unit/HighlightLink.spec.tsx`

**Coverage:**

```typescript
describe('HighlightLink', () => {
  // Creation (2 tests)
  ✅ Creates highlight on text selection
  ✅ Links to Cornell note

  // Display (2 tests)
  ✅ Shows highlight with correct color
  ✅ Shows highlight tooltip on hover

  // Interaction (2 tests)
  ✅ Navigates to note on click
  ✅ Opens context menu on right-click

  // Deletion (2 tests)
  ✅ Deletes highlight from menu
  ✅ Removes from UI after delete
});
```

---

## Test Patterns

### Mocking Dependencies

**Backend (Prisma):**

```typescript
const mockPrisma = {
  readingSession: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

beforeEach(() => {
  jest.clearAllMocks();
});
```

**Frontend (API calls):**

```typescript
vi.mock("@/lib/api", () => ({
  saveCornellNote: vi.fn(),
  createHighlight: vi.fn(),
}));
```

---

### Testing Deterministic Logic

**SRS:**

```typescript
// Test ALL transitions
const transitions = [
  ["NEW", "OK", "D1"],
  ["D1", "OK", "D3"],
  ["D3", "OK", "D7"],
  // ... all combinations
];

transitions.forEach(([from, result, to]) => {
  it(`should transition ${from} + ${result} -> ${to}`, () => {
    const output = service.calculateNextDue(from, result);
    expect(output.newStage).toBe(to);
  });
});
```

---

### Testing React Components

**With user events:**

```typescript
import { render, fireEvent, waitFor } from "@testing-library/react";

it("should toggle mode on button click", () => {
  const { getByTestId } = render(<CornellPanel />);

  const toggleButton = getByTestId("toggle-mode-button");
  expect(getByTestId("reading-mode")).toBeVisible();

  fireEvent.click(toggleButton);

  expect(getByTestId("editing-mode")).toBeVisible();
});
```

---

## Running Unit Tests

**Backend:**

```bash
cd services/api

# All unit tests
npm test -- test/unit

# Specific file
npm test -- test/unit/srs.service.spec.ts

# Watch mode
npm test -- test/unit --watch

# Coverage
npm test -- test/unit --coverage
```

**Frontend:**

```bash
cd frontend

# All unit tests
npm test

# Specific file
npm test CornellPanel

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

---

## Coverage Report

| File              | Statements | Branches | Functions | Lines |
| ----------------- | ---------- | -------- | --------- | ----- |
| srs.service.ts    | 100%       | 100%     | 100%      | 100%  |
| gating.service.ts | 100%       | 100%     | 100%      | 100%  |
| family.service.ts | 100%       | 100%     | 100%      | 100%  |
| CornellPanel.tsx  | 85%        | 78%      | 90%       | 85%   |
| HighlightLink.tsx | 80%        | 75%      | 85%       | 80%   |

---

## Best Practices

### DO:

- ✅ Test all edge cases
- ✅ Test error scenarios
- ✅ Mock external dependencies
- ✅ Use descriptive test names
- ✅ One assertion per concept
- ✅ Keep tests simple and readable

### DON'T:

- ❌ Test framework internals
- ❌ Test implementation details
- ❌ Share state between tests
- ❌ Use real database
- ❌ Make network calls
- ❌ Test third-party libraries

---

## Related docs

- [Testing Strategy](./00-testing-strategy.md)
- [Integration Tests](./02-integration-tests.md)
- [E2E Tests](./03-e2e-tests.md)
- [SRS Documentation](../../02-business-rules/02-srs.md)
- [Gating Documentation](../../02-business-rules/03-gating-layers.md)

## Implementation

**Backend Tests:** `services/api/test/unit/`  
**Frontend Tests:** `frontend/tests/unit/`  
**Total:** 72 backend + 21 frontend = 93 unit tests
