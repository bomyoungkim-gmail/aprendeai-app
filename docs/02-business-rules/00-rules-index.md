# Business Rules Index

**Purpose:** Central index separating deterministic core logic from AI suggestions  
**Audience:** Dev | Antigravity  
**Last updated:** 2025-12-18  
**Owner:** Engineering Team

---

## ⚠️ CRITICAL: Deterministic vs AI

Cornell Reader has **TWO types of logic:**

### 🎯 DETERMINISTIC (Core - Cannot be wrong)

These rules are **hard-coded, tested, and must be 100% reliable:**

| Rule                 | File                                                               | Tests         | Status |
| -------------------- | ------------------------------------------------------------------ | ------------- | ------ |
| **SRS Transitions**  | [02-srs.md](./02-srs.md)                                           | 31 unit tests | ✅     |
| **Gating L2/L3**     | [03-gating-layers.md](./03-gating-layers.md)                       | 18 unit tests | ✅     |
| **Session DoD**      | [01-study-sessions.md](./01-study-sessions.md)                     | 4 E2E tests   | ✅     |
| **Outcomes Scoring** | [04-frustration-and-outcomes.md](./04-frustration-and-outcomes.md) | Covered       | ✅     |
| **Entitlements**     | ../../01-product/03-entitlements-and-limits.md                     | TBD           | 🟡     |

**These can NEVER fail silently. Changes require:**

- Unit tests
- Integration tests
- Doc update
- ADR if significant

---

### 🤖 AI-POWERED (Suggestions - Can be improved)

These use LLMs and can be adjusted/improved:

| Feature                 | File                                              | Provider                        | Fallback                       |
| ----------------------- | ------------------------------------------------- | ------------------------------- | ------------------------------ |
| **Asset Generation**    | ../../07-jobs-and-ai/02-ai-pipelines-langgraph.md | Multi (OpenAI/Anthropic/Gemini) | Return error, don't block user |
| **Cue Suggestions**     | ../../07-jobs-and-ai/03-prompting-and-schemas.md  | Cost-optimized                  | User can ignore                |
| **Glossary Generation** | ../../07-jobs-and-ai/03-prompting-and-schemas.md  | Cost-optimized                  | User can edit                  |
| **Production Feedback** | ../../07-jobs-and-ai/04-ai-guardrails.md          | Filtered                        | Optional                       |

**These can fail gracefully. Just log and degrade.**

---

## 📖 Deterministic Rules Detail

### 1. SRS (Spaced Repetition System)

**File:** [02-srs.md](./02-srs.md)

**What it does:**

- Calculates next review date for vocabulary
- Manages SRS stages (NEW → D1 → D3 → ... → MASTERED)
- Handles attempt results (FAIL, HARD, OK, EASY)

**Invariants:**

- FAIL always resets to D1
- Floor is D1 (can't go below)
- Ceiling is MASTERED (stays there on OK/EASY)
- Date calculations use `addDays` (deterministic)

**Tests:** 31 unit tests covering all transitions

---

### 2. Gating (Layer Eligibility)

**File:** [03-gating-layers.md](./03-gating-layers.md)

**What it does:**

- Determines if user can access L2 or L3
- Checks historical performance
- Enforces fallback (L3→L2→L1)

**Invariants:**

- L1 always available
- L2 requires: 3 sessions, comp≥60, frust≤50
- L3 requires: 5 sessions, comp≥75, prod≥70, frust≤40
- Uses last 10 sessions for calculation

**Tests:** 18 unit tests for all criteria

---

### 3. Definition of Done (DoD)

**File:** [01-study-sessions.md](./01-study-sessions.md#dod)

**What it does:**

- Blocks session completion until requirements met
- Validates POST phase before FINISHED

**Invariants:**

1. Cornell summary must exist (`summaryText.trim().length > 0`)
2. At least 1 quiz/checkpoint response
3. At least 1 production submission

**Tests:** 4 E2E tests (2 reject, 1 accept, 1 stats)

---

### 4. Outcomes & Scoring

**File:** [04-frustration-and-outcomes.md](./04-frustration-and-outcomes.md)

**What it does:**

- Calculates comprehension score (quiz + checkpoints)
- Calculates production score
- Calculates frustration index

**Invariants:**

- Scores are 0-100
- Comprehension: 60% quiz + 40% checkpoints
- Frustration: based on unknown_rate + time_variance
- Calculated once per session (immutable after)

---

## 🔄 Rule Change Process

### For DETERMINISTIC rules:

1. **Propose change** (ADR)
2. **Update code** (services/api/src/\*)
3. **Update tests** (test/unit/\*)
4. **Update docs** (docs/02-business-rules/\*)
5. **PR review** (require 2 approvals)
6. **Deploy** (with monitoring)

**Example commits:**

- `feat(srs): change D60 to D90`
- `docs(srs): update interval invariants`
- `test(srs): add D90 transition tests`

---

### For AI rules:

1. **Adjust prompt/model**
2. **Test manually**
3. **Update prompt docs**
4. **Deploy** (can iterate fast)

---

## 📊 Rule Coverage

| Category  | Documented | Tested       | CI Verified |
| --------- | ---------- | ------------ | ----------- |
| SRS       | ✅         | ✅ (31)      | ✅          |
| Gating    | ✅         | ✅ (18)      | ✅          |
| DoD       | ✅         | ✅ (4 E2E)   | ✅          |
| Outcomes  | ✅         | ✅ (covered) | ✅          |
| AI Assets | ✅         | ⚠️ (mocked)  | -           |

---

## ⚠️ Common Pitfalls

### Don't confuse AI with deterministic

- ❌ "SRS can use AI to suggest better intervals"
- ✅ "SRS follows fixed formula, AI can suggest study schedule"

### Don't silently fail deterministic rules

- ❌ `try { applyDoD() } catch { /* ignore */ }`
- ✅ `if (!meetsDoD()) throw BadRequestException()`

### Don't skip tests on rule changes

- ❌ "Small SRS tweak, no test needed"
- ✅ "Even 1-line change needs test update"

---

## Related Docs

- [SRS System](./02-srs.md)
- [Gating Layers](./03-gating-layers.md)
- [Study Sessions](./01-study-sessions.md)
- [Outcomes](./04-frustration-and-outcomes.md)
- [AI Pipelines](../../07-jobs-and-ai/02-ai-pipelines-langgraph.md)
- [Testing Strategy](../../08-testing/00-testing-strategy.md)
