# REST API Contracts

**Purpose:** Complete reference for all Cornell Reader API endpoints  
**Audience:** Dev | Frontend | API Consumers  
**Last updated:** 2025-12-18  
**Owner:** Engineering Team

## Invariants (cannot break)

- All endpoints require JWT authentication (except /auth/\*)
- All requests/responses are JSON
- Timestamps in ISO 8601 format (UTC)
- IDs are CUIDs
- HTTP status codes follow REST conventions

## Base URL

**Local:** `http://localhost:4000`  
**Production:** `https://api.cornellreader.com`

---

## Authentication

### POST /auth/login

**Purpose:** Authenticate user and get tokens

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response 200:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Errors:**

- 401: Invalid credentials
- 400: Validation error

---

### POST /auth/refresh

**Purpose:** Refresh expired access token

**Request:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 200:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Content Management

### POST /contents

**Purpose:** Upload new content

**Auth:** Required (JWT)

**Request:**

```json
{
  "title": "Introduction to Machine Learning",
  "type": "PDF",
  "originalLanguage": "EN",
  "rawText": "Machine learning is a subset of AI..."
}
```

**Response 201:**

```json
{
  "id": "content_abc123",
  "userId": "user_123",
  "title": "Introduction to Machine Learning",
  "type": "PDF",
  "originalLanguage": "EN",
  "createdAt": "2025-12-18T19:30:00.000Z"
}
```

**Errors:**

- 400: Invalid type or missing required fields
- 401: Unauthorized

---

### GET /contents

**Purpose:** List user's content

**Auth:** Required (JWT)

**Query Params:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `type` (optional): Filter by type (PDF, DOCX, IMAGE, TEXT)

**Request:**

```
GET /contents?page=1&limit=20&type=PDF
```

**Response 200:**

