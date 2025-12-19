# ADR-0004 — SRS & Gating as Deterministic Logic

**Status:** Accepted  
**Date:** 2024-12-10  
**Context:** Decide whether SRS and Gating should use AI or fixed algorithms

## Decision

**SRS (Spaced Repetition) is 100% deterministic:**

- Fixed formula for stage transitions
- Hardcoded intervals (D1=1 day, D3=3 days, etc.)
- Explicit result mapping (FAIL→D1, HARD→regress, OK→advance, EASY→skip)
- No ML/AI involvement

**Gating (Layer Eligibility) is 100% deterministic:**

- Fixed thresholds (L2: 3 sessions + comp≥60, L3: 5 sessions + comp≥75, etc.)
- Simple average calculation
- Clear fallback logic (L3→L2→L1)
- No ML/AI involvement

## Consequences

**Positive:**

- **Predictable:** Users always know what to expect
- **Testable:** 100% unit test coverage possible (49 tests written)
- **Debuggable:** Easy to trace exactly why a result occurred
- **Fast:** No API calls, instant calculation
- **Reliable:** Never fails, no downtime from AI services
- **Fair:** Same rules for everyone, no bias

**Negative:**

- **Rigid:** Can't adapt to individual learning patterns
- **Generic:** Same intervals for everyone
- **Manual tuning:** Need to manually adjust thresholds

**Neutral:**

- Can add AI suggestions ON TOP without breaking core
- Users can see both: "SRS says D3, AI suggests D5"

## Alternatives Considered

### 1. AI-Based SRS

**Rejected because:**

- Unpredictable (user confusion)
- Slow (API latency)
- Expensive (every review = API call)
- Unreliable (API downtime = broken reviews)
- Hard to test
- Potential bias

### 2. Hybrid (AI suggestions + deterministic default)

**Rejected for v1, possible for v2:**

- Added complexity
- Need user research first
- Core should work without AI

### 3. Configurable parameters (user chooses intervals)

**Rejected because:**

- Most users don't know optimal intervals
- Creates inconsistent experience
- Hard to compare users

## Rationale

**Why deterministic wins:**

1. **Trust:** Users trust predictable systems
2. **Testing:** v1 needs to be rock-solid
3. **Performance:** Fast > Smart for core features
4. **Debugging:** Easy to help users
5. **Science:** SM-2 algorithm is proven (40+ years)

**SRS specifically:**

- Research-backed intervals (SM-2, Anki)
- Proven effective for millions of users
- Simple beats complex for v1

**Gating specifically:**

- Clear progression
- Motivates users (visible thresholds)
- Easy to explain in UI

## Implementation

**SRS constants:**

```typescript
STAGE_ORDER = ['NEW', 'D1', 'D3', 'D7', 'D14', 'D30', 'D60', 'MASTERED']
INTERVAL_DAYS = { NEW: 0, D1: 1, D3: 3, ... }
```

**Gating thresholds:**

```typescript
L2_CRITERIA = { minSessions: 3, minComp: 60, maxFrust: 50 };
L3_CRITERIA = { minSessions: 5, minComp: 75, minProd: 70, maxFrust: 40 };
```

## Future Considerations

**V2 possibilities:**

- AI-suggested study schedule (not intervals)
- Personalized L2/L3 recommendations
- Adaptive interval hints (still using deterministic core)

**Non-negotiable:**

- Core SRS transitions stay deterministic
- Core gating criteria stay deterministic
- AI only adds suggestions, never replaces

## Links

- [SRS Documentation](../../02-business-rules/02-srs.md)
- [Gating Documentation](../../02-business-rules/03-gating-layers.md)
- [Rules Index](../../02-business-rules/00-rules-index.md)
- [Unit Tests](../../08-testing/01-unit-tests.md)
