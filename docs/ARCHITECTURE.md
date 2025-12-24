# AprendeAI - Architecture Overview

**Version**: 3.0  
**Last Updated**: 2025-12-23  
**Status**: Phase 3 Complete + AI Games System ✅  
**Latest Addition**: 6 Pedagogical Games + Advanced Infrastructure

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────┐
│                   Users/Clients                     │
└─────────────────────┬───────────────────────────────┘
                      │
                      │ HTTPS
                      ↓
┌─────────────────────────────────────────────────────┐
│              Frontend (Next.js 14)                  │
│                Port 3000                            │
│  ┌──────────────────────────────────────────────┐  │
│  │  Pages Layer                                 │  │
│  │  - /reading/[sessionId]  (Phase 3)           │  │
│  │  - /games                (NEW - Dec 2025)    │  │
│  │  - /dashboard                                │  │
│  │  - /groups                                   │  │
│  │  - /extension/verify     (Phase 5)           │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │  Components                                  │  │
│  │  - PromptConsole (Phase 3)                   │  │
│  │  - CornellLayout (existing)                  │  │
│  │  - Family components                         │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │  State Management                            │  │
│  │  - SessionContext (EXTENDED Phase 3)         │  │
│  │  - GroupContext                              │  │
│  │  - AuthContext                               │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────┘
                      │
                      │ REST API
                      ↓
┌─────────────────────────────────────────────────────┐
│           Backend API (NestJS)                      │
│                Port 4000                            │
│  ┌──────────────────────────────────────────────┐  │
│  │  Controllers                                 │  │
│  │  - SessionsController (Phase 1)              │  │
│  │  - GroupsController                          │  │
│  │  - AuthController                            │  │
│  │  - VocabController                           │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │  Services                                    │  │
│  │  - ReadingSessionsService                    │  │
│  │  - QuickCommandParser (Phase 1)              │  │
│  │  - VocabService                              │  │
│  │  - AiServiceClient (Phase 2)                 │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │  Event Listeners                             │  │
│  │  - VocabCaptureListener (Phase 1)            │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │  Database (Prisma ORM)                       │  │
│  │  - PostgreSQL                                │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────┘
                      │
                      │ HTTP
                      ↓
┌─────────────────────────────────────────────────────┐
│         AI Service (FastAPI + LangGraph)            │
│                Port 8001                            │
│  ┌──────────────────────────────────────────────┐  │
│  │  Educator Agent (Phase 2)                    │  │
│  │  ┌──────────┬──────────┬──────────┐          │  │
│  │  │ PRE Node │DURING Nd │ POST Node│          │  │
│  │  │ (goal,   │(check-   │(recall,  │          │  │
│  │  │ predict) │points)   │quiz)     │          │  │
│  │  └──────────┴──────────┴──────────┘          │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │  AI Games System (NEW - Dec 2025)            │  │
│  │  ┌──────────────────────────────────────┐    │  │
│  │  │ 6 Games: FREE_RECALL, CLOZE_SPRINT,  │    │  │
│  │  │ SRS_ARENA, BOSS_FIGHT, WORD_HUNT,    │    │  │
│  │  │ MISCONCEPTION_HUNT                   │    │  │
│  │  └──────────────────────────────────────┘    │  │
│  │  ┌──────────────────────────────────────┐    │  │
│  │  │ Infrastructure: Mastery Tracking,    │    │  │
│  │  │ Difficulty Adapter, Rewards System   │    │  │
│  │  └──────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │  LLM Factory (Phase 2)                       │  │
│  │  - gpt-4o-mini (cheap)                       │  │
│  │  - gpt-4o (smart)                            │  │
│  │  - Embeddings                                │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │  Utils                                       │  │
│  │  - NestJSClient (calls API)                  │  │
│  │  - ContextBuilder                            │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────┘
                      │
                      │ API Calls
                      ↓
                  OpenAI API
