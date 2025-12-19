# SRS (Spaced Repetition System)

**Purpose:** Document deterministic vocabulary review system  
**Audience:** Dev | Antigravity  
**Last updated:** 2025-12-18  
**Owner:** Engineering Team

## Invariants (cannot break)

- FAIL always resets to D1 (+ lapse increment)
- Floor is D1 (cannot regress below)
- Ceiling is MASTERED (stays on OK/EASY)
- NEW card floor is also D1 (NEW + HARD → D1)
- Date calculations use date-fns `addDays` (UTC)
- Mastery score deltas are fixed: FAIL(-20), HARD(-5), OK(+10), EASY(+15)

## Scope

**In scope:**

- SRS stage transitions
- Due date calculations
- Lapse counting
- Mastery score adjustments

**Out of scope:**

- AI recommendations for study time
- User preferences for intervals
- Queue sorting/prioritization (separate service)

## Interfaces / Contracts

**Tables:**

- `UserVocabulary.srsStage` (enum)
- `UserVocabulary.dueAt` (DateTime)
- `UserVocabulary.lapseCount` (Int)
- `UserVocabulary.masteryScore` (Int, 0-100)

**Methods:**

- `SrsService.calculateNextDue(currentStage, attemptResult)`
- `SrsService.recordAttempt(vocabId, result)`

## Flows (step by step)

### Flow 1: Calculate Next Due

```typescript
Input: currentStage='D7', attemptResult='OK'

1. Get current stage index from STAGE_ORDER
   → D7 is index 4

2. Apply result logic:
   - FAIL → newIndex = 1 (D1), lapseIncrement = 1
   - HARD → newIndex = max(1, currentIndex - 1)
   - OK → newIndex = min(MASTERED_INDEX, currentIndex + 1)
   - EASY → newIndex = min(MASTERED_INDEX, currentIndex + 2)

   For OK: 4 + 1 = 5

3. Get new stage from STAGE_ORDER
   → STAGE_ORDER[5] = 'D14'

4. Get days to add from INTERVAL_DAYS map
   → INTERVAL_DAYS['D14'] = 14

5. Calculate dueAt
   → dueAt = addDays(now, 14)

Output: {
  newStage: 'D14',
  daysToAdd: 14,
  lapseIncrement: 0,
  masteryDelta: +10
}
```

### Flow 2: Record Attempt

```typescript
1. Find UserVocabulary by ID
2. Call calculateNextDue(current, result)
3. Update:
   - srsStage = newStage
   - dueAt = calculated date
   - lapseCount += lapseIncrement
   - masteryScore = clamp(current + delta, 0, 100)
   - lastReviewedAt = now()
4. Create VocabAttempt record
5. Return updated vocab
```

## Examples

### Example A: NEW card with OK

**Input:**

- currentStage: 'NEW'
- attemptResult: 'OK'

**Output:**

- newStage: 'D1'
- daysToAdd: 1
- lapseIncrement: 0
- masteryDelta: +10

### Example B: D7 with FAIL

**Input:**

- currentStage: 'D7'
- attemptResult: 'FAIL'

**Output:**

- newStage: 'D1'
- daysToAdd: 1
- lapseIncrement: 1
- masteryDelta: -20

### Example C: MASTERED with OK

**Input:**

- currentStage: 'MASTERED'
- attemptResult: 'OK'

**Output:**

- newStage: 'MASTERED' (ceiling)
- daysToAdd: 180
- lapseIncrement: 0
- masteryDelta: +10

### Example D: NEW with HARD

**Input:**

- currentStage: 'NEW'
- attemptResult: 'HARD'

**Output:**

- newStage: 'D1' (floor at D1, not NEW)
- daysToAdd: 1
- lapseIncrement: 0
- masteryDelta: -5

## Failure modes & safeguards

**Invalid stage:**

- Validation: stage must be in STAGE_ORDER
- Throw if not found

**Invalid result:**

- Validation: result must be FAIL|HARD|OK|EASY
- Throw BadRequestException

**Date overflow:**

- Use date-fns which handles edge cases
- Store as UTC DateTime

**Concurrent updates:**

- Use Prisma transactions
- Optimistic locking on attempts

## Related docs

- [Business Rules Index](./00-rules-index.md)
- [Unit Tests](../../08-testing/01-unit-tests.md#srs)
- [Review API](../../05-api/01-rest-contracts.md#review)
- [Data Schema](../../04-data/00-schema.md#uservocabulary)

## Implementation

**File:** `services/api/src/vocab/srs.service.ts`  
**Tests:** `services/api/test/unit/srs.service.spec.ts` (31 tests)

**Constants:**

```typescript
const STAGE_ORDER = ["NEW", "D1", "D3", "D7", "D14", "D30", "D60", "MASTERED"];
const INTERVAL_DAYS = {
  NEW: 0,
  D1: 1,
  D3: 3,
  D7: 7,
  D14: 14,
  D30: 30,
  D60: 60,
  MASTERED: 180,
};
const MASTERY_DELTAS = {
  FAIL: -20,
  HARD: -5,
  OK: +10,
  EASY: +15,
};
```