```json
{
  "data": [
    {
      "id": "content_abc123",
      "title": "Introduction to ML",
      "type": "PDF",
      "originalLanguage": "EN",
      "createdAt": "2025-12-18T19:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### GET /contents/:id

**Purpose:** Get content details

**Auth:** Required (JWT)

**Response 200:**

```json
{
  "id": "content_abc123",
  "userId": "user_123",
  "title": "Introduction to Machine Learning",
  "type": "PDF",
  "originalLanguage": "EN",
  "rawText": "Machine learning is...",
  "chunks": [
    {
      "id": "chunk_1",
      "chunkIndex": 0,
      "text": "Machine learning is a subset..."
    }
  ],
  "createdAt": "2025-12-18T19:30:00.000Z"
}
```

**Errors:**

- 404: Content not found
- 403: Not content owner

---

### DELETE /contents/:id

**Purpose:** Delete content

**Auth:** Required (JWT)

**Response 204:** No content

**Errors:**

- 404: Content not found
- 403: Not content owner

---

## Sessions

### POST /contents/:id/sessions

**Purpose:** Create new reading session

**Auth:** Required (JWT)

**Request:**

```json
{
  "modality": "READING"
}
```

**Response 201:**

```json
{
  "id": "session_xyz789",
  "userId": "user_123",
  "contentId": "content_abc123",
  "phase": "PRE",
  "modality": "READING",
  "startedAt": "2025-12-18T19:30:00.000Z"
}
```

**Errors:**

- 404: Content not found
- 400: Invalid modality

---

### GET /sessions

**Purpose:** List user's sessions

**Auth:** Required (JWT)

**Query Params:**

- `contentId` (optional): Filter by content
- `phase` (optional): Filter by phase (PRE, DURING, POST, FINISHED)
- `page`, `limit`: Pagination

**Response 200:**

```json
{
  "data": [
    {
      "id": "session_xyz789",
      "contentId": "content_abc123",
      "phase": "FINISHED",
      "startedAt": "2025-12-18T19:00:00.000Z",
      "finishedAt": "2025-12-18T20:30:00.000Z",
      "outcome": {
        "comprehensionScore": 85,
        "productionScore": 78,
        "frustrationIndex": 35
      }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 12 }
}
```

---

### GET /sessions/:id

**Purpose:** Get session details

**Auth:** Required (JWT)

**Response 200:**

```json
{
  "id": "session_xyz789",
  "userId": "user_123",
  "contentId": "content_abc123",
  "phase": "POST",
  "modality": "READING",
  "preGoal": "Understand ML basics",
  "preTargetWords": ["algorithm", "dataset", "model"],
  "prePredictions": "I expect to learn about supervised learning",
  "startedAt": "2025-12-18T19:30:00.000Z",
  "finishedAt": null,
  "events": [
    {
      "id": "event_1",
      "eventType": "QUIZ_RESPONSE",
      "payloadJson": { "correct": true },
      "createdAt": "2025-12-18T19:45:00.000Z"
    }
  ]
}
```

---

### PUT /sessions/:id/pre

**Purpose:** Fill PRE phase data

**Auth:** Required (JWT)

**Request:**

```json
{
  "goal": "Understand the basics of machine learning",
  "targetWords": ["algorithm", "dataset", "model", "training"],
  "predictions": "I expect to learn about supervised and unsupervised learning"
}
```

**Response 200:**

```json
{
  "id": "session_xyz789",
  "phase": "PRE",
  "preGoal": "Understand the basics of machine learning",
  "preTargetWords": ["algorithm", "dataset", "model", "training"],
  "prePredictions": "I expect to learn about..."
}
```

**Errors:**

- 400: Session not in PRE phase
- 404: Session not found

---

### POST /sessions/:id/advance

**Purpose:** Advance session to next phase

**Auth:** Required (JWT)

**Request:**

```json
{
  "toPhase": "DURING"
}
```

**Valid transitions:**

- PRE → DURING
- DURING → POST
- POST → FINISHED (requires DoD)

**Response 200:**

```json
{
  "id": "session_xyz789",
  "phase": "DURING",
  "startedAt": "2025-12-18T19:30:00.000Z"
}
```

**Errors:**

- 400: Invalid phase transition
- 400: DoD not met (when advancing to FINISHED)
  ```json
  {
    "statusCode": 400,
    "message": "Cornell summary is required to finish session",
    "error": "Bad Request"
  }
  ```

---

### POST /sessions/:id/events

**Purpose:** Record session event

**Auth:** Required (JWT)

**Request (Quiz):**

```json
{
  "eventType": "QUIZ_RESPONSE",
  "payload": {
    "questionId": "q_1",
    "correct": true,
    "userAnswer": "B",
    "correctAnswer": "B"
  }
}
```

**Request (Unknown Word):**

```json
{
  "eventType": "MARK_UNKNOWN_WORD",
  "payload": {
    "word": "algorithm",
    "context": "The algorithm processes the data..."
  }
}
```

**Request (Production):**

```json
{
  "eventType": "PRODUCTION_SUBMIT",
  "payload": {
    "text": "In my work, I could use ML to predict customer churn by...",
    "targetWordsUsed": ["algorithm", "model"]
  }
}
```

**Response 201:**

```json
{
  "id": "event_123",
  "sessionId": "session_xyz789",
  "eventType": "QUIZ_RESPONSE",
  "payloadJson": { "correct": true },
  "createdAt": "2025-12-18T19:45:00.000Z"
}
```

---

## Cornell Notes

### GET /contents/:id/cornell

**Purpose:** Get or auto-create Cornell notes

**Auth:** Required (JWT)

**Query Params:**

- `sessionId` (optional): Specific session's notes

**Response 200 (Existing):**

```json
{
  "id": "cornell_1",
  "userId": "user_123",
  "contentId": "content_abc123",
  "readingSessionId": "session_xyz789",
  "mainNotes": {
    "1": "ML is a subset of AI",
    "2": "Supervised learning uses labeled data"
  },
  "cueColumn": "What is ML?\nWhat is supervised learning?",
  "summaryText": "Machine learning uses algorithms to learn patterns from data...",
  "createdAt": "2025-12-18T19:30:00.000Z",
  "updatedAt": "2025-12-18T20:00:00.000Z"
}
```

**Response 200 (Auto-created):**

```json
{
  "id": "cornell_2",
  "userId": "user_123",
  "contentId": "content_abc123",
  "mainNotes": {},
  "cueColumn": null,
  "summaryText": null,
  "createdAt": "2025-12-18T20:05:00.000Z",
  "updatedAt": "2025-12-18T20:05:00.000Z"
}
```

---

### PUT /contents/:id/cornell

**Purpose:** Save Cornell notes (autosave)

**Auth:** Required (JWT)

**Request:**

```json
{
  "mainNotes": {
    "1": "ML is a subset of AI",
    "2": "Supervised learning uses labeled data",
    "3": "Unsupervised learning finds patterns"
  },
  "cueColumn": "What is ML?\nWhat is supervised learning?\nWhat is unsupervised learning?",
  "summaryText": "Machine learning is a field of AI that enables computers to learn from data without explicit programming."
}
```

**Response 200:**

```json
{
  "id": "cornell_1",
  "mainNotes": {
    "1": "ML is...",
    "2": "Supervised...",
    "3": "Unsupervised..."
  },
  "cueColumn": "What is ML?...",
  "summaryText": "Machine learning is...",
  "updatedAt": "2025-12-18T20:10:00.000Z"
}
```

---

### POST /contents/:id/highlights

**Purpose:** Create highlight linked to Cornell note

**Auth:** Required (JWT)

**Request:**

```json
{
  "highlightedText": "supervised learning",
  "anchorJson": {
    "pageNumber": 2,
    "coords": [100, 200, 250, 220]
  },
  "linkedNoteId": "2",
  "type": "DEFINITION",
  "color": "#FFEB3B"
}
```

**Response 201:**

```json
{
  "id": "highlight_1",
  "cornellNoteId": "cornell_1",
  "highlightedText": "supervised learning",
  "anchorJson": { "pageNumber": 2, "coords": [100, 200, 250, 220] },
  "linkedNoteId": "2",
  "type": "DEFINITION",
  "color": "#FFEB3B",
  "createdAt": "2025-12-18T20:15:00.000Z"
}
```

---

### DELETE /highlights/:id

**Purpose:** Delete highlight

**Auth:** Required (JWT)

**Response 204:** No content

---

## Review & SRS

### GET /review/queue

**Purpose:** Get vocabulary due for review

**Auth:** Required (JWT)

**Query Params:**

- `limit` (optional): Max items (default: uses dailyReviewCap from profile)

**Response 200:**

```json
{
  "queue": [
    {
      "id": "vocab_1",
      "word": "algorithm",
      "language": "EN",
      "srsStage": "D3",
      "dueAt": "2025-12-17T10:00:00.000Z",
      "lapseCount": 0,
      "masteryScore": 65,
      "definition": "A step-by-step procedure..."
    },
    {
      "id": "vocab_2",
      "word": "dataset",
      "language": "EN",
      "srsStage": "D1",
      "dueAt": "2025-12-18T08:00:00.000Z",
      "lapseCount": 1,
      "masteryScore": 40
    }
  ],
  "meta": {
    "totalDue": 15,
    "inQueue": 2,
    "dailyCap": 20
  }
}
```

---

### POST /review/attempt

**Purpose:** Submit vocabulary review attempt

**Auth:** Required (JWT)

**Request:**

```json
{
  "vocabItemId": "vocab_1",
  "result": "OK"
}
```

**Valid results:** `FAIL`, `HARD`, `OK`, `EASY`

**Response 200:**

```json
{
  "vocabItem": {
    "id": "vocab_1",
    "word": "algorithm",
    "srsStage": "D7",
    "dueAt": "2025-12-25T19:30:00.000Z",
    "lapseCount": 0,
    "masteryScore": 75,
    "lastReviewedAt": "2025-12-18T19:30:00.000Z"
  },
  "attempt": {
    "id": "attempt_1",
    "result": "OK",
    "attemptedAt": "2025-12-18T19:30:00.000Z"
  },
  "transition": {
    "from": "D3",
    "to": "D7",
    "daysAdded": 7,
    "masteryDelta": +10
  }
}
```

**Errors:**

- 404: Vocab item not found
- 400: Invalid result

---

### GET /review/stats

**Purpose:** Get review statistics

**Auth:** Required (JWT)

**Response 200:**

```json
{
  "today": {
    "reviewed": 12,
    "remaining": 8,
    "accuracy": 0.83
  },
  "lifetime": {
    "totalReviews": 456,
    "totalWords": 234,
    "averageAccuracy": 0.78,
    "mastered": 45
  },
  "upcoming": {
    "tomorrow": 15,
    "nextWeek": 67,
    "total": 234
  }
}
```

---

## AI Assets (Gated)

### POST /assets/quiz/:layer

**Purpose:** Generate AI quiz for layer

**Auth:** Required (JWT)

**Path Params:**

- `layer`: L1, L2, or L3

**Request:**

```json
{
  "contentId": "content_abc123",
  "count": 5
}
```

**Response 200:**

```json
{
  "quiz": [
    {
      "id": "q_1",
      "question": "What is the main purpose of supervised learning?",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "B",
      "explanation": "Supervised learning uses labeled data..."
    }
  ],
  "layer": "L2",
  "generatedAt": "2025-12-18T19:30:00.000Z"
}
```

**Errors:**

- 403: User not eligible for layer
- 400: Invalid layer

---

### POST /assets/glossary

**Purpose:** Generate glossary for content

**Auth:** Required (JWT)

**Request:**

```json
{
  "contentId": "content_abc123",
  "targetWords": ["algorithm", "dataset", "model"]
}
```

**Response 200:**

```json
{
  "glossary": [
    {
      "term": "algorithm",
      "definition": "A step-by-step procedure for solving a problem",
      "example": "The sorting algorithm organizes data efficiently"
    }
  ]
}
```

---

## Common Patterns

### Pagination

All list endpoints support:

```
?page=1&limit=20
```

Response includes `meta`:

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

---

### Error Format

All errors follow:

```json
{
  "statusCode": 400,
  "message": "Validation failed: field is required",
  "error": "Bad Request"
}
```

---

### Rate Limiting

Headers in all responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1702923600
```

When exceeded (429):

```json
{
  "statusCode": 429,
  "message": "Rate limit exceeded",
  "retryAfter": 42
}
```

---

## Related docs

- [API Overview](./00-api-overview.md)
- [Authentication](./02-auth.md)
- [Error Codes](./03-error-codes.md)
- [Business Rules](../../02-business-rules/00-rules-index.md)
- [Data Schema](../../04-data/00-schema.md)

## Testing

- Integration tests: `services/api/test/integration/`
- Swagger UI: `http://localhost:4000/api/docs`
- Postman collection: `docs/cornell-reader-api.postman_collection.json`