```

### Worker Services Architecture (Implemented)

```
┌─────────────────────────────────────────────────────┐
│                  RabbitMQ Queues                    │
│                    Port 5672                        │
└────┬────────┬────────┬────────┬────────────────────┘
     │        │        │        │
     │        │        │        │
   Queue    Queue    Queue    Queue
  extract  process   news    arxiv
     │        │        │        │
     ↓        ↓        ↓        ↓
┌─────────┐ ┌────────┐ ┌──────┐ ┌──────┐
│Extractn │ │Content │ │News  │ │Arxiv │
│Worker   │ │Process │ │Ingst │ │Ingst │
└────┬────┘ └────┬───┘ └───┬──┘ └───┬──┘
     │           │         │        │
     │           └────┬────┴────────┘
     │                │
     └────────────────┼───► API (Port 4000)
                      │
                      └───► AI Service (Port 8001)
```

### Chrome Extension Architecture (Phase 5)

```
┌─────────────────────────────────────────────────────┐
│              Chrome Extension                       │
│  ┌──────────────────────────────────────────────┐  │
│  │  Background Service Worker                   │  │
│  │  - AuthHandler (Device Code Flow)            │  │
│  │  - ContextMenuHandler                        │  │
│  │  - TokenManager (Storage)                    │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │  UI Components                               │  │
│  │  - SidePanel (React)                         │  │
│  │  - ContentScripts (DOM scraping)             │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────┘
                      │
                      │ HTTPS (Bearer Token)
                      ↓
┌─────────────────────────────────────────────────────┐
│           Backend API (NestJS)                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  ExtensionAuthController                     │  │
│  │  - POST /auth/extension/device/code          │  │
│  │  - POST /auth/extension/token                │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │  ExtensionAuthService                        │  │
│  │  - Device Flow Implementation                │  │
│  │  - Polling Mechanism                         │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Device Code Flow**:

1. Extension requests code (`POST /device/code`).
2. User opens Verification URL (`/extension/verify`) on mobile/desktop.
3. User confirms code and grants permission.
4. Extension polls (`POST /token`) until approved.
5. API issues Refresh/Access tokens with `extension` scope.

### OpsCoach Architecture (Phase 4)

```
┌─────────────────────────────────────────────────────┐
│              OpsCoach System                        │
│                                                     │
│  ┌──────────────┐      ┌──────────────┐             │
│  │   Inputs     │      │    Cycle     │             │
│  │              │      │              │             │
│  │ - Daily CMD  ├─────►│  1. BOOT     │             │
│  │ - Chat Msg   │      │      │       │             │
│  │ - Time Logs  │      │      ▼       │             │
│  └──────────────┘      │  2. PLAN     │◄────┐       │
│                        │      │       │     │       │
│  ┌──────────────┐      │      ▼       │     │       │
│  │   Outputs    │      │  3. EXECUTE  │     │       │
│  │              │      │      │       │     │       │
│  │ - Plan Card  │◄─────┤      ▼       │     │       │
│  │ - Next Task  │      │  4. LOG      │     │       │
│  │ - Audit Rep  │      │      │       │     │       │
│  └──────────────┘      │      ▼       │     │       │
│                        │  5. AUDIT    │─────┘       │
│  ┌──────────────┐      │              │             │
│  │  External    │      └──────────────┘             │
│  │              │             ▲                     │
│  │ - LLM Agent  │─────────────┘                     │
│  │ - Calendar   │                                   │
│  └──────────────┘                                   │
└─────────────────────────────────────────────────────┘
```

#### The Ops Cycle Model

The OpsCoach operates on a strict cyclical state machine:

1.  **BOOT (Daily)**

    - **Trigger**: First user interaction of the day.
    - **Input**: `CheckDailyGoal`.
    - **Output**: If missing goal → Prompt User. If present → Move to EXECUTE.

2.  **PLAN (Weekly/Daily)**

    - **Trigger**: Sunday or Start of Day.
    - **Input**: User priorities, weak areas.
    - **Output**: `WEEKLY_PLAN` or `DAILY_GOAL` event.

