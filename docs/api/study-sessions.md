# Cornell Script 3/5 - Study Sessions API Documentation

**Version:** 1.0.0  
**Base URL:** `/api`

---

## Authentication

All endpoints require JWT authentication via `Authorization: Bearer {token}` header.

---

## Endpoints

### 1. Start Reading Session

**POST** `/contents/:contentId/reading-sessions`

**Description:** Creates a new reading session in PRE phase. Auto-creates LearnerProfile if not exists.

**Parameters:**

- `contentId` (path) - Content UUID

**Response:**

```json
{
  "id": "uuid",
  "userId": "uuid",
  "contentId": "uuid",
  "phase": "PRE",
  "modality": "READING",
  "assetLayer": "L1",
  "goalStatement": null,
  "predictionText": null,
  "targetWordsJson": null,
  "startedAt": "2024-12-18T14:00:00Z",
  "finishedAt": null,
  "minTargetWords": 5,
  "content": {
    "id": "uuid",
    "title": "Quantum Physics Introduction",
    "type": "PDF"
  }
}
```

---

### 2. Get Session

**GET** `/reading-sessions/:id`

**Description:** Retrieves session details including outcome if finished.

**Parameters:**

- `id` (path) - Session UUID

**Response:**

```json
{
  "id": "uuid",
  "userId": "uuid",
  "contentId": "uuid",
  "phase": "DURING",
  "startedAt": "2024-12-18T14:00:00Z",
  "content": {
    "id": "uuid",
    "title": "Quantum Physics",
    "type": "PDF"
  },
  "outcome": null
}
```

**Errors:**

- `404` - Session not found
- `403` - Access denied (not your session)

---

### 3. Update Pre-Phase

**PUT** `/reading-sessions/:id/pre`

**Description:** Submits pre-reading form and advances to DURING phase.

**Parameters:**

- `id` (path) - Session UUID

**Request Body:**

```json
{
  "goalStatement": "Learn quantum physics basics",
  "predictionText": "Will cover wave-particle duality",
  "targetWordsJson": ["quantum", "photon", "wave", "particle", "duality"]
}
```

**Validation:**

- `goalStatement`: min 10 characters
- `predictionText`: min 10 characters
- `targetWordsJson`: min count based on education level (3-8)

**Response:**

```json
{
  "id": "uuid",
  "phase": "DURING",
  "goalStatement": "Learn quantum physics basics",
  "predictionText": "Will cover wave-particle duality",
  "targetWordsJson": ["quantum", "photon", "wave", "particle", "duality"]
}
```

**Errors:**

- `400` - Validation failed
- `400` - Session not in PRE phase
- `400` - Minimum N target words required

---

### 4. Record Event

**POST** `/reading-sessions/:id/events`

**Description:** Records a session event (tracking student interactions).

**Parameters:**

- `id` (path) - Session UUID

**Request Body:**

```json
{
  "eventType": "MARK_UNKNOWN_WORD",
  "payload": {
    "term": "quantum entanglement",
    "context": "page 5, paragraph 2"
  }
}
```

**Event Types:**
| Type | Purpose | Payload Example |
|------|---------|----------------|
| `MARK_UNKNOWN_WORD` | Student marks unknown term | `{term: "word", context: "..."}` |
| `MARK_KEY_IDEA` | Student highlights key concept | `{highlight_id: "uuid", note_snippet: "..."}` |
| `CHECKPOINT_RESPONSE` | Student answers checkpoint | `{checkpoint_id: "uuid", response_text: "..."}` |
| `QUIZ_RESPONSE` | Student answers quiz | `{quiz_id: "uuid", answer_text: "...", confidence: 0.8}` |
| `PRODUCTION_SUBMIT` | Student submits production text | `{text: "...", word_count: 50}` |

**Response:**

```json
{
  "id": "uuid",
  "readingSessionId": "uuid",
  "eventType": "MARK_UNKNOWN_WORD",
  "payloadJson": {...},
  "createdAt": "2024-12-18T14:30:00Z"
}
```

---

### 5. Advance Phase

**POST** `/reading-sessions/:id/advance`

**Description:** Advances session to next phase. Enforces DoD when finishing.

**Parameters:**

- `id` (path) - Session UUID

**Request Body:**

```json
{
  "toPhase": "POST"
}
```

**Valid Transitions:**

- `DURING` → `POST`
- `POST` → `FINISHED`

**DoD Requirements (for FINISHED):**

1. Cornell Notes summary exists
2. At least 1 quiz/checkpoint response
3. At least 1 production submission

**Response:**

```json
{
  "id": "uuid",
  "phase": "POST",
  "finishedAt": null
}
```

**Errors:**

- `400` - Invalid phase transition
- `400` - Cornell Notes summary required
- `400` - Quiz response required
- `400` - Production text required

---

## Data Models

### ReadingSession

```typescript
{
  id: string;
  userId: string;
  contentId: string;
  phase: 'PRE' | 'DURING' | 'POST' | 'FINISHED';
  modality: 'READING' | 'LISTENING' | 'WRITING';
  assetLayer: string;
  goalStatement?: string;
  predictionText?: string;
  targetWordsJson?: string[];
  startedAt: string;
  finishedAt?: string;
}
```

### SessionEvent

```typescript
{
  id: string;
  readingSessionId: string;
  eventType: EventType;
  payloadJson: any;
  createdAt: string;
}
```

### SessionOutcome

```typescript
{
  readingSessionId: string;
  comprehensionScore: number; // 0-100
  productionScore: number; // 0-100
  frustrationIndex: number; // 0-100
  computedAt: string;
}
```

---

## Education Levels & Target Words

| Level         | Min Words   |
| ------------- | ----------- |
| FUNDAMENTAL_1 | 3           |
| FUNDAMENTAL_2 | 4           |
| MEDIO         | 6           |
| SUPERIOR      | 8           |
| ADULTO_LEIGO  | 5 (default) |

---

## Integration Points

### Gamification

When session finishes:

- `minutesSpent` = finishedAt - startedAt
- `lessonsCompleted` += 1
- Streaks updated automatically

### Analytics

Session outcomes feed into student progress tracking.

---

## Example Flow

```bash
# 1. Start session
POST /contents/{id}/reading-sessions
→ PRE phase, minTargetWords: 5

# 2. Submit pre-phase
PUT /reading-sessions/{id}/pre
Body: {goal, prediction, [word1, word2, word3, word4, word5]}
→ DURING phase

# 3. Record events during reading
POST /reading-sessions/{id}/events
Body: {eventType: "MARK_UNKNOWN_WORD", payload: {term: "x"}}

# 4. Finish reading
POST /reading-sessions/{id}/advance
Body: {toPhase: "POST"}
→ POST phase

# 5. Complete DoD items
# - Write Cornell Notes summary
# - Answer quiz (via events)
# - Submit production text (via events)

# 6. Finish session
POST /reading-sessions/{id}/advance
Body: {toPhase: "FINISHED"}
→ FINISHED, outcomes computed, gamification triggered
```

---

## Error Handling

All endpoints return standard error format:

```json
{
  "statusCode": 400,
  "message": "Minimum 5 target words required for ADULTO_LEIGO level",
  "error": "Bad Request"
}
```

Common status codes:

- `400` - Validation error or business logic error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Resource not found
- `500` - Server error
