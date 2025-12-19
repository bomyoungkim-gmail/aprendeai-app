# Docs Index (Cornell Reader)

**Purpose:** Central map and entry point for all Cornell Reader documentation  
**Audience:** Dev | PM | Ops | Antigravity  
**Last updated:** 2025-12-18  
**Owner:** Engineering Team

---

## 🚀 Start Here

New to the project? Read these first:

1. **[Architecture at a Glance](./03-architecture-at-a-glance.md)** - 1-page overview
2. **[Glossary](./01-glossary.md)** - Key terms and concepts
3. **[User Journeys](../01-product/01-user-journeys.md)** - How users interact
4. **[Business Rules Index](../02-business-rules/00-rules-index.md)** - Core logic

---

## 📚 Documentation Categories

### 00. Overview

- [Glossary](./01-glossary.md) - Terms and definitions
- [Non-Goals](./02-non-goals.md) - What we explicitly don't do
- [Architecture at a Glance](./03-architecture-at-a-glance.md) - System overview
- [Docs DoD](./04-docs-dod.md) - When to update documentation

### 01. Product

- [User Personas](../01-product/00-user-personas.md)
- [User Journeys](../01-product/01-user-journeys.md)
- [Requirements](../01-product/02-requirements.md)
- [Entitlements & Limits](../01-product/03-entitlements-and-limits.md)
- [Acceptance Criteria](../01-product/04-acceptance-criteria.md)

### 02. Business Rules ⭐ Critical

- [Rules Index](../02-business-rules/00-rules-index.md) - Deterministic vs AI
- [Study Sessions](../02-business-rules/01-study-sessions.md) - PRE/DURING/POST/FINISHED
- [SRS System](../02-business-rules/02-srs.md) - Spaced Repetition
- [Gating Layers](../02-business-rules/03-gating-layers.md) - L1/L2/L3
- [Outcomes & Frustration](../02-business-rules/04-frustration-and-outcomes.md)

### 03. System Design

- [System Context](../03-system-design/00-system-context.md)
- [Service Boundaries](../03-system-design/01-service-boundaries.md)
- [Data Flow Diagrams](../03-system-design/02-data-flow-diagrams.md)
- [Event Model](../03-system-design/03-event-model.md)
- [Caching & Idempotency](../03-system-design/04-caching-and-idempotency.md)
- [Observability](../03-system-design/05-observability.md)
- [Security & Privacy](../03-system-design/06-security-and-privacy.md)

### 04. Data

- [Schema Overview](../04-data/00-schema.md)
- [Migrations](../04-data/01-migrations.md)
- [Sample Data & Fixtures](../04-data/02-sample-data-and-fixtures.md)
- [Data Retention](../04-data/03-data-retention.md)

### 05. API

- [API Overview](../05-api/00-api-overview.md)
- [REST Contracts](../05-api/01-rest-contracts.md)
- [Authentication](../05-api/02-auth.md)
- [Error Codes](../05-api/03-error-codes.md)
- [Webhooks & Events](../05-api/04-webhooks-or-events.md)

### 06. Frontend

- [Frontend Architecture](../06-frontend/00-frontend-architecture.md)
- [Cornell Reader UI](../06-frontend/01-cornell-reader-ui.md)
- [State Management](../06-frontend/02-state-management.md)
- [Performance Notes](../06-frontend/03-performance-notes.md)
- [Accessibility](../06-frontend/04-accessibility.md)

### 07. Jobs & AI

- [Workers Overview](../07-jobs-and-ai/00-workers.md)
- [Extraction Pipeline](../07-jobs-and-ai/01-extraction-pipeline.md)
- [AI Pipelines (LangGraph)](../07-jobs-and-ai/02-ai-pipelines-langgraph.md)
- [Prompting & Schemas](../07-jobs-and-ai/03-prompting-and-schemas.md)
- [AI Guardrails](../07-jobs-and-ai/04-ai-guardrails.md)

