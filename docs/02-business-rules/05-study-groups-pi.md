# Study Groups - Business Rules (Peer Instruction Sprint)

**Purpose:** Define deterministic rules for Study Groups collaborative sessions  
**Audience:** Dev | Antigravity  
**Last updated:** 2025-12-18  
**Owner:** Engineering Team

## Invariants (cannot break)

- Role rotation is automatic and deterministic
- Accountability gates prevent invalid state transitions
- Timers are enforced based on layer
- Cornell Notes remain private (per user)
- Shared Cards are the collaborative output artifact

---

## 1. Group Membership & Roles

### Persistent Roles (`StudyGroupMember.role`)

| Role       | Permissions                                                 |
| ---------- | ----------------------------------------------------------- |
| **OWNER**  | Full control: delete group, modify settings, manage members |
| **MOD**    | Moderate: kick members, manage content playlist             |
| **MEMBER** | Participate: join sessions, vote, discuss                   |

### Membership Status (`StudyGroupMember.status`)

- `ACTIVE`: Can join sessions
- `INVITED`: Pending acceptance
- `REMOVED`: No access

---

## 2. Session Roles (Ephemeral, Rotated)

### Roles (`GroupSessionMember.assignedRole`)

Each session assigns **5 roles** to participants:

| Role            | Responsibility                                   |
| --------------- | ------------------------------------------------ |
| **FACILITATOR** | Guides discussion, ensures all voices heard      |
| **TIMEKEEPER**  | Monitors round timers, signals phase transitions |
| **CLARIFIER**   | Asks clarifying questions, ensures understanding |
| **CONNECTOR**   | Links concepts to prior knowledge/real-world     |
| **SCRIBE**      | Documents consensus, submits `SharedCard`        |

### Rotation Algorithm (Deterministic)

```typescript
// Pseudocode
function assignRoles(session: GroupSession, members: User[]) {
  const sortedMembers = members.sort((a, b) => a.id.localeCompare(b.id)); // Stable sort
  const prevSessionCount = getPreviousSessionCount(session.groupId);
  const offset = prevSessionCount % sortedMembers.length;

  const roles = [
    "FACILITATOR",
    "TIMEKEEPER",
    "CLARIFIER",
    "CONNECTOR",
    "SCRIBE",
  ];

  for (let i = 0; i < Math.min(sortedMembers.length, 5); i++) {
    const memberIndex = (i + offset) % sortedMembers.length;
    const role = roles[i];
    assignRole(sortedMembers[memberIndex], role);
  }

  // If < 5 members, reduce roles (priority order maintained)
}
```

**Rules:**

- ✅ Offset increments by 1 each new session
- ✅ If group has < 5 members, skip lower-priority roles (CONNECTOR, SCRIBE optional)
- ✅ Minimum 2 members required (FACILITATOR + TIMEKEEPER)

---

## 3. Peer Instruction (PI) Round Flow

### Round Phases (State Machine)

```
CREATED → VOTING → DISCUSSING → REVOTING → EXPLAINING → DONE
```

### Timers by Layer

Stored in `GroupRound.timingJson`:

```json
// L1 (Fundamental)
{
  "voteSec": 60,
  "discussSec": 180,
  "revoteSec": 60,
  "explainSec": 180
}

// L2/L3 (Advanced)
{
  "voteSec": 90,
  "discussSec": 240,
  "revoteSec": 90,
  "explainSec": 240
}
```

---

## 4. Accountability Gates (DoD per Phase)

### Transition: VOTING → DISCUSSING

**Gate:** All `JOINED` members must have submitted `PI_VOTE_SUBMIT` event.

```sql
SELECT COUNT(DISTINCT gm.user_id) AS joined_count
FROM group_session_members gm
WHERE gm.session_id = :sessionId AND gm.attendance_status = 'JOINED';

SELECT COUNT(DISTINCT ge.user_id) AS voted_count
FROM group_events ge
WHERE ge.round_id = :roundId AND ge.event_type = 'PI_VOTE_SUBMIT';

-- joined_count == voted_count → ALLOW transition
```

### Transition: REVOTING → EXPLAINING

**Gate:** All `JOINED` members must have submitted `PI_REVOTE_SUBMIT`.

### Transition: EXPLAINING → DONE

**Gate:** SCRIBE must have submitted `GROUP_EXPLANATION_SUBMIT`.

```sql
-- Must exist
SELECT * FROM group_events
WHERE round_id = :roundId AND event_type = 'GROUP_EXPLANATION_SUBMIT';
```

---

## 5. Shared Card (Artifact)

### Schema (`SharedCard.cardJson`)

```json
{
  "prompt": "What is the main idea of this passage?",
  "groupAnswer": "The passage discusses...",
  "explanation": "We reached this consensus because...",
  "linkedHighlightIds": ["hl_123", "hl_456"],
  "keyTerms": ["term1", "term2"]
}
```

### Creation Rules

- ✅ One `SharedCard` per `GroupRound`
- ✅ Created by user with `SCRIBE` role
- ✅ Immutable after round status = `DONE`

---

## 6. Privacy & Ownership

### Private (User-scoped)

- `CornellNotes` (existing)
- `Highlights` (existing)
- Individual votes (`GroupEvent` with `userId`)

### Shared (Group-scoped)

- `SharedCard` (collaborative output)
- Aggregate results (vote distribution, consensus level)

**Rule:** Cannot access another user's Cornell Notes even within the same group.

---

## 7. Event Types

### `GroupEvent.eventType`

| Type                       | Payload Example      |
| -------------------------- | -------------------- |
| `PI_VOTE_SUBMIT`           | `{"optionIndex": 2}` |
| `PI_REVOTE_SUBMIT`         | `{"optionIndex": 1}` |
| `GROUP_EXPLANATION_SUBMIT` | `{"text": "..."}`    |
| `USER_JOIN`                | `{}`                 |
| `USER_LEAVE`               | `{}`                 |

---

## 8. Implementation Checklist (Script 1/3 DoD)

- [x] Tables created (`StudyGroup`, `GroupSession`, `GroupRound`, etc.)
- [x] Enums defined (`GroupRole`, `SessionRole`, `RoundStatus`)
- [x] Relations to `User` and `Content`
- [x] Rules documented
- [ ] **Next (Script 2/3):** Service layer (role assignment logic, accountability gates)
- [ ] **Next (Script 3/3):** API controllers + Frontend

---

## Related

- [Study Sessions (Individual)](./01-study-sessions.md)
- [SRS](./02-srs.md)
- [Schema](../../04-data/00-schema.md)

## Implementation

**Schema:** `services/api/prisma/schema.prisma`  
**Models:** 8 new tables, 6 enums  
**Status:** ✅ Script 1/3 Complete (Data layer)
