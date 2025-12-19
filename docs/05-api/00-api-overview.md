# API Overview

**Purpose:** High-level overview of Cornell Reader REST API  
**Audience:** Dev | Frontend | Integrations  
**Last updated:** 2025-12-18  
**Owner:** Engineering Team

## Invariants (cannot break)

- All endpoints require JWT authentication (except /auth/\*)
- All responses are JSON
- HTTP status codes follow REST conventions
- Rate limiting: 100 req/min per user
- CORS enabled for frontend domain

## Scope

**In scope:**

- REST endpoints
- Authentication flow
- Request/response formats
- Error handling

**Out of scope:**

- GraphQL (future)
- WebSockets (future)
- Webhooks (future)

## Base URL

**Production:** `https://api.cornellreader.com`  
**Staging:** `https://api-staging.cornellreader.com`  
**Local:** `http://localhost:4000`

## Authentication

**Method:** JWT Bearer Token

**Flow:**

```
1. POST /auth/login
   → body: { email, password }
   → response: { accessToken, refreshToken }

2. Use accessToken in headers:
   Authorization: Bearer <accessToken>

3. Token expires in 1 hour

4. Refresh with:
   POST /auth/refresh
   → body: { refreshToken }
   → response: { accessToken }
```

## API Structure

### Content Management

```
POST   /contents              Upload content
GET    /contents              List user's contents
GET    /contents/:id          Get content details
DELETE /contents/:id          Delete content
```

### Sessions

```
POST   /contents/:id/sessions      Create session
GET    /sessions/:id               Get session
PUT    /sessions/:id/pre           Fill PRE data
POST   /sessions/:id/advance       Advance phase
POST   /sessions/:id/events        Record event
GET    /sessions                   List user sessions
```

### Cornell Notes

```
GET    /contents/:id/cornell       Get/create cornell
PUT    /contents/:id/cornell       Save cornell
POST   /contents/:id/highlights    Create highlight
DELETE /highlights/:id             Delete highlight
```

### Review & SRS

```
GET    /review/queue              Get due vocab items
POST   /review/attempt            Submit review attempt
GET    /review/stats              Get review statistics
```

### AI Assets (Gated)

```
POST   /assets/quiz/:layer        Generate quiz
POST   /assets/glossary           Generate glossary
POST   /assets/summary            Generate summary (L3 only)
```

## Request Format

**Headers:**

```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (POST/PUT):**

```json
{
  "field": "value"
}
```

## Response Format

**Success (200/201):**

```json
{
  "id": "entity-id",
  "field": "value",
  ...
}
```

**Error (4xx/5xx):**

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## Status Codes

| Code | Meaning           | When                            |
| ---- | ----------------- | ------------------------------- |
| 200  | OK                | Successful GET/PUT              |
| 201  | Created           | Successful POST                 |
| 204  | No Content        | Successful DELETE               |
| 400  | Bad Request       | Validation error, DoD not met   |
| 401  | Unauthorized      | Missing/invalid token           |
| 403  | Forbidden         | Not allowed (e.g., wrong layer) |
| 404  | Not Found         | Resource doesn't exist          |
| 429  | Too Many Requests | Rate limit exceeded             |
| 500  | Server Error      | Unexpected error                |

## Rate Limiting

**Limits:**

- 100 requests/minute per user
- 1000 requests/hour per user
- Burst: 20 requests

**Headers:**

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1640000000
```

**Error when exceeded:**

```json
{
  "statusCode": 429,
  "message": "Rate limit exceeded",
  "retryAfter": 42
}
```

## Pagination

**Query params:**

```
GET /sessions?page=2&limit=20
```

**Response:**

```json
{
  "data": [...],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

## Filtering & Sorting

**Query params:**

```
GET /sessions?phase=FINISHED&sortBy=finishedAt&order=DESC
```

## Common Patterns

### Idempotency

PUT and DELETE are idempotent:

- PUT same data twice → same result
- DELETE twice → 204 both times (no error)

### Optimistic Locking

Not implemented yet (future: use ETags)

### Soft Deletes

Most deletes are soft (set deletedAt, not actual DELETE)

## Error Codes

See [Error Codes](./03-error-codes.md) for complete list.

**Common:**

- `VALIDATION_ERROR` - Invalid input
- `DOD_NOT_MET` - Session can't finish
- `LAYER_NOT_ELIGIBLE` - User not eligible for L2/L3
- `RESOURCE_NOT_FOUND` - Entity doesn't exist

## OpenAPI/Swagger

**URL:** `http://localhost:4000/api/docs`

Interactive API documentation with:

- All endpoints
- Request/response examples
- Try it out feature

## Related docs

- [REST Contracts](./01-rest-contracts.md)
- [Authentication](./02-auth.md)
- [Error Codes](./03-error-codes.md)
- [API Collections](../../docs/API_COLLECTIONS_README.md)

## Tools

**Postman Collection:** `docs/cornell-reader-api.postman_collection.json`  
**Insomnia Collection:** `docs/cornell-reader-api.insomnia.json`  
**Thunder Client:** `docs/cornell-reader-api.thunder.json`

## Example Usage

**Create session:**

```bash
curl -X POST http://localhost:4000/contents/abc123/sessions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

**Advance to FINISHED:**

```bash
curl -X POST http://localhost:4000/sessions/xyz789/advance \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"toPhase": "FINISHED"}'
```
