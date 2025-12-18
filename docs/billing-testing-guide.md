# Billing System - Testing Walkthrough

**Purpose**: Step-by-step guide to test the complete SaaS billing system implementation.

**Date**: 2025-12-18  
**Status**: Ready for Testing

---

## 🎯 Test Scope

This walkthrough covers testing:

1. **Auto-subscription on signup** (Phase C)
2. **Entitlements resolver** (Phase B)
3. **Admin plan management** (Phase D)
4. **Enforcement & limits** (Phase B)
5. **Usage tracking** (Phase B)
6. **Frontend pages** (Phases F-H)
7. **Integration scenarios**

---

## ✅ Test 1: Auto FREE Subscription on Signup

### Objective

Verify that every new user gets a FREE subscription automatically.

### Steps

1. **Navigate to signup page**

   ```
   http://localhost:3000/signup
   ```

2. **Create new user**

   ```
   Email: test-user-1@test.com
   Password: TestPass123!
   Name: Test User 1
   ```

3. **Submit form**

### Expected Results

- ✅ User created successfully
- ✅ Redirected to dashboard/login
- ✅ Can login with credentials

### Verification (Backend)

Query database to confirm subscription:

```sql
SELECT s.*, p.code as plan_code
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.scope_id = '<user_id>';
```

**Expected**:

- `status` = `ACTIVE`
- `plan_code` = `FREE`
- `source` = `INTERNAL`
- `current_period_start` = signup timestamp
- `current_period_end` = `NULL`

### API Test

```bash
# Get user's subscription
curl -H "Authorization: Bearer <jwt_token>" \
  http://localhost:4000/me/subscription
```

**Expected Response**:

```json
{
  "id": "...",
  "scopeType": "USER",
  "scopeId": "<user_id>",
  "status": "ACTIVE",
  "plan": {
    "code": "FREE",
    "name": "Free Plan",
    "entitlements": {
      "features": { ... },
      "limits": {
        "api_calls_per_day": 100,
        "ai_tokens_per_month": 10000,
        ...
      }
    }
  }
}
```

---

## ✅ Test 2: Entitlements Resolver (No Fallback)

### Objective

Verify resolver throws error if subscription missing (fail-secure design).

### Setup

Manually delete a user's subscription (or create user without calling createFreeSubscription):

```sql
DELETE FROM subscriptions WHERE scope_id = '<test_user_id>';
```

### Test API Call

```bash
curl -H "Authorization: Bearer <jwt_token>" \
  http://localhost:4000/me/entitlements
```

### Expected Result

**HTTP 500 Internal Server Error**

```json
{
  "statusCode": 500,
  "message": "SUBSCRIPTION_MISSING",
  "code": "SUBSCRIPTION_MISSING",
  "scopeType": "USER",
  "scopeId": "<user_id>"
}
```

### Verification

- ✅ No implicit fallback to FREE
- ✅ Error thrown immediately
- ✅ System event logged (if implemented)

### Self-Heal Test

**Login again** with same user → should auto-create FREE subscription.

---

## ✅ Test 3: Admin Plan Management

### 3A: List Plans

```bash
curl -H "Authorization: Bearer <admin_jwt>" \
  http://localhost:4000/admin/billing/plans
```

**Expected**: Array of 3 plans (FREE, PRO, INSTITUTION)

### 3B: Create Custom Plan

```bash
curl -X POST \
  -H "Authorization: Bearer <admin_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TRIAL",
    "name": "Trial Plan",
    "description": "14-day trial",
    "monthlyPrice": null,
    "entitlements": {
      "features": {
        "ai_chat": true,
        "advanced_analytics": false
      },
      "limits": {
        "api_calls_per_day": 500,
        "ai_tokens_per_month": 50000
      }
    }
  }' \
  http://localhost:4000/admin/billing/plans
```

**Expected**:

- ✅ Plan created
- ✅ Audit log entry created
- ✅ `code` = "TRIAL"

### 3C: Update Plan

```bash
curl -X PUT \
  -H "Authorization: Bearer <admin_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "entitlements": {
      "limits": {
        "api_calls_per_day": 1000
      }
    }
  }' \
  http://localhost:4000/admin/billing/plans/<plan_id>
```

**Expected**:

- ✅ Plan updated
- ✅ Audit log with before/after

---

## ✅ Test 4: Manual Plan Assignment (Admin)

### Objective

Admin upgrades user from FREE to PRO.

### Steps

```bash
curl -X POST \
  -H "Authorization: Bearer <admin_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "scopeType": "USER",
    "scopeId": "<user_id>",
    "planCode": "PRO",
    "reason": "Customer purchased annual subscription"
  }' \
  http://localhost:4000/admin/billing/subscriptions/assign
```

### Expected Response