3.  **EXECUTE (Loop)**

    - **Trigger**: User accepts task or asks "What's next?".
    - **Input**: Queue state, Energy level.
    - **Output**: Next Todo Item (Context + Action).

4.  **LOG (Continuous)**

    - **Trigger**: Completion of task.
    - **Input**: `/log 30m`, "Finished X".
    - **Output**: `TIME_LOG` event, streak update.

5.  **AUDIT (Weekly)**
    - **Trigger**: End of week (Sunday).
    - **Input**: All `TIME_LOG`, `WEEKLY_PLAN` events.
    - **Output**: Variance analysis (Planned vs Actual), Bias detection.

---

---

## Data Flow

### Reading Session Creation

```
User clicks "Start Reading"
  ↓
Frontend: POST /sessions/start
  ↓
NestJS: SessionsController.start()
  ├─ Create ReadingSession in DB
  ├─ Call AI Service: /educator/turn (initial)
  │   ↓
  │   FastAPI: Educator Agent
  │   ├─ Route to PRE phase node
  │   ├─ Generate initial prompt
  │   └─ Return nextPrompt
  └─ Return session + initial prompt
  ↓
Frontend: Redirect to /reading/[sessionId]
  ↓
Display PromptConsole with initial message
```

### User Sends Prompt

```
User types message
  ↓
PromptConsole: sendPrompt()
  ├─ Optimistic UI (add message as "sending")
  ├─ POST /sessions/:id/prompt
  │   ↓
  │   NestJS: SessionsController.sendPrompt()
  │   ├─ QuickCommandParser: parse text
  │   ├─ Create SessionEvent(s)
  │   ├─ Emit events → VocabCaptureListener
  │   │   └─ Update UserVocabulary if MARK_UNKNOWN_WORD
  │   ├─ Call AI Service: /educator/turn
  │   │   ↓
  │   │   FastAPI: Educator Agent
  │   │   ├─ NestJSClient: fetch context
  │   │   │   ├─ Learner profile
  │   │   │   ├─ Session data
  │   │   │   ├─ Vocabulary
  │   │   │   └─ Events
  │   │   ├─ ContextBuilder: build ContextPack
  │   │   ├─ LangGraph: route to phase node
  │   │   │   ├─ PRE: goal/prediction/words
  │   │   │   ├─ DURING: checkpoints/scaffolding
  │   │   │   └─ POST: recall/quiz/vocab/production
  │   │   ├─ LLM: generate response
  │   │   └─ Return AgentTurnResponse
  │   └─ Return nextPrompt + quickReplies
  └─ Update message status to "sent"
  ↓
SessionContext: update messages + quickReplies
  ↓
PromptConsole: re-render with new message
```

---

## Technology Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules + Tailwind CSS
- **State**: React Context API
- **HTTP Client**: Axios
- **Forms**: React Hook Form
- **Testing**: Playwright (E2E)

### Backend API

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: class-validator
- **Testing**: Jest
- **Message Queue**: RabbitMQ (optional)

### AI Service

- **Framework**: FastAPI
- **Language**: Python 3.11+
- **LLM Orchestration**: LangChain + LangGraph
- **LLM Provider**: OpenAI
- **HTTP Client**: httpx
- **Testing**: pytest

---

## Database Schema (Key Models)

### Reading Sessions