### 08. Testing ⭐ Recently Updated

- [Testing Strategy](../08-testing/00-testing-strategy.md)
- [Unit Tests](../08-testing/01-unit-tests.md) - 49 backend + 21 frontend
- [Integration Tests](../08-testing/02-integration-tests.md) - 27 tests
- [E2E Tests](../08-testing/03-e2e-tests.md) - 17 Playwright tests
- [Test Data](../08-testing/04-test-data.md)

### 09. Operations

- [Local Development](../09-operations/00-local-dev.md)
- [Deployment](../09-operations/01-deploy.md)
- [Runbooks](../09-operations/02-runbooks.md)
- [Monitoring & Alerts](../09-operations/03-monitoring-alerts.md)
- [Cost Controls](../09-operations/04-cost-controls.md)

### 10. Decisions (ADRs)

- [ADR-0001: Tech Stack](../10-decisions/adr-0001-tech-stack.md)
- [ADR-0002: Data Model](../10-decisions/adr-0002-data-model.md)
- [ADR-0003: Cornell Dual-Mode](../10-decisions/adr-0003-cornell-dual-mode.md)
- [ADR-0004: SRS & Gating](../10-decisions/adr-0004-srs-and-gating.md)
- [ADR-0005: LangGraph Boundaries](../10-decisions/adr-0005-langgraph-boundaries.md)
- [ADR-0006: Multi-Provider LLM](../10-decisions/adr-0006-multi-provider-llm.md)

---

## 🔍 Quick Reference

### Common Tasks

**I want to understand...**

- How SRS works → [02-business-rules/02-srs.md](../02-business-rules/02-srs.md)
- How sessions flow → [02-business-rules/01-study-sessions.md](../02-business-rules/01-study-sessions.md)
- How gating works → [02-business-rules/03-gating-layers.md](../02-business-rules/03-gating-layers.md)
- API endpoints → [05-api/01-rest-contracts.md](../05-api/01-rest-contracts.md)
- Database schema → [04-data/00-schema.md](../04-data/00-schema.md)
- Testing approach → [08-testing/00-testing-strategy.md](../08-testing/00-testing-strategy.md)

**I need to...**

- Run locally → [09-operations/00-local-dev.md](../09-operations/00-local-dev.md)
- Deploy → [09-operations/01-deploy.md](../09-operations/01-deploy.md)
- Add a migration → [04-data/01-migrations.md](../04-data/01-migrations.md)
- Understand AI pipeline → [07-jobs-and-ai/02-ai-pipelines-langgraph.md](../07-jobs-and-ai/02-ai-pipelines-langgraph.md)

---

## 📝 Documentation Standards

### When to Update Docs

See [Docs DoD](./04-docs-dod.md) for complete rules.

**TL;DR:** Update docs when you:

- Change schema/database
- Change API endpoints
- Change business rules (SRS, Gating, DoD)
- Add/modify Workers or AI pipelines
- Make architectural decisions

### Template Format

All docs (except glossary) follow this structure:

- **Purpose** - Why this doc exists
- **Invariants** - Rules that cannot break
- **Scope** - What's in/out
- **Interfaces** - APIs, events, tables
- **Flows** - Step-by-step processes
- **Examples** - Real-world usage
- **Failure modes** - What can go wrong
- **Related docs** - Cross-links

---

## 🆘 Need Help?

- **Questions?** Check [Glossary](./01-glossary.md) first
- **Bug?** See [Error Codes](../05-api/03-error-codes.md)
- **Deploy issue?** Check [Runbooks](../09-operations/02-runbooks.md)
- **Architectural decision?** Review [ADRs](../10-decisions/)

---

## 📊 Documentation Health

Last verified: 2025-12-18  
Total docs: 57 files  
Coverage: Core business logic ✅ | API ✅ | Testing ✅ | Operations 🟡

---

**Remember:** Keep docs short, focused, and updated. Every PR that touches core logic should update corresponding docs.
