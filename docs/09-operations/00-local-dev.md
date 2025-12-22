# Local Development Setup

**Purpose:** Guide to setting up the development environment  
**Audience:** Dev | Antigravity  
**Last updated:** 2025-12-18  
**Owner:** Engineering Team

## Prerequisites

- **Node.js**: v20+ (LTS)
- **Docker**: Desktop or Engine (for DB/Redis/RabbitMQ)
- **Python**: 3.11+ (for AI workers)
- **Git**

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/aprendeai/cornell-reader.git
cd cornell-reader

# Install Root/Frontend deps
npm install
cd frontend && npm install

# Install API deps
cd ../services/api && npm install
```

### 2. Start Infrastructure (Docker)

We use Docker Compose to run dependencies (Postgres, Redis, RabbitMQ) locally.

```bash
# In project root
docker-compose up -d
```

Validates:

- Postgres on port `5432`
- Redis on port `6379`
- RabbitMQ on port `5672` (Admin UI: `15672`)

### 3. Configure Environment

Copy `.env.example` to `.env` in `services/api` and `frontend`.

**services/api/.env**

```ini
DATABASE_URL="postgresql://user:password@localhost:5432/cornell_db?schema=public"
JWT_SECRET="dev-secret"
REDIS_URL="redis://localhost:6379"
RABBITMQ_URL="amqp://user:password@localhost:5672"
OPENAI_API_KEY="sk-..."
```

**frontend/.env.local**

```ini
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

### 4. Database Setup

```bash
cd services/api

# Run migrations
npx prisma migrate dev

# Seed data (optional)
npx prisma db seed
```

### 5. Run Services

**Backend (API):**

```bash
cd services/api
npm run start:dev
# Running on http://localhost:4000
```

**Frontend:**

```bash
cd frontend
npm run dev
# Running on http://localhost:3000
```

**AI Workers (OpsCoach Service):**

The AI Service (FastAPI) runs on port 8001.

```bash
# Activate environment
source services/ai/venv/bin/activate  # or venv\Scripts\activate on Windows

# Run standard agent
cd services/ai
uvicorn main:app --reload --port 8001
```

If you don't run this service, the OpsCoach and Educator Agents will not process turns.
See `docs/11-ops-coach/00-overview.md` for more details.

## Development Workflows

### Database Changes

1. Modify `services/api/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <change_name>`
3. Client automatically regenerates.

### Adding Clean Dependencies

**Backend:**

```bash
cd services/api
npm install <package>
```

**Frontend:**

```bash
cd frontend
npm install <package>
```

### Testing

See [Testing Docs](../08-testing/00-testing-strategy.md).

```bash
# Run all unit tests
cd services/api && npm run test

# Run validation script
node scripts/check-docs.js
```

## Troubleshooting

### Port Conflicts

- Ensure port 5432 (Postgres) is not taken by local Postgres service.
- Ensure port 3000/4000 are free.

### Prisma Client out of sync

If you see type errors related to DB models:

```bash
cd services/api
npx prisma generate
```

### RabbitMQ Connection Failed

Ensure docker container `cornell_rabbitmq` is running and healthy.

## Related

- [Deployment](./01-deploy.md)
- [Architecture](../00-overview/03-architecture-at-a-glance.md)