```json
{
  "before": {
    "planCode": "FREE",
    "planName": "Free Plan"
  },
  "after": {
    "planCode": "PRO",
    "planName": "Pro Plan"
  },
  "subscription": {
    "id": "...",
    "status": "ACTIVE",
    "plan": { ... }
  }
}
```

### Verification

1. **Old subscription cancelled**:

   ```sql
   SELECT status FROM subscriptions WHERE id = '<old_subscription_id>';
   -- Expected: CANCELED
   ```

2. **New subscription active**:

   ```bash
   curl -H "Authorization: Bearer <user_jwt>" \
     http://localhost:4000/me/subscription
   ```

   Expected: `plan.code` = "PRO"

3. **Audit log created**:
   ```bash
   curl -H "Authorization: Bearer <admin_jwt>" \
     http://localhost:4000/admin/audit?action=SUBSCRIPTION_ASSIGNED
   ```

---

## ✅ Test 5: Entitlements with Overrides

### 5A: Set Override (Admin)

```bash
curl -X POST \
  -H "Authorization: Bearer <admin_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "scopeType": "USER",
    "scopeId": "<user_id>",
    "overrides": {
      "limits": {
        "api_calls_per_day": 5000
      }
    },
    "reason": "VIP customer - special limit increase"
  }' \
  http://localhost:4000/admin/billing/overrides
```

### 5B: Verify Override Applied

```bash
curl -H "Authorization: Bearer <user_jwt>" \
  http://localhost:4000/me/entitlements
```

**Expected**:

```json
{
  "planCode": "PRO",
  "limits": {
    "api_calls_per_day": 5000, // ← Override value
    "ai_tokens_per_month": 1000000 // ← From plan
  },
  "hasOverrides": true
}
```

### 5C: Remove Override

```bash
curl -X DELETE \
  -H "Authorization: Bearer <admin_jwt>" \
  http://localhost:4000/admin/billing/overrides/USER/<user_id>
```

---

## ✅ Test 6: Enforcement & Limit Checking

### Objective

Verify enforcement throws `LIMIT_EXCEEDED` when limits reached.

### Setup Mock Endpoint

Create test endpoint that uses enforcement:

```typescript
@Post('test-enforcement')
async testEnforcement(@Request() req) {
  // Check limit before allowing action
  await this.enforcementService.enforceLimit(
    'USER',
    req.user.userId,
    'api_calls_per_day',
    1,
    process.env.NODE_ENV as any,
  );

  // If we get here, limit not exceeded
  return { success: true };
}
```

### Test Scenario

1. **User with FREE plan** (limit: 100 api_calls_per_day)
2. **Create 100 usage events** (reach limit)
3. **Call test endpoint** (101st call)

### Expected Error

**HTTP 429 Too Many Requests**

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Limit exceeded for api_calls_per_day",
  "code": "LIMIT_EXCEEDED",
  "metric": "api_calls_per_day",
  "limit": 100,
  "current": 100,
  "upgradeHint": true
}
```

---

## ✅ Test 7: Usage Tracking

### 7A: Track Usage Event

```typescript
// In your API endpoint
await this.usageTrackingService.trackUsage({
  scopeType: "USER",
  scopeId: req.user.userId,
  metric: "api_calls",
  quantity: 1,
  environment: "DEVELOPMENT",
  endpoint: "/api/generate-content",
  approxCostUsd: 0.002,
  requestId: req.id,
});
```

### 7B: Query Usage

```bash
curl -H "Authorization: Bearer <jwt_token>" \
  http://localhost:4000/me/usage?range=today
```

**Expected Response**:

```json
{
  "range": "today",
  "metrics": {
    "api_calls": {
      "quantity": 42,
      "cost": 0.084,
      "count": 42
    }
  },
  "totalCost": 0.084,
  "recentEvents": [ ... ]
}
```

---

## ✅ Test 8: Frontend - Pricing Page

### Navigate

```
http://localhost:3000/pricing
```

### Visual Checks

- ✅ 3 plans displayed (FREE, PRO, INSTITUTION)
- ✅ PRO has "Popular" badge
- ✅ Prices shown correctly
  - FREE: "Free"
  - PRO: "$29.99/month"
  - INSTITUTION: "$299.99/month"
- ✅ Features listed for each plan
- ✅ Limits shown (unlimited as "∞")
- ✅ Current plan has "Current Plan" button (if logged in)
- ✅ Other plans have "Get Started" or "Request Upgrade"

### Interaction Test

1. **Click "Request Upgrade" on PRO**
2. **Expected**: Alert saying "Upgrade to PRO requested!"

---

## ✅ Test 9: Frontend - Billing Settings

### Navigate

```
http://localhost:3000/settings/billing
```

### Visual Checks

- ✅ Current plan card shows:
  - Plan name (e.g., "Free Plan")
  - Status badge (ACTIVE in green)
  - Description
- ✅ Usage dashboard shows:
  - Progress bars for each limit
  - Current usage / Limit
  - Color coding (green/yellow/red based on %)
- ✅ Upgrade CTA visible (if on FREE)
- ✅ Auto-refresh every 60 seconds

### Test Progression

1. **Start with 0 usage**

   - All progress bars empty/green

2. **Make some API calls** (simulate usage)

   - Progress bars update (may need manual refresh)

3. **Approach limit** (90%+)
   - Progress bar turns red
   - Warning message appears

---

## ✅ Test 10: Frontend - Paywall Modal

### Manual Trigger Test

Since paywall triggers on API error, we need to simulate:

**Option A: Manual Trigger** (add button to test page)

```tsx
import { PaywallModal } from '@/components/billing/PaywallModal';

