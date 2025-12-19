# Study Sessions Flow

**Purpose:** Document complete session lifecycle and Definition of Done  
**Audience:** Dev | Antigravity  
**Last updated:** 2025-12-18  
**Owner:** Engineering Team

## Invariants (cannot break)

- Sessions progress PRE → DURING → POST → FINISHED (unidirectional)
- Cannot finish without meeting DoD (3 requirements)
- DoD: 1) Cornell summary, 2) Quiz response, 3) Production task
- Session outcomes calculated once at FINISHED (immutable)
- Aborted sessions don't count for gating

## Scope

**In scope:**

- 4-phase session flow
- DoD validation
- Phase restrictions
- Outcome calculation

**Out of scope:**

- AI asset generation (separate)
- Billing/entitlements
- Session sharing/collaboration

## Interfaces / Contracts

**Tables:**

- `ReadingSession.phase` (PRE | DURING | POST | FINISHED)
- `ReadingSession.modality` (READING | LISTENING)
- `SessionEvent.eventType` (various)
- `SessionOutcome` (scores)
- `CornellNote.summaryText`

**Endpoints:**

- `POST /contents/{id}/sessions` - Create
- `PUT /sessions/{id}/pre` - Fill PRE data
- `POST /sessions/{id}/advance` - Advance phase
- `POST /sessions/{id}/events` - Record event

## Flows (step by step)

### Flow 1: PRE Phase

```
1. User creates session
   → POST /contents/{contentId}/sessions
   → Returns session with phase='PRE'

2. User fills PRE data:
   - goal: "Understand X and apply to Y"
   - targetWords: ['concept', 'application']
   - predictions: "I expect to learn..."

   → PUT /sessions/{sessionId}/pre

3. User clicks "Start Reading"
   → POST /sessions/{sessionId}/advance
   → body: { toPhase: 'DURING' }
   → Validates: can only advance from PRE
   → Returns session with phase='DURING'
```

### Flow 2: DURING Phase

```
1. User reads content
   - Scrolls through text
   - Can highlight text
   - Takes Cornell notes

2. System presents quiz/checkpoint
   - Automatic based on progress
   → POST /sessions/{sessionId}/events
   → body: { eventType: 'QUIZ_RESPONSE', payload: {...} }

3. User marks unknown words
   → POST /sessions/{sessionId}/events
   → body: { eventType: 'MARK_UNKNOWN_WORD', payload: {word} }

4. User finishes reading
   → POST /sessions/{sessionId}/advance
   → body: { toPhase: 'POST' }
   → Returns session with phase='POST'
```

### Flow 3: POST Phase

```
1. User reviews Cornell notes
   - Adds cue column
   - Writes summary (DoD requirement #1)

   Cornell autosave triggers
   → PUT /contents/{contentId}/cornell
   → body: { summaryText: "..." }

2. User completes production task (DoD requirement #3)
   - Create own example
   - Apply concept

   → POST /sessions/{sessionId}/events
   → body: { eventType: 'PRODUCTION_SUBMIT', payload: {...} }

3. User clicks "Finish Session"
   → POST /sessions/{sessionId}/advance
   → body: { toPhase: 'FINISHED' }

   System validates DoD:
   ✅ Check 1: Cornell summary exists
   ✅ Check 2: At least 1 quiz/checkpoint response
   ✅ Check 3: At least 1 production submission

   If ALL pass:
   → Calculate outcomes
   → Update session to FINISHED
   → Return session with outcomes

   If ANY fail:
   → throw BadRequestException
   → User stays in POST
```

### Flow 4: FINISHED State

```
Session is immutable:
- phase = 'FINISHED'
- finishedAt set
- outcomes calculated
- Used for gating eligibility
```

## Definition of Done (DoD)

### Requirement 1: Cornell Summary

```typescript
const cornellNote = await findCornellNote(sessionId);
const hasSummary = cornellNote?.summaryText?.trim().length > 0;

if (!hasSummary) {
  throw new BadRequestException("Cornell summary is required");
}
```

### Requirement 2: Quiz/Checkpoint Response

```typescript
const quizCount = await countEvents({
  sessionId,
  eventType: { in: ["QUIZ_RESPONSE", "CHECKPOINT_RESPONSE"] },
});

if (quizCount === 0) {
  throw new BadRequestException("At least 1 quiz/checkpoint required");
}
```

### Requirement 3: Production Submission

```typescript
const productionCount = await countEvents({
  sessionId,
  eventType: "PRODUCTION_SUBMIT",
});

if (productionCount === 0) {
  throw new BadRequestException("Production submission required");
}
```

## Examples

### Example A: Happy Path

```
User:
1. Create session → phase='PRE'
2. Fill goal + targets → PRE data saved
3. Advance → phase='DURING'
4. Answer 3 quizzes → events recorded ✅ (DoD #2)
5. Advance → phase='POST'
6. Write summary → cornell saved ✅ (DoD #1)
7. Submit production → event recorded ✅ (DoD #3)
8. Finish → SUCCESS, phase='FINISHED'
```

### Example B: Missing Summary

```
User:
1-5. (same as above)
6. Skip summary → no cornell ❌ (DoD #1 fail)
7. Submit production → ✅
8. Try to finish → ERROR: "Cornell summary required"
   User stays in POST
```

### Example C: Missing Production

```
User:
1-5. (same as above)
6. Write summary → ✅
7. Skip production → ❌ (DoD #3 fail)
8. Try to finish → ERROR: "Production submission required"
   User stays in POST
```

## Failure modes & safeguards

**Phase violations:**

- Can't advance PRE → POST (must go through DURING)
- Can't go backward (PRE ← DURING)
- Validate in controller

**DoD bypass attempts:**

- All checks run server-side
- Cannot set phase='FINISHED' directly
- Must use advancePhase endpoint

**Race conditions:**

- Use database transactions
- Lock session during phase transition

**Incomplete outcomes:**

- Only calculate if all event types present
- Fallback to 0 if missing data

## Related docs

- [Business Rules Index](../../02-business-rules/00-rules-index.md)
- [Outcomes Scoring](./04-frustration-and-outcomes.md)
- [Cornell API](../../05-api/01-rest-contracts.md#cornell)
- [E2E Tests](../../08-testing/03-e2e-tests.md#session-flow)

## Implementation

**Files:**

- `services/api/src/sessions/reading-sessions.service.ts`
- `services/api/src/sessions/reading-sessions.controller.ts`

**Tests:**

- Unit: DoD validation logic
- Integration: `test/integration/sessions.spec.ts` (6 tests)
- E2E: `frontend/tests/e2e/session-flow.spec.ts` (4 tests)
