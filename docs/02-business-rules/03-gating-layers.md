# Gating & Layer Eligibility

**Purpose:** Document L2/L3 access eligibility rules  
**Audience:** Dev | Antigravity  
**Last updated:** 2025-12-18  
**Owner:** Engineering Team

## Invariants (cannot break)

- L1 always available (no eligibility check)
- L2 requires: 3+ finished sessions, comp≥60, frust≤50
- L3 requires: 5+ finished sessions, comp≥75, prod≥70, frust≤40
- Uses last 10 sessions maximum for calculation
- L3 users can fallback to L2 (not L1)
- Calculation uses finished sessions only (not aborted)

## Scope

**In scope:**

- Eligibility determination
- Average calculation from outcomes
- Fallback logic

**Out of scope:**

- AI quality per layer (separate)
- User layer preferences
- Billing/entitlements per layer

## Interfaces / Contracts

**Tables:**

- `ReadingSession.phase` (must be 'FINISHED')
- `SessionOutcome.comprehensionScore`
- `SessionOutcome.productionScore`
- `SessionOutcome.frustrationIndex`

**Methods:**

- `GatingService.determineLayer(userId, requestedLayer)`
- `GatingService.checkL2Eligibility(userId)`
- `GatingService.checkL3Eligibility(userId)`

## Flows (step by step)

### Flow 1: Determine Layer

```typescript
Input: userId='user-1', requestedLayer='L3'

1. Fetch last 10 finished sessions for user
   → sessions = [...] (e.g., 7 sessions)

2. If requestedLayer === 'L1':
   → return 'L1' (always allowed)

3. If requestedLayer === 'L2':
   → check L2 eligibility
   → if true: return 'L2'
   → else: return 'L1'

4. If requestedLayer === 'L3':
   → check L3 eligibility
   → if true: return 'L3'
   → check L2 eligibility (fallback)
   → if true: return 'L2'
   → else: return 'L1'

Output: 'L2' (eligible for L2, not L3)
```

### Flow 2: Check L2 Eligibility

```typescript
1. Get finished sessions (last 10 max)

2. Check count:
   if sessions.length < 3 → return false

3. Calculate averages:
   avgComp = sum(comprehensionScore) / count
   avgFrust = sum(frustrationIndex) / count

4. Check thresholds:
   return avgComp >= 60 && avgFrust <= 50
```

### Flow 3: Check L3 Eligibility

```typescript
1. Get finished sessions (last 10 max)

2. Check count:
   if sessions.length < 5 → return false

3. Calculate averages:
   avgComp = sum(comprehensionScore) / count
   avgProd = sum(productionScore) / count
   avgFrust = sum(frustrationIndex) / count

4. Check thresholds:
   return avgComp >= 75 &&
          avgProd >= 70 &&
          avgFrust <= 40
```

## Examples

### Example A: New user (0 sessions)

**Input:**

- userId: 'user-1'
- requestedLayer: 'L3'
- Sessions: []

**Check:**

- L3: sessions.length < 5 → ineligible
- L2: sessions.length < 3 → ineligible

**Output:** 'L1'

### Example B: Intermediate user (4 sessions, good scores)

**Input:**

- userId: 'user-2'
- requestedLayer: 'L3'
- Sessions: 4 finished
  - Avg comp: 80
  - Avg prod: 75
  - Avg frust: 35

**Check:**

- L3: sessions.length = 4 < 5 → ineligible (need 5)
- L2: sessions.length = 4 ≥ 3, comp=80≥60, frust=35≤50 → eligible

**Output:** 'L2'

### Example C: Advanced user (8 sessions, excellent)

**Input:**

- userId: 'user-3'
- requestedLayer: 'L3'
- Sessions: 8 finished
  - Avg comp: 85
  - Avg prod: 80
  - Avg frust: 30

**Check:**

- L3: sessions=8≥5, comp=85≥75, prod=80≥70, frust=30≤40 → eligible

**Output:** 'L3'

### Example D: User with high frustration

**Input:**

- userId: 'user-4'
- requestedLayer: 'L2'
- Sessions: 5 finished
  - Avg comp: 70
  - Avg frust: 60 (too high!)

**Check:**

- L2: comp=70≥60 ✅, but frust=60>50 ❌ → ineligible

**Output:** 'L1'

## Failure modes & safeguards

**No sessions:**

- Return L1 (safe default)

**Incomplete outcomes:**

- Skip sessions without outcomes
- Only count sessions with all 3 scores

**Edge case: Exactly at threshold:**

- Use >= and <= (inclusive)
- Example: comp=60 is eligible for L2

**Fallback ordering:**

- Always L3→L2→L1 (never L3→L1 directly)

## Related docs

- [Business Rules Index](./00-rules-index.md)
- [Outcomes Scoring](./04-frustration-and-outcomes.md)
- [Unit Tests](../../08-testing/01-unit-tests.md#gating)
- [Session API](../../05-api/01-rest-contracts.md#sessions)

## Implementation

**File:** `services/api/src/gating/gating.service.ts`  
**Tests:** `services/api/test/unit/gating.service.spec.ts` (18 tests)

**Thresholds:**

```typescript
const L2_CRITERIA = {
  minSessions: 3,
  minComprehension: 60,
  maxFrustration: 50,
};

const L3_CRITERIA = {
  minSessions: 5,
  minComprehension: 75,
  minProduction: 70,
  maxFrustration: 40,
};
```
