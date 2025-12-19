# Documentation Definition of Done

**Purpose:** Define when and how to update documentation  
**Audience:** Dev | Antigravity  
**Last updated:** 2025-12-18  
**Owner:** Engineering Team

---

## 📋 Update Documentation When...

### ✅ Always Update

#### Database Changes

**When:**

- Adding/modifying Prisma models
- Creating migrations
- Changing relationships

**Update:**

- `/docs/04-data/00-schema.md`
- `/docs/04-data/01-migrations.md`

**How:**

```markdown
Add to schema.md:

- New model description
- Key relationships
- Invariants

Add to migrations.md:

- Migration number + date
- What changed
- Rollback notes
```

---

#### API Changes

**When:**

- Adding/modifying endpoints
- Changing request/response payloads
- Modifying auth requirements
- Adding/changing error codes

**Update:**

- `/docs/05-api/01-rest-contracts.md`
- `/docs/05-api/03-error-codes.md` (if errors changed)

**How:**

```markdown
Add to rest-contracts.md:

- Endpoint path + method
- Request payload example
- Response payload example
- Auth requirements
- Error scenarios

Format:

### POST /sessions/{id}/advance

**Purpose:** Advance session to next phase
**Auth:** Required (JWT)
**Request:**
...
**Response:**
...
**Errors:** 400 (DoD not met), 404 (session not found)
```

---

#### Business Rules Changes

**When:**

- Modifying SRS logic
- Changing gating criteria
- Updating DoD requirements
- Altering session flow
- Changing scoring formulas

**Update:**

- `/docs/02-business-rules/02-srs.md` (SRS changes)
- `/docs/02-business-rules/03-gating-layers.md` (L2/L3 criteria)
- `/docs/02-business-rules/01-study-sessions.md` (session flow)
- `/docs/02-business-rules/04-frustration-and-outcomes.md` (scoring)

**How:**

```markdown
Update Invariants section:

- State the rule clearly
- Mark what CANNOT change
- Add examples

Update Flows section:

- Step-by-step with all branches
- Diagram if complex

Update Examples section:

- Input → Output for each scenario
```

**Critical:** Business rules are DETERMINISTIC. Any change here affects user experience directly.

---

#### Worker/AI Pipeline Changes

**When:**

- Adding/modifying RabbitMQ workers
- Changing LangGraph workflows
- Updating prompts
- Modifying AI providers/models
- Changing extraction logic

**Update:**

- `/docs/07-jobs-and-ai/00-workers.md`
- `/docs/07-jobs-and-ai/02-ai-pipelines-langgraph.md`
- `/docs/07-jobs-and-ai/03-prompting-and-schemas.md`

**How:**

```markdown
Update workers.md:

- Queue name
- Job payload schema
- Handler logic flow
- Error handling

Update ai-pipelines-langgraph.md:

- Graph diagram
- Node descriptions
- State transitions

Update prompting-and-schemas.md:

- Prompt template
- Variables
- Expected output schema
- Provider selection rationale
```

---

#### UI Flow Changes

**When:**

- Adding/modifying Cornell UI components
- Changing user journeys
- Updating interaction patterns

**Update:**

- `/docs/06-frontend/01-cornell-reader-ui.md`
- `/docs/01-product/01-user-journeys.md`

---

#### Testing Changes

**When:**

- Adding new test categories
- Changing testing strategy
- Adding significant test coverage

**Update:**

- `/docs/08-testing/00-testing-strategy.md`
- `/docs/08-testing/01-unit-tests.md` (or 02/03)

---

### ⚠️ Maybe Update

#### Configuration Changes

**When:** Adding environment variables, feature flags

**Consider updating:**

- `/docs/09-operations/00-local-dev.md`
- `/docs/03-system-design/00-system-context.md`

---

#### Performance Optimizations

**When:** Caching strategies, query optimizations

**Consider updating:**

- `/docs/03-system-design/04-caching-and-idempotency.md`
- `/docs/06-frontend/03-performance-notes.md`

---

## 🏗️ Architectural Decisions

### Always Create ADR

**When:**

- Choosing technology/framework
- Changing service boundaries
- Major refactoring decisions
- Data model redesigns
- Integration choices

**Create:**

- New file: `/docs/10-decisions/adr-XXXX-title.md`
- Use template (see below)
- Link from related docs

**Template:**

```markdown
# ADR-XXXX — <Title>

**Status:** Proposed | Accepted | Deprecated  
**Date:** YYYY-MM-DD  
**Context:** (What problem are we solving?)

**Decision:** (What did we decide?)

**Consequences:**

- Positive: ...
- Negative: ...
- Neutral: ...

**Alternatives Considered:**

1. Option A - rejected because...
2. Option B - rejected because...

**Links:**

- Related PR: #123
- Related docs: ...
```

---

## ✅ Pull Request Checklist

Before marking PR as ready for review:

```markdown
- [ ] Code changes made
- [ ] Tests added/updated
- [ ] Documentation updated (if applicable):
  - [ ] Schema docs (if DB changed)
  - [ ] API docs (if endpoints changed)
  - [ ] Business rules (if logic changed)
  - [ ] Workers/AI (if pipeline changed)
  - [ ] ADR (if architectural decision)
- [ ] Links verified (no broken links)
- [ ] Examples added (if new feature)
```

---

## 🔍 CI Verification

Our CI checks:

1. ✅ Critical doc files exist (README, rules-index, etc.)
2. ✅ No broken relative links
3. ⚠️ Warns if schema changed but schema.md not updated
4. ⚠️ Warns if endpoints changed but API docs not updated

**Failing CI = Missing documentation**

---

## 📝 Documentation Best Practices

### Keep It Short

- Max 300 lines per doc
- Split if longer
- Use links for deep dives

### Use Examples

- Every flow needs example
- Input → Output
- Edge cases

### State Invariants

- What CANNOT change
- Hard rules
- Contracts

### Cross-Link

- Link to related docs
- Link to code
- Link to tests

### Update Last Modified

- Change date in header
- Brief note of what changed

---

## 🚫 Don't Document

- Implementation details that change often
- Temporary workarounds
- Code that documents itself
- Internal variable names
- Obvious patterns

**Document interfaces, contracts, and invariants. Not implementation.**

---

## 🆘 When In Doubt

**Ask yourself:**

- Does this change affect another dev?
- Does this change user behavior?
- Will Antigravity need this context?
- Is this a hard rule or a soft guideline?

**If YES to any:** Update docs.

---

## Related Docs

- [Docs Index](./00-README.md)
- [Business Rules Index](../02-business-rules/00-rules-index.md)
- [Testing Strategy](../08-testing/00-testing-strategy.md)