```prisma
model ReadingSession {
  id            String   @id @default(uuid())
  userId        String
  contentId     String
  assetLayer    AssetLayer
  phase         UiMode   @default(PRE)
  status        SessionStatus @default(ACTIVE)
  startedAt     DateTime @default(now())
  finishedAt    DateTime?

  events        SessionEvent[]
  outcome       SessionOutcome?

  @@index([userId])
  @@index([contentId])
}

model SessionEvent {
  id                String   @id @default(uuid())
  readingSessionId  String
  eventType         EventType
  actorRole         ActorRole
  payloadJson       Json
  createdAt         DateTime @default(now())

  session SessionEvent @relation(...)

  @@index([readingSessionId, eventType])
}

model UserVocabulary {
  id              String   @id @default(uuid())
  userId          String
  word            String
  status          VocabStatus
  reviewCount     Int      @default(0)
  lastReviewedAt  DateTime?
  nextReviewAt    DateTime?
  easeFactor      Float    @default(2.5)
  interval        Int      @default(0)

  @@unique([userId, word])
  @@index([userId, nextReviewAt])
}

model OpsSnapshot {
  id        String   @id @default(uuid())
  userId    String
  date      DateTime @default(now()) // YYYY-MM-DD
  state     Json     // { phase: "EXECUTE", queue: [], metrics: {} }
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, date])
}

model OpsEvent {
  id        String   @id @default(uuid())
  userId    String
  type      String   // DAILY_BOOT, WEEKLY_PLAN, TIME_LOG
  data      Json
  createdAt DateTime @default(now())

  @@index([userId, type])
}
```

@@index([userId, type])
}

model ExtensionDeviceAuth {
id String @id @default(uuid())
deviceCode String @unique
userCode String @unique
// ... expiration and polling fields
}

model ExtensionGrant {
id String @id @default(uuid())
userId String
deviceId String @unique
// ... tokens and metadata
}

````

---

## Key Design Patterns

### 1. Extended Context Pattern

**Problem**: Need new functionality without breaking existing code

**Solution**: Extend existing Context with new fields/methods

```typescript
// BEFORE (existing)
interface SessionContextType {
  session;
  isLoading;
  error;
}

// AFTER (extended - Phase 3)
interface SessionContextType {
  // Keep all existing
  session;
  isLoading;
  error;

  // Add new
  messages;
  quickReplies;
  sendPrompt;
}
````

**Benefits**:

- Zero breaking changes
- Single source of truth
- Backward compatible

### 2. Centralized Configuration

**Problem**: Hardcoded URLs make deployment difficult

**Solution**: All routes in `API_ENDPOINTS` config

```typescript
// lib/config/api.ts
export const API_ENDPOINTS = {
  SESSIONS: {
    START: "/sessions/start",
    PROMPT: (id) => `/sessions/${id}/prompt`,
  },
};

// Usage
api.post(API_ENDPOINTS.SESSIONS.PROMPT(sessionId), data);
```

**Benefits**:

- Easy to change URLs
- Environment-based configuration
- Type-safe

### 3. Event-Driven Architecture

**Problem**: Need to trigger multiple actions on user events

**Solution**: Emit events, listeners react

```typescript
// Emit event
this.eventEmitter.emit('session.event.created', {
  eventType: 'MARK_UNKNOWN_WORD',
  word: 'exemplo'
});

// Listener reacts
@OnEvent('session.event.created')
async handleEvent(event) {
  if (event.eventType === 'MARK_UNKNOWN_WORD') {
    await this.vocabService.upsert(event.word);
  }
}
```

**Benefits**:

- Loose coupling
- Easy to add new listeners
- Single responsibility

### 4. Optimistic UI

**Problem**: Slow network makes UI feel unresponsive

**Solution**: Show changes immediately, update on confirmation

```typescript
// Add message immediately
setMessages([...messages, {
  text,
  status: 'sending'
}]);

