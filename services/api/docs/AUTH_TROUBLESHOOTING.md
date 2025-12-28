# Authentication Troubleshooting Guide

## Quick Reference

| Symptom                   | Likely Cause                  | Fix                                  |
| ------------------------- | ----------------------------- | ------------------------------------ |
| 401 on public endpoint    | Missing `@Public()` decorator | Add `@Public()` to controller method |
| 401 on protected endpoint | No/invalid token              | Check `Authorization` header         |
| 403 on protected endpoint | Insufficient permissions      | Check user role or membership        |
| "Carregando..." forever   | API returning 401/500         | Check backend logs for errors        |
| Slow auth (>1s)           | Token validation issue        | Check JWT_SECRET, DB connection      |

## Step-by-Step Debugging

### 1. Identify the Failing Endpoint

Check browser console or backend logs:

- **401**: Authentication failed (no token or invalid token)
- **403**: Authorization failed (valid user, wrong permissions)
- **500**: Server error (check backend logs)

### 2. Check Backend Logs

Look for auth guard messages:

```bash
# Public route (should see [PUBLIC])
[JwtAuthGuard] [PUBLIC] Bypassing auth for: GET /api/v1/health

# Protected route success (should see [AUTH_SUCCESS])
[JwtAuthGuard] [AUTH_SUCCESS] GET /api/v1/profile - User: user@example.com

# Auth failure (should see [AUTH_FAILED])
[JwtAuthGuard] [AUTH_FAILED] GET /api/v1/profile - Reason: No auth token
```

### 3. Verify Request Headers

```bash
# Check if Authorization header is present
curl -v http://localhost:4000/api/v1/profile

# Should see:
> GET /api/v1/profile HTTP/1.1
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Test Token Validity

```typescript
// In browser console
const token = localStorage.getItem("auth-storage");
const parsed = JSON.parse(token);
console.log("Token:", parsed.state.token);

// Decode JWT (without verification)
const payload = JSON.parse(atob(parsed.state.token.split(".")[1]));
console.log("Expires:", new Date(payload.exp * 1000));
console.log("User ID:", payload.sub);
```

### 5. Check Auth Metrics

```bash
curl http://localhost:4000/debug/auth-metrics
```

Expected output:

```json
{
  "timestamp": "2025-12-27T23:45:00.000Z",
  "metrics": {
    "totalRequests": 150,
    "publicRouteHits": 10,
    "protectedRouteHits": 140,
    "authSuccesses": 135,
    "authFailures401": 5,
    "authFailures403": 0,
    "avgAuthLatencyMs": 15,
    "authSuccessRate": "96.43%"
  }
}
```

## Common Issues & Solutions

### Issue: Public Endpoint Returns 401

**Symptoms:**

- `/health`, `/auth/login` return 401
- Browser console shows "Unauthorized"
- Backend logs show `[PROTECTED]` instead of `[PUBLIC]`

**Diagnosis:**

1. Check if `@Public()` decorator is present
2. Verify decorator is imported correctly
3. Check decorator is placed BEFORE `@Get/@Post`

**Fix:**

```typescript
// ❌ WRONG
import { Public } from 'wrong/path';

@Get('health')
@Public() // ❌ WRONG ORDER
check() {}

// ✅ CORRECT
import { Public } from '../auth/decorators/public.decorator';

@Public() // ✅ BEFORE @Get
@Get('health')
check() {}
```

### Issue: Token Expired/Invalid

**Symptoms:**

- Was working, now returns 401
- Backend logs show "jwt expired" or "invalid signature"

**Diagnosis:**

1. Check token expiration
2. Verify JWT_SECRET matches between sessions
3. Check if refresh token flow is working

**Fix:**

```typescript
// Manually trigger refresh
const { refreshAccessToken } = useAuthStore.getState();
await refreshAccessToken();
```

### Issue: Role/Permission Denied (403)

**Symptoms:**

- Returns 403 Forbidden
- Backend logs show "Insufficient permissions"
- User is authenticated but can't access

**Diagnosis:**

1. Check required roles on endpoint
2. Verify user has correct role in database
3. Check group/family membership

**Fix:**

```typescript
// Check user role
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { role: true },
});

// For group sharing, verify membership
const isMember = await prisma.groupMember.findFirst({
  where: {
    groupId: groupId,
    userId: userId,
    status: "ACTIVE",
  },
});
```

### Issue: Slow Authentication (>100ms)

**Symptoms:**

- Auth works but is slow
- Backend logs show latency warnings
- Poor user experience

**Diagnosis:**

1. Check database connection
2. Verify JWT validation isn't making external calls
3. Check if user lookup is optimized

**Fix:**

```typescript
// Optimize user lookup in jwt.strategy.ts
const user = await this.prisma.user.findUnique({
  where: { id: payload.sub },
  select: {
    id: true,
    email: true,
    name: true,
    role: true,
    settings: true, // Only select needed fields
  },
});
```

## Monitoring & Alerts

### Set Up Metrics Collection

```bash
# Check auth metrics every minute
watch -n 60 'curl -s http://localhost:4000/debug/auth-metrics'
```

### Alert Conditions

Create alerts for:

- **Auth failure rate > 10%**: Possible attack or misconfiguration
- **Avg latency > 100ms**: Performance degradation
- **401 spike**: Token refresh issues
- **403 spike**: Permission misconfiguration

### Health Check Integration

```bash
# Production health check
curl http://localhost:4000/api/v1/health

# Should return 200 OK:
{
  "status": "ok",
  "timestamp": "2025-12-27T23:45:00.000Z",
  "service": "aprendeai-api"
}
```

## Development Workflow

### Testing Auth Locally

1. **Start backend with logging**:

   ```bash
   cd services/api
   npm run start:dev
   ```

2. **Test public endpoint**:

   ```bash
   curl http://localhost:4000/api/v1/health
   ```

3. **Login and get token**:

   ```bash
   curl -X POST http://localhost:4000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your@email.com","password":"yourpassword"}'
   ```

4. **Test protected endpoint**:
   ```bash
   TOKEN="<paste_token_here>"
   curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:4000/api/v1/profile
   ```

### Adding New Protected Endpoint

1. **Create endpoint** (automatically protected):

   ```typescript
   @Get('my-data')
   getMyData(@CurrentUser() user: User) {
     return this.service.getData(user.id);
   }
   ```

2. **Test without auth** (should return 401):

   ```bash
   curl http://localhost:4000/api/v1/my-data
   ```

3. **Test with auth** (should work):
   ```bash
   curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:4000/api/v1/my-data
   ```

### Adding New Public Endpoint

1. **Add `@Public()` decorator**:

   ```typescript
   @Public()
   @Get('public-data')
   getPublicData() {
     return { data: 'available to all' };
   }
   ```

2. **Add to config** (optional but recommended):

   ```typescript
   // config/public-routes.config.ts
   export const PUBLIC_ROUTES = [
     // ... existing routes
     "/api/v1/public-data",
   ];
   ```

3. **Test without auth** (should work):
   ```bash
   curl http://localhost:4000/api/v1/public-data
   ```

## Need More Help?

- Check `docs/AUTH_ARCHITECTURE.md` for detailed architecture
- Check backend logs for detailed error messages
- Use `/debug/auth-metrics` to monitor auth performance
- Enable DEBUG logging: `LOG_LEVEL=debug npm run start:dev`
