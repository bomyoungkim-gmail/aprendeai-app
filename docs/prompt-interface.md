# Prompt-Only Reading Interface

## Overview

The Prompt-Only Reading Interface is a conversational AI-powered reading comprehension system that guides learners through three distinct phases of reading: PRE (preparation), DURING (active reading), and POST (consolidation).

**Status**: ✅ Phase 3 Complete (MVP Ready)  
**Version**: 1.0.0  
**Last Updated**: 2025-12-21

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────┐
│              Frontend (Next.js)                 │
│  ┌──────────────────┬──────────────────────┐   │
│  │  CornellLayout   │  PromptConsole       │   │
│  │  (existing)      │  (Phase 3)           │   │
│  └──────────────────┴──────────────────────┘   │
│           │                    │                │
│           └────────┬───────────┘                │
│                    │                            │
│              SessionContext                     │
│              (extended)                         │
└────────────────────┼───────────────────────────┘
                     │
                     │ HTTP/REST
                     ↓
┌─────────────────────────────────────────────────┐
│           NestJS API (Port 3001)                │
│  ┌──────────────────────────────────────────┐  │
│  │  Sessions Controller                     │  │
│  │  - POST /sessions/start                  │  │
│  │  - POST /sessions/:id/prompt             │  │
│  │  - POST /sessions/:id/finish             │  │
│  └──────────────────────────────────────────┘  │
│           │                    │                │
│  QuickCommandParser    VocabCaptureListener    │
│           │                    │                │
│           └────────┬───────────┘                │
└────────────────────┼───────────────────────────┘
                     │
                     │ HTTP
                     ↓
┌─────────────────────────────────────────────────┐
│         FastAPI AI Service (Port 8001)          │
│  ┌──────────────────────────────────────────┐  │
│  │  Educator Agent (LangGraph)              │  │
│  │  ┌────────┬────────┬────────┐            │  │
│  │  │  PRE   │ DURING │  POST  │            │  │
│  │  └────────┴────────┴────────┘            │  │
│  └──────────────────────────────────────────┘  │
│           │                                     │
│  ┌────────┴─────────┐                          │
│  │ NestJS Client    │ (fetch data)             │
│  │ Context Builder  │                          │
│  └──────────────────┘                          │
└─────────────────────────────────────────────────┘
```

---

## Features

### Completed (Phase 3)

- ✅ **SessionContext Extension** - Extends existing context with prompt functionality
- ✅ **PromptConsole Component** - Main chat interface
- ✅ **Three-Phase Flow** - PRE/DURING/POST guided experience
- ✅ **Quick Replies** - Suggested responses from AI
- ✅ **Command Shortcuts** - `/mark`, `/checkpoint`, `/keyidea`, `/production`
- ✅ **Optimistic UI** - Instant message feedback
- ✅ **Status Indicators** - Sending/sent/error states
- ✅ **Typing Indicator** - Shows when AI is processing
- ✅ **Auto-scroll** - Always shows latest message
- ✅ **Responsive Design** - Desktop/tablet/mobile layouts
- ✅ **Accessibility** - ARIA labels, keyboard navigation
- ✅ **Error Handling** - Graceful degradation on failures

### Planned (Phases 4-6)

- ⏳ **Multi-Session Support** - Long text divided into multiple sessions
- ⏳ **Tool Words Gate** - Vocabulary scaffolding before reading
- ⏳ **Analytics Dashboard** - Progress tracking and insights

---

## API Reference

### NestJS Endpoints

#### Start Session

```http
POST /api/v1/sessions/start
Content-Type: application/json
Authorization: Bearer {token}

{
  "contentId": "ct_001",
  "assetLayer": "L1",
  "readingIntent": "analytical"
}

Response:
{
  "readingSessionId": "rs_xxx",
  "threadId": "rs_xxx",
  "phase": "PRE",
  "nextPrompt": "Meta do dia: em 1 linha...",
  "quickReplies": []
}
```

#### Send Prompt

```http
POST /api/v1/sessions/:id/prompt
Content-Type: application/json
Authorization: Bearer {token}

{
  "threadId": "rs_xxx",
  "readingSessionId": "rs_xxx",
  "actorRole": "LEARNER",
  "text": "Entender conceitos principais",
  "clientTs": "2025-12-21T20:00:00Z",
  "metadata": {
    "uiMode": "PRE",
    "contentId": "ct_001",
    "assetLayer": "L1",
    "readingIntent": "analytical"
  }
}

Response:
{
  "threadId": "rs_xxx",
  "readingSessionId": "rs_xxx",
  "nextPrompt": "Previsão: o que você espera encontrar?",
  "quickReplies": ["Continuar", "Pular"],
  "eventsToWrite": [...],
  "hilRequest": null
}
```

#### Finish Session

```http
POST /api/v1/sessions/:id/finish
Content-Type: application/json
Authorization: Bearer {token}

{
  "reason": "USER_FINISHED"
}

Response: 204 No Content
```

---

### FastAPI Endpoints

#### Process Turn

```http
POST /educator/turn
Content-Type: application/json