// Send to backend
try {
  await api.post(...);
  // Update status to 'sent'
} catch {
  // Update status to 'error'
}
```

**Benefits**:

- Instant feedback
- Better UX
- Clear error states

---

## Security

### Authentication

- JWT tokens (httpOnly cookies) for Web App
- Bearer Tokens (Device Flow) for Extension
- Refresh token rotation
- CORS configured per environment

### Authorization

- Role-based access control (RBAC)
- Resource ownership checks
- API rate limiting

### Data Protection

- Passwords hashed with bcrypt
- Sensitive data encrypted at rest
- HTTPS only in production

---

## Monitoring & Observability

### Logging

- Structured logging (JSON format)
- Request ID correlation
- Error stack traces

### Metrics

- Response times (p50, p95, p99)
- Error rates
- LLM usage/costs

### Alerts

- Error rate > 5%
- Response time > 3s (p95)
- LLM failures

---

## Scaling Considerations

### Chrome Extension Architecture

The Chrome extension provides browser-based content capture and session management:

**Components:**

- **Background Service Worker**: Handles Readability.js extraction and API communication
- **Content Script**: Injects selection capture UI
- **Sidepanel**: Main UI for authentication and content management
- **Device Code Flow**: OAuth2-style authentication for extensions

**Key Files:**

- `browser-extension/src/background.ts` - Service worker with message handlers
- `browser-extension/src/content.ts` - Selection capture injection
- `browser-extension/src/sidepanel.ts` - Main UI with login and capture
- `browser-extension/src/api.ts` - Centralized API client

**Authentication Flow:**

1. Extension initiates device code flow via `POST /auth/extension/device/start`
2. User visits verification URL and enters code
3. Extension polls `POST /auth/extension/device/poll` until approved
4. Tokens stored in `chrome.storage.sync` with auto-refresh logic

---

### Session History Management

**Overview**: Provides comprehensive access to user's reading session history with pagination, filtering, and analytics.

**Backend API Endpoints:**

| Endpoint                     | Method | Purpose       | Features                                  |
| ---------------------------- | ------ | ------------- | ----------------------------------------- |
| `/api/v1/sessions`           | GET    | List sessions | Pagination, filters (date, phase), search |
| `/api/v1/sessions/export`    | GET    | Export data   | CSV/JSON for LGPD compliance              |
| `/api/v1/sessions/analytics` | GET    | Get metrics   | Activity heatmap, phase distribution      |

**Query Parameters** (`GET /sessions`):

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `since` - Filter since date (ISO 8601)
- `until` - Filter until date (ISO 8601)
- `phase` - Filter by phase (PRE, DURING, POST)
- `query` - Search in content title

**Response Format:**

```json
{
  "sessions": [
    {
      "id": "uuid",
      "startedAt": "2025-01-15T10:30:00Z",
      "finishedAt": "2025-01-15T11:00:00Z",
      "duration": 30,
      "phase": "POST",
      "content": {
        "id": "uuid",
        "title": "Article Title",
        "type": "ARTICLE"
      },
      "eventsCount": 12
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

**Database Optimization:**

- Composite index: `(userId, startedAt DESC)` for list queries
- Composite index: `(userId, phase, startedAt)` for filtered queries
- Performance: <10ms for paginated queries

**Frontend Integration:**

- **Page**: `/history` with tabs (Sessions | Analytics)
- **Hook**: `useSessionsHistory(params)` using React Query
- **Components**: `SessionCard`, `SessionAnalytics`
- **Features**: Infinite scroll, filters UI, export buttons, activity heatmap

**Browser Extension:**

- Recent sessions visible in sidepanel
- "Continue Session" feature
- Uses same `GET /sessions` endpoint

---

### Horizontal Scaling

- Stateless API servers
- Load balancer in front
- Shared session store (Redis)

### Database Scaling

- Read replicas for queries
- Connection pooling
- Query optimization

### AI Service Scaling

- Queue-based processing
- Multiple worker instances
- LLM request caching

---

## Future Architecture

### Phase 4-6 Additions

1. **Vector Database** (ChromaDB/Pinecone)

   - Semantic search for checkpoints
   - Content recommendations

2. **Redis Cache**

   - Session state
   - Learner profiles
   - LLM responses

3. **Analytics Pipeline**
   - Event streaming (Kafka)
   - Data warehouse (BigQuery)
   - BI dashboards

---

## Worker Services (Implemented)

### Overview

AprendeAI uses a microservices architecture with dedicated worker processes for async/background tasks. All workers are **code-complete** but may require deployment configuration.

### 1. Extraction Worker

**Queue:** `content.extract`  
**File:** `services/workers/extraction_worker/index.ts` (335 lines)  
**Status:** ✅ Implemented | ⚠️ Build verification needed

**Supported Formats:**

- **PDF:** Text extraction via `pdf-parse`
- **DOCX:** Text extraction via `mammoth`
- **IMAGE:** OCR placeholder (disabled, needs Tesseract/Google Vision)

**Process:**

1. Receives `{action: 'EXTRACT_TEXT', contentId}`
2. Fetches file from storage
3. Extracts text based on content type
4. Generates chunks (800 chars for PDF, paragraphs for DOCX)
5. Saves to `ContentChunk` table
6. Updates `ContentExtraction.status` → DONE/FAILED

**Dependencies:**

- PostgreSQL (Prisma)
- RabbitMQ
- Local file storage

**Known Issues:**

- OCR not implemented (IMAGE support incomplete)
- Requires file storage integration

---

### 2. Content Processor

**Queue:** `content.process`  
**File:** `services/workers/content_processor/index.ts` (94 lines)  
**Status:** ✅ Implemented | ⚠️ AI endpoints may be missing

**Actions Supported:**

- **SIMPLIFY:** Calls AI `/simplify` endpoint
- **ASSESSMENT:** Calls AI `/generate-assessment` endpoint

**Process:**

1. Receives `{action, contentId, text, level}`
2. Calls AI service HTTP endpoint
3. Saves result to API (`/content/:id/versions` or `/assessment`)

**Dependencies:**

- AI Service (HTTP)
- API Service (HTTP)
- RabbitMQ

**Known Issues:**

- AI endpoints `/simplify` and `/generate-assessment` may not exist
- Service-to-service auth not implemented

---

### 3. News Ingestor

**Queue:** ` news.fetch`  
**File:** `services/workers/news_ingestor/index.ts` (107 lines)  
**Status:** ✅ Implemented | ⚠️ Auth issue

**Process:**

1. Receives `{url, lang}`
2. Fetches RSS feed via `rss-parser`
3. Parses top 5 items
4. POSTs to `/content` API
5. Creates `Content` records with `type: 'NEWS'`

**Dependencies:**

- API Service
- RabbitMQ

**Known Issues:**

- Worker needs API auth bypass or system token
- No service-to-service auth mechanism

---

### 4. Arxiv Ingestor

**Queue:** `arxiv.fetch`  
**File:** `services/workers/arxiv_ingestor/index.ts` (96 lines)  
**Status:** ✅ Implemented | ⚠️ Auth issue

**Process:**

1. Receives `{query, max_results}`
2. Queries Arxiv API (`export.arxiv.org`)
3. Parses XML via `xml2js`
4. Creates `Content` records with `type: 'ARXIV'`

**Dependencies:**

- API Service
- External Arxiv API
- RabbitMQ

**Known Issues:**

- Same auth issue as news_ingestor
- External API rate limiting

---

### Worker Deployment Status

| Worker            | Code | Dockerfile | Runtime | Issues                      |
| ----------------- | ---- | ---------- | ------- | --------------------------- |
| extraction_worker | ✅   | ✅         | ❓      | File storage, Prisma client |
| content_processor | ✅   | ✅         | ❓      | AI endpoints, auth          |
| news_ingestor     | ✅   | ✅         | ❓      | Service auth                |
| arxiv_ingestor    | ✅   | ✅         | ❓      | Service auth                |

**Critical Path:** Implement service-to-service authentication for workers → API communication.

---

## AI Games System (December 2025)

### Overview

Comprehensive pedagogical games system integrated into the AI Service, featuring 6 game modes with adaptive difficulty, mastery tracking, and rewards.

**Status:** ✅ **Production-Ready MVP**  
**Test Coverage:** 89 tests (100% passing)  
**Frontend:** `/games` route with premium UI

### Architecture

```
┌─────────────────────────────────────────┐
│         games/                          │
├─────────────────────────────────────────┤
│  base.py        - Abstract BaseGame     │
│  registry.py    - Auto-discovery        │
│  constants.py   - GameMode enum         │
│  schema.py      - Pydantic models       │
│  decorators.py  - Metrics/tracking      │
├─────────────────────────────────────────┤
│  modes/         - 6 Game Implementations│
│    free_recall.py                       │
│    cloze_sprint.py                      │
│    srs_arena.py                         │
│    boss_fight.py                        │
│    tool_word_hunt.py                    │
│    misconception_hunt.py                │
├─────────────────────────────────────────┤
│  mastery/       - Advanced Infrastructure│
│    tracker.py   - Per-word mastery      │
│    difficulty.py - Auto-adaptation      │
│    rewards.py   - Stars/streaks         │
├─────────────────────────────────────────┤
│  middleware/    - Pipeline              │
│    correlation.py                       │
│    metrics_middleware.py                │
│    events.py                            │
├─────────────────────────────────────────┤
│  config/        -  YAML Configuration   │
│    triggers.yaml                        │
│    scoring_rules.yaml                   │
└─────────────────────────────────────────┘
```

### Game Implementations

**1. FREE_RECALL_SCORE** (Recall & Retention)

- Multi-step recall (3 follow-ups)
- Scoring: Central idea (40pts) + Details (40pts) + Clarity (20pts)
- Extracts "open loops" (questions/doubts)

**2. CLOZE_SPRINT** (Fill-in-Blank Speed)

- 3/5/7 blanks based on difficulty
- Partial credit for similar words
- Hint system

**3. SRS_ARENA** (Spaced Repetition)

- Recall meaning + create usage sentence
- Circular definition detection
- 10pts meaning + 10pts usage

**4. BOSS_FIGHT_VOCAB** (Multi-Layer Challenge)

- 3-lives system
- 3D evaluation: Meaning + Usage + Example
- Hint system (max 2)
- Epic boss battle theme

**5. TOOL_WORD_HUNT** (Contextual Analysis)

- Find word in text + justify usage
- Quote validity (40pts) + Justification (60pts)

**6. MISCONCEPTION_HUNT** (Critical Thinking)

- Identify false statement among 3
- Scoring: Identification (30pts) + Evidence (30pts) + Explanation (40pts)

### Infrastructure Features

**Mastery Tracking:**

- Per-word mastery score (0-100)
- Exponential moving average: `new = current * 0.7 + performance * 0.3`
- Per-theme aggregation
- Redis persistence (90-day TTL)

**Difficulty Adaptation:**

- Auto-adjustment based on accuracy
- > 80% accuracy → increase difficulty
- <50% accuracy → decrease difficulty
- 3-game cooldown between adjustments
- Scale: 1-5

**Rewards System:**

- Stars: 0-3 per round (90%+=3★, 70%+=2★, 50%+=1★)
- Streak tracking with daily check
- Bonus multipliers (3+=1.2x, 5+=1.5x, 10+=2.0x)
- Difficulty unlock based on mastery

### Integration Points

**LangGraph:**

- New `game_phase` node
- State extended with `game_mode`, `game_round_data`, `game_metadata`
- Routing on `START_GAME` command
- Events: `GAME_ROUND_CREATED`, `GAME_ROUND_EVALUATED`

**Middleware:**

- Correlation ID tracking
- Metrics integration
- Event emission

**Configuration:**

- `triggers.yaml` - Declarative game triggers
- `scoring_rules.yaml` - Centralized scoring

### Frontend Integration

**Route:** `/games`  
**Features:**

- Mobile-responsive grid (1/2/3 columns)
- Premium gradient game cards
- Stats overview (Stars, Streak, Completed)
- Lock/unlock states
- Sidebar navigation with Gamepad2 icon

### MVP Limitations

**Current:** Heuristic-based scoring (length, patterns)  
**Future:** LLM-based evaluation for quality assessment

---

## References

- [Prompt Interface Docs](./prompt-interface.md)
- [API Reference](./api-reference.md)
- [Deployment Guide](./deployment.md)
