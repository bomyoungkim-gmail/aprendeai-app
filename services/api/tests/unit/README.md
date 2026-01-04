# Testing Suite - Unit Tests

Complete unit test coverage for critical Cornell Reader business logic.

## Test Suites

### 1. SRS (Spaced Repetition System)

**File:** `test/unit/srs.service.spec.ts`  
**Status:** ✅ 31/31 passing  
**Coverage:** All SRS transitions and calculations

**Test Cases:**

- ✅ Basic transitions (NEW→D1, D1→D3, etc.) - 8 tests
- ✅ FAIL resets to D1 - 4 tests
- ✅ HARD regresses 1 stage - 6 tests
- ✅ EASY skips 1 stage - 6 tests
- ✅ MASTERED ceiling - 2 tests
- ✅ Stage intervals - 1 test
- ✅ Mastery deltas - 1 test
- ✅ Date calculations - 2 tests

**Key Learnings:**

- Floor is D1 (not NEW) - `Math.max(1, index - steps)`
- MASTERED stays MASTERED on OK/EASY
- Lapse only increments on FAIL

---

### 2. DoD (Definition of Done)

**File:** `test/unit/dod.validation.spec.ts`  
**Status:** ⏳ Created, testing...  
**Coverage:** Session completion validation

**Test Cases:**

- Summary requirement (3 tests)
- Quiz/Checkpoint requirement (3 tests)
- Production requirement (2 tests)
- All requirements combined (2 tests)

**Business Rules Tested:**

- ❌ Missing summary blocks completion
- ❌ Empty/whitespace summary blocks
- ❌ No quiz/checkpoint responses blocks
- ❌ No production events blocks
- ✅ All requirements met allows completion

---

### 3. Gating (Layer Eligibility)

**File:** `test/unit/gating.service.spec.ts`  
**Status:** ⏳ Created, testing...  
**Coverage:** L2/L3 eligibility determination

**Test Cases:**

- Default behavior (2 tests)
- L2 eligibility (3 tests)
- L3 eligibility (3 tests)
- L2 minimum sessions (2 tests)
- L2 criteria (3 tests)
- L3 requirements (6 tests)

**Business Rules Tested:**

**L2 Criteria:**

- Minimum 3 finished sessions
- Avg comprehension ≥ 60
- Avg frustration ≤ 50

**L3 Criteria:**

- Minimum 5 finished sessions
- Avg comprehension ≥ 75
- Avg production ≥ 70
- Avg frustration ≤ 40

**Fallback:**

- L3 requested → L2 if only L2 eligible
- L3 requested → L1 if not eligible
- L3 users can use L2

---

## Running Tests

```bash
# Run all unit tests
npm test -- test/unit

# Run specific suite
npm test -- test/unit/srs.service.spec.ts
npm test -- test/unit/dod.validation.spec.ts
npm test -- test/unit/gating.service.spec.ts

# Run with coverage
npm test -- test/unit --coverage

# Watch mode
npm test -- test/unit --watch
```

## Coverage Goals

- ✅ SRS: 100% (all paths covered)
- ⏳ DoD: Target 95%+
- ⏳ Gating: Target 95%+

## Next Steps

1. ✅ SRS unit tests complete
2. ⏳ Verify DoD tests pass
3. ⏳ Verify Gating tests pass
4. ⏳ Add integration tests
5. ⏳ Add E2E tests