const [showPaywall, setShowPaywall] = useState(false);
const [error, setError] = useState({
  metric: 'api_calls_per_day',
  limit: 100,
  current: 100,
});

<button onClick={() => setShowPaywall(true)}>Test Paywall</button>
<PaywallModal
  isOpen={showPaywall}
  onClose={() => setShowPaywall(false)}
  error={error}
/>
```

**Option B: Reach Real Limit**

1. Use FREE account
2. Make 100 API calls
3. Make 101st call
4. Paywall should appear

### Visual Checks

- ✅ Modal appears with yellow warning icon
- ✅ Shows "Limit Reached" title
- ✅ Displays metric name formatted nicely
- ✅ Shows current vs limit (100 / 100)
- ✅ Progress bar at 100% (yellow)
- ✅ Upgrade CTA button visible
- ✅ "Close" button works
- ✅ Clicking "View Plans & Upgrade" → redirects to /pricing

---

## ✅ Test 11: Cancel & Downgrade

### Cancel PRO → Auto-downgrade to FREE

```bash
curl -X POST \
  -H "Authorization: Bearer <admin_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "<pro_subscription_id>",
    "cancelAtPeriodEnd": false,
    "reason": "Customer requested cancellation"
  }' \
  http://localhost:4000/admin/billing/subscriptions/cancel
```

### Expected

- ✅ PRO subscription status → `CANCELED`
- ✅ NEW FREE subscription created automatically
- ✅ User's `/me/subscription` returns FREE plan

---

## ✅ Test 12: Integration - Full User Journey

### Scenario: New user → Exceeds limit → Upgrades → Uses advanced features

1. **Signup** (auto-gets FREE)

   - Verify subscription created

2. **Use app** normally

   - Make 50 API calls
   - Check usage dashboard (50/100)

3. **Reach limit**

   - Make 51 more calls (total 101)
   - 101st call returns 429 LIMIT_EXCEEDED
   - Paywall modal appears

4. **Request upgrade** (via pricing page)

   - Admin assigns PRO plan manually

5. **Verify entitlements changed**

   - `/me/entitlements` shows PRO limits
   - Can now make 10,000 calls/day

6. **Use advanced features**
   - Features previously disabled now enabled
   - No more limit errors

---

## 📊 Test Checklist Summary

### Backend

- [ ] Signup creates FREE subscription (Test 1)
- [ ] Resolver throws if subscription missing (Test 2)
- [ ] Self-heal on login works (Test 2)
- [ ] Admin can create/update plans (Test 3)
- [ ] Admin can assign plans (Test 4)
- [ ] Overrides apply correctly (Test 5)
- [ ] Enforcement throws LIMIT_EXCEEDED (Test 6)
- [ ] Usage tracking records events (Test 7)
- [ ] Cancel auto-downgrades to FREE (Test 11)

### Frontend

- [ ] Pricing page displays correctly (Test 8)
- [ ] Billing settings shows usage (Test 9)
- [ ] Paywall modal appears on limit (Test 10)
- [ ] Upgrade CTAs work (Tests 8-10)

### Integration

- [ ] Full user journey works (Test 12)
- [ ] Audit logs created for all actions
- [ ] Transaction rollback on failures

---

## 🐛 Known Issues / Edge Cases

### To Test

1. **Concurrent signup** - Does transaction prevent duplicate subscriptions?
2. **Plan deleted** - What happens if active plan is soft-deleted?
3. **Negative usage** - Can quantity be negative? (should validate)
4. **Unlimited limits** - Does -1 work correctly everywhere?
5. **Date ranges** - Do usage queries handle timezone correctly?

### Recommendations

- Add integration tests for critical flows
- Monitor `/me/subscription` call performance
- Add caching for entitlements (Redis)
- Implement webhook handler for payments
- Add usage cleanup job (old data retention)

---

## 🎯 Success Criteria

All tests passed if:

- ✅ Every signup creates FREE subscription
- ✅ No user without subscription exists
- ✅ Limits enforced correctly
- ✅ Admin can manage all aspects
- ✅ Frontend shows real-time data
- ✅ Audit trail complete
- ✅ Ready for payment provider integration

---

**Testing Status**: Ready for QA  
**Next Step**: Run full test suite + fix any issues found