{
  "promptMessage": {
    "threadId": "rs_xxx",
    "readingSessionId": "rs_xxx",
    "actorRole": "LEARNER",
    "text": "...",
    "clientTs": "...",
    "metadata": {...}
  }
}

Response:
{
  "threadId": "rs_xxx",
  "readingSessionId": "rs_xxx",
  "nextPrompt": "...",
  "quickReplies": ["..."],
  "eventsToWrite": [...],
  "hilRequest": null
}
```

#### Health Check

```http
GET /educator/health

Response:
{
  "status": "healthy",
  "llm_available": true,
  "nestjs_connected": true,
  "timestamp": "2025-12-21T20:00:00Z"
}
```

---

## User Guide

### Starting a Reading Session

1. Navigate to `/reading/new` or click "Start Reading"
2. Select content from library
3. System redirects to `/reading/[sessionId]`
4. Chat interface appears on right panel

### Three-Phase Flow

#### PRE Phase (Preparation)

1. **Goal Setting**: AI asks "What do you want to understand?"
2. **Prediction**: AI asks "What do you expect to find?"
3. **Target Words**: AI proposes vocabulary to focus on

#### DURING Phase (Active Reading)

1. **Mark Unknown Words**: Use `/mark unknown: word1, word2`
2. **Checkpoints**: AI asks comprehension questions
3. **Scaffolding**: AI provides hints if struggling

#### POST Phase (Consolidation)

1. **Free Recall**: Summarize what you learned
2. **Quiz**: Answer comprehension questions
3. **Vocab Coach**: Practice unknown words
4. **Production Task**: Apply knowledge

### Command Shortcuts

- `/mark unknown: word` - Mark words you don't know
- `/checkpoint: answer` - Respond to checkpoint
- `/keyidea: idea` - Note key idea
- `/production: text` - Submit production task

### Quick Replies

Click suggested responses to quickly answer common questions.

---

## Development

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL
- OpenAI API key

### Setup

```bash
# Frontend
cd frontend
npm install
npm run dev

# NestJS API
cd services/api
npm install
npm run start:dev

# AI Service
cd services/ai
pip install -r requirements.txt
cp .env.example .env
# Edit .env with OPENAI_API_KEY
python main.py
```

### Environment Variables

**Frontend** (`.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

**NestJS** (`.env`):

```env
DATABASE_URL=postgresql://...
AI_SERVICE_URL=http://localhost:8001
PORT=3001
```

**AI Service** (`.env`):

```env
OPENAI_API_KEY=sk-...
NESTJS_API_URL=http://localhost:3001/api/v1
PORT=8001
ENV=development
```

### Testing

```bash
# E2E Tests
cd frontend
npx playwright test __tests__/e2e/prompt-session.spec.ts

# Run with UI
npx playwright test --ui

# Run specific test
npx playwright test -g "should complete full PRE"
```

---

## Deployment

### Docker Compose

```yaml
version: "3.8"

services:
  api:
    build: ./services/api
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - AI_SERVICE_URL=http://ai-service:8001
    depends_on:
      - postgres

  ai-service:
    build: ./services/ai
    ports:
      - "8001:8001"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NESTJS_API_URL=http://api:3001/api/v1

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:3001/api/v1

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=aprendeai
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
```

### Production Checklist

- [ ] Set `ENV=production` in AI service
- [ ] Configure CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Configure database backups
- [ ] Set up monitoring (Sentry, DataDog, etc.)
- [ ] Configure rate limiting
- [ ] Set up CDN for static assets
- [ ] Enable request logging
- [ ] Configure health check endpoints

---

## Troubleshooting

### AI Service Not Responding

**Symptoms**: Messages stay in "sending" state

**Solutions**:

1. Check AI service logs: `docker logs ai-service`
2. Verify `OPENAI_API_KEY` is set correctly
3. Check `/educator/health` endpoint
4. Verify NestJS can reach AI service

### SessionContext Errors

**Symptoms**: "Cannot read property 'messages' of undefined"

**Solutions**:

1. Ensure page is wrapped in `<SessionProvider>`
2. Check sessionId is valid
3. Verify SessionContext extension is deployed

### TypeScript Import Errors

**Symptoms**: "Cannot find module './ChatBubble'"

**Solutions**:

1. Run `npm run dev` to recompile
2. Check file extensions (.tsx not .ts)
3. Restart TypeScript server in IDE

---

## Performance

### Metrics

- **Response Time (p95)**: < 3s
- **LLM Cost per Session**: ~$0.05
- **Context Build Time**: ~300ms
- **Message Render Time**: < 50ms

### Optimization Tips

1. **Use Cheap LLM**: For simple tasks (gpt-4o-mini)
2. **Cache Context**: Reuse learner profile across turns
3. **Debounce Input**: Avoid rapid-fire sends
4. **Lazy Load Messages**: Virtualize long chat histories

---

## Contributing

See main project [CONTRIBUTING.md](../../CONTRIBUTING.md)

---

## License

See main project [LICENSE](../../LICENSE)

---

## Support

- **Issues**: [GitHub Issues](https://github.com/your-org/aprendeai-app/issues)
- **Docs**: [Full Documentation](../README.md)
- **Email**: support@aprendeai.com
