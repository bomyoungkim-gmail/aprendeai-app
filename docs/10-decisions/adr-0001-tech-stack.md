# ADR-0001 — Tech Stack Selection

**Status:** Accepted  
**Date:** 2024-12-01  
**Context:** Need to choose technology stack for Cornell Reader MVP

## Decision

**Backend:**

- NestJS (TypeScript)
- PostgreSQL (Prisma ORM)
- Redis (caching)
- RabbitMQ (job queues)

**Frontend:**

- Next.js 14 (App Router)
- React 18
- TailwindCSS
- PDF.js for rendering

**AI:**

- LangChain + LangGraph
- Multi-provider (OpenAI, Anthropic, Google Gemini)
- Vector DB: PostgreSQL with pgvector

## Consequences

**Positive:**

- TypeScript end-to-end (type safety)
- NestJS provides structure + DI
- Prisma excellent DX for schema changes
- Next.js enables SSR + great DX
- LangGraph handles complex AI workflows
- Multi-provider avoids vendor lock-in

**Negative:**

- NestJS has learning curve
- Prisma migrations can be tricky
- LangGraph is relatively new
- Multi-provider increases complexity

**Neutral:**

- PostgreSQL well-known but requires management
- Redis adds another service
- RabbitMQ for async is standard but complex

## Alternatives Considered

**Backend frameworks:**

1. **Express.js** - Too barebones, no structure
2. **Fastify** - Fast but less ecosystem
3. **NestJS** ✅ - Best structure, DI, TypeScript native

**Databases:**

1. **MongoDB** - NoSQL doesn't fit relational data
2. **MySQL** - No pgvector support
3. **PostgreSQL** ✅ - Best for complex queries + vectors

**Frontend:**

1. **Vite + React** - No SSR out of box
2. **Remix** - Less mature ecosystem
3. **Next.js** ✅ - Industry standard, great DX

**AI Orchestration:**

1. **Raw LangChain** - Too low-level
2. **Custom solution** - Reinventing wheel
3. **LangGraph** ✅ - State management + flexibility

## Links

- [System Design](../../03-system-design/00-system-context.md)
- [AI Pipelines](../../07-jobs-and-ai/02-ai-pipelines-langgraph.md)
