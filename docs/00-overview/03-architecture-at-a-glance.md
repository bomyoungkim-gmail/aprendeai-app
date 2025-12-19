# Architecture at a Glance

**Purpose:** 1-page system overview for newcomers  
**Audience:** Dev | PM | Antigravity  
**Last updated:** 2025-12-18  
**Owner:** Engineering Team

## System Context

Cornell Reader is an adaptive learning platform that helps users comprehend content through the Cornell Notes method, spaced repetition, and AI-assisted study tools.

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │
       ↓ HTTPS
┌───────────────────────────────────┐
│  Frontend (Next.js + React)       │
│  - Cornell dual-mode UI           │
│  - Content viewer (PDF.js)        │
│  - Session manager                │
│  - Review queue                   │
└─────────────┬─────────────────────┘
              │
              ↓ REST API
┌───────────────────────────────────┐
│  Backend (NestJS + TypeScript)    │
│  ┌─────────────────────────────┐  │
│  │ Core Services               │  │
│  │ - Sessions (PRE/DURING/POST)│  │
│  │ - SRS (deterministic)       │  │
│  │ - Gating (deterministic)    │  │
│  │ - Cornell Notes             │  │
│  └─────────────────────────────┘  │
│  ┌─────────────────────────────┐  │
│  │ AI Services                 │  │
│  │ - LangGraph pipelines       │  │
│  │ - Multi-provider LLM        │  │
│  │ - Asset generation          │  │
│  └─────────────────────────────┘  │
└──────┬────────────┬───────────────┘
       │            │
       ↓            ↓
┌──────────┐  ┌─────────────┐
│PostgreSQL│  │  RabbitMQ   │
│  +Prisma │  │  (Workers)  │
│ +pgvector│  │             │
└──────────┘  └─────────────┘
```

## Key Components

### Frontend (Next.js)

**Responsibilities:**

- Render Cornell Notes in dual mode (reading/editing)
- Display PDF/DOCX with highlights
- Manage session UI (4 phases)
- Review queue interface

**Tech:** Next.js 14, React 18, TailwindCSS, PDF.js

---

### Backend API (NestJS)

**Responsibilities:**

- REST endpoints for all operations
- JWT authentication
- Business logic (SRS, Gating, DoD)
- Database access via Prisma

**Tech:** NestJS, TypeScript, Prisma, PostgreSQL

---

### Database (PostgreSQL)

**Responsibilities:**

- Store users, content, sessions, vocab
- Cornell notes + highlights
- SRS state (stages, due dates)
- Session outcomes

**Tech:** PostgreSQL 15, Prisma ORM, pgvector

---

### Job Queue (RabbitMQ)

**Responsibilities:**

- Async extraction (PDF → text)
- AI asset generation (L2/L3)
- Batch operations

**Tech:** RabbitMQ, Bull Queue

---

### AI Workers (Python)

**Responsibilities:**

- LangGraph workflows
- Multi-provider LLM calls
- Prompt execution
- Structured output validation

**Tech:** Python, LangChain, LangGraph, Pydantic

---

## Data Flow: Create Session

```
1. User clicks "Start Session"
   ↓
2. Frontend → POST /contents/123/sessions
   ↓
3. Backend creates ReadingSession (phase=PRE)
   ↓
4. Backend creates empty CornellNote
   ↓
5. Backend returns session
   ↓
6. Frontend shows PRE form (goal, targets)
```

## Data Flow: SRS Review

```
1. Frontend → GET /review/queue
   ↓
2. Backend queries UserVocabulary WHERE dueAt <= NOW
   ↓
3. Backend applies dailyReviewCap (limit 20)
   ↓
4. Frontend shows first vocab item
   ↓
5. User submits result (FAIL/HARD/OK/EASY)
   ↓
6. Frontend → POST /review/attempt
   ↓
7. Backend calculates next stage (deterministic)
   ↓
8. Backend updates: srsStage, dueAt, lapseCount
   ↓
9. Backend creates VocabAttempt record
   ↓
10. Frontend shows next item
```

## Data Flow: AI Asset (L3)

```
1. User eligible for L3 (5 sessions, comp≥75...)
   ↓
2. Frontend → POST /assets/quiz/L3
   ↓
3. Backend publishes job to RabbitMQ
   ↓
4. Python Worker picks up job
   ↓
5. Worker runs LangGraph workflow:
   - Select provider (Claude for L3)
   - Build prompt
   - Call LLM
   - Validate output (Pydantic schema)
   - Return structured quiz
   ↓
6. Worker saves to DB
   ↓
7. Backend returns quiz to frontend
   ↓
8. Frontend displays quiz
```

## Deployment

**Environments:**

- **Local:** Docker Compose (all services)
- **Staging:** AWS ECS (containers)
- **Production:** AWS ECS (containers)

**Services:**

- Frontend: Vercel / AWS Amplify
- Backend API: ECS Fargate
- Workers: ECS Fargate
- DB: AWS RDS PostgreSQL
- Queue: AWS MQ (RabbitMQ)
- Redis: ElastiCache

## Security

- JWT auth for all API calls
- HTTPS only
- CORS restricted to frontend domain
- Rate limiting (100/min per user)
- SQL injection prevention (Prisma)
- XSS prevention (React escaping)

## Scalability

**Current:**

- 100 concurrent users
- 1000 sessions/day

**Bottlenecks:**

- AI workers (most expensive)
- PostgreSQL (most critical)

**Scaling strategy:**

- Horizontal: Add more API containers
- Vertical: Larger DB instance
- Caching: Redis for hot data

## Monitoring

- CloudWatch (AWS)
- Error tracking: Sentry
- Uptime: UptimeRobot
- Logs: CloudWatch Logs
- Metrics: Custom CloudWatch metrics

## Related docs

- [System Design](../../03-system-design/00-system-context.md)
- [API Overview](../../05-api/00-api-overview.md)
- [AI Pipelines](../../07-jobs-and-ai/02-ai-pipelines-langgraph.md)
- [Deployment](../../09-operations/01-deploy.md)
