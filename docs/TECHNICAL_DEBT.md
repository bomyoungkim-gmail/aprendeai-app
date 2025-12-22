# GitHub Issues: Family + Classroom Mode TODOs

## Issue #1: Implement Phase-Based Prompt Logic in Co-Reading Sessions

**Priority**: Medium  
**Component**: Family Mode - Co-Reading Service  
**File**: `src/family/family.controller.ts` (line 138)

**Description**:
Currently, the `getCoSessionPrompt` endpoint always returns the daily boot prompt regardless of the phase. Need to implement phase-based prompt selection logic.

**Current Code**:

```typescript
@Post('co-sessions/:id/prompt')
getCoSessionPrompt(@Param('id') sessionId: string, @Body() body: { phase: string }) {
  // TODO: Use phase-based logic
  return this.opsCoachService.getDailyBootLearner();
}
```

**Expected Behavior**:

```typescript
const promptKeys = {
  BOOT: "OPS_DAILY_BOOT_LEARNER",
  PRE: "READ_PRE_CHOICE_SKIM",
  DURING: "READ_DURING_MARK_RULE",
  POST: "READ_POST_FREE_RECALL",
};
return this.promptLibrary.getPrompt(promptKeys[phase]);
```

**Acceptance Criteria**:

- [ ] Add PromptLibraryService to FamilyController
- [ ] Implement phase validation (BOOT/PRE/DURING/POST)
- [ ] Return appropriate prompt based on phase
- [ ] Add unit tests for each phase

---

## Issue #2: Get learnerUserId from Session Context in Teach-Back

**Priority**: Medium  
**Component**: Family Mode - Teach-Back Service  
**File**: `src/family/family.controller.ts` (line 151)

**Description**:
The `getTeachBackPrompt` endpoint hardcodes `'learner_id'` string instead of getting the actual user ID from the session.

**Current Code**:

```typescript
if (step === 1) return this.teachBackService.offerMission("learner_id");
```

**Expected Behavior**:

```typescript
const session = await this.teachBackService.getSession(sessionId);
if (step === 1)
  return this.teachBackService.offerMission(session.educatorUserId);
```

**Acceptance Criteria**:

- [ ] Add `getSession(sessionId)` method to TeachBackService
- [ ] Retrieve actual educatorUserId from database
- [ ] Pass correct user ID to offerMission
- [ ] Handle session not found error

---

## Issue #3: Calculate Comprehension Average from Assessments

**Priority**: High  
**Component**: Family Mode - Dashboard Service  
**File**: `src/family/services/family-dashboard.service.ts` (line 66)

**Description**:
The dashboard currently returns a hardcoded comprehension average of 75. Need to calculate the actual average from student assessments.

**Current Code**:

```typescript
const comprehensionAvg = 75; // TODO: Calculate from assessments
```

**Expected Behavior**:

```typescript
const assessments = await this.prisma.assessment.findMany({
  where: { userId: learnerUserId },
  orderBy: { createdAt: "desc" },
  take: FAMILY_CONFIG.DASHBOARD.TREND_CALCULATION_WINDOW,
});

const comprehensionAvg =
  assessments.length > 0
    ? Math.round(
        assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length
      )
    : FAMILY_CONFIG.DASHBOARD.DEFAULT_COMPREHENSION_AVG;
```

**Acceptance Criteria**:

- [ ] Query Assessment model for recent assessments
- [ ] Calculate average score
- [ ] Use config default when no assessments exist
- [ ] Add unit tests for calculation logic
- [ ] Handle edge cases (0 assessments, null scores)

---

## Issue #4: Implement Comprehension Trend Calculation

**Priority**: Medium  
**Component**: Family Mode - Dashboard Service  
**File**: `src/family/services/family-dashboard.service.ts` (line 94)

**Description**:
The `calculateTrend` method currently returns 'FLAT' for all cases. Need to implement actual trend analysis.

**Current Code**:

```typescript
private calculateTrend(sessions: any[]): 'UP' | 'DOWN' | 'FLAT' {
  // TODO: Implement based on assessment scores
  return 'FLAT';
}
```

**Expected Logic**:

- Compare recent assessments vs previous period
- If avg improved by 10%+ → 'UP'
- If avg decreased by 10%+ → 'DOWN'
- Otherwise → 'FLAT'

**Acceptance Criteria**:

- [ ] Implement sliding window comparison
- [ ] Define thresholds in config (10% default)
- [ ] Add unit tests for UP/DOWN/FLAT scenarios
- [ ] Handle insufficient data (< 5 assessments)

---

## Issue #5: Implement Top Blockers Analysis

**Priority**: Medium  
**Component**: Family Mode - Dashboard Service  
**File**: `src/family/services/family-dashboard.service.ts` (line 108)

**Description**:
The `getTopBlockers` method returns hardcoded values. Need to analyze session events to find actual struggles.

**Current Code**:

```typescript
private async getTopBlockers(learnerUserId: string): Promise<string[]> {
  // TODO: Analyze session events to find common struggles
  return ['vocabulary', 'complex sentences'];
}
```

**Expected Logic**:

- Query SessionEvent for STRUGGLE events
- Count occurrences by category
- Return top 3 most frequent

**Acceptance Criteria**:

- [ ] Query SessionEvent with domain = 'FAMILY'
- [ ] Parse struggle categories from event data
- [ ] Aggregate and sort by frequency
- [ ] Return top 3 blockers
- [ ] Return empty array if no data

---

## Issue #6: Implement Active Alerts Detection

**Priority**: Medium  
**Component**: Family Mode - Dashboard Service  
**File**: `src/family/services/family-dashboard.service.ts` (line 115)

**Description**:
The `getAlerts` method returns empty array. Need to detect comprehension slumps and other alerts.

**Current Code**:

```typescript
private async getAlerts(learnerUserId: string) {
  // TODO: Check for slumps, low comprehension, etc.
  return [];
}
```

**Expected Alerts**:

- Comprehension below 60% (3 consecutive sessions)
- Streak broken (missed scheduled co-reading day)
- High checkpoint failure rate (>50%)

**Acceptance Criteria**:

- [ ] Define alert types and thresholds in config
- [ ] Query recent session data
- [ ] Detect each alert condition
- [ ] Return array of active alerts with severity

---

## Issue #7: Calculate Actual Comprehension in Classroom Dashboard

**Priority**: High  
**Component**: Classroom Mode - Dashboard Service  
**File**: `src/classroom/services/class-dashboard.service.ts` (line 81)

**Description**:
Similar to Family Mode, classroom dashboard returns hardcoded comprehension score.

**Current Code**:

```typescript
const comprehensionScore = 72; // TODO: Calculate from assessments
```

**Solution**: Same as Issue #3 but for classroom context

**Acceptance Criteria**:

- [ ] Query assessments by learner
- [ ] Calculate average
- [ ] Use config default when no data

---

## Implementation Priority

**High Priority** (Before v1.0):

- Issue #3: Comprehension calculation (Family)
- Issue #7: Comprehension calculation (Classroom)

**Medium Priority** (v1.1):

- Issue #1: Phase-based prompts
- Issue #2: Session context in teach-back
- Issue #4: Trend calculation
- Issue #5: Top blockers analysis
- Issue #6: Alerts detection

**Estimated Effort**:

- High priority: 4-6 hours
- Medium priority: 8-12 hours
- **Total**: 12-18 hours

---

## Labels to Use

- `enhancement`
- `family-mode` or `classroom-mode`
- `todo-cleanup`
- `analytics` (for #3, #4, #5, #7)
- `prompts` (for #1)

---

## Issue #8: Implement Vocab Model and SRS Features

**Priority**: High
**Component**: Ops Service / Review Service
**File**: `src/ops/ops.service.ts` (line 86), `src/review/review.controller.ts`

**Description**:
The Vocabulary and Spaced Repetition System (SRS) logic is currently commented out or mocked because the `Vocab` model does not exist in the Prisma schema.

**Current Code**:

```typescript
// TODO: Uncomment when Vocab model is created
const dueReviews = 0; // await this.prisma.vocab.count({ where: { userId } });
```

**Acceptance Criteria**:

- [ ] Create `Vocab` model in `schema.prisma`
- [ ] Create `VocabAttempt` model for tracking review history
- [ ] Uncomment and fix SRS logic in `OpsService`
- [ ] Implement `ReviewService` for handling spaced repetition algorithms

---

## Issue #9: Secure Vocab and Review Controllers

**Priority**: High
**Component**: API Security
**File**: `src/vocab/vocab.controller.ts`, `src/review/review.controller.ts`

**Description**:
The Vocab and Review controllers are missing proper authentication guards and user ID extraction.

**Current Code**:

```typescript
// TODO: Add proper AuthGuard in V5
// TODO: Get userId from auth token
```

**Acceptance Criteria**:

- [ ] Add `@UseGuards(JwtAuthGuard)` to controllers
- [ ] Replace mocked user IDs with `req.user.userId`
- [ ] Verify access control in integration tests

---

## Issue #10: Implement S3 Storage for Cornell Notes

**Priority**: Medium
**Component**: Cornell Service
**File**: `src/cornell/services/storage.service.ts`

**Description**:
Currently using local storage for uploads. Need to migrate to S3 for production scalability and implement signed URLs.

**Current Code**:

```typescript
// TODO: Implement S3 signed URL generation when needed
storageProvider: 'LOCAL', // TODO: Change to 'S3' for production
```

**Acceptance Criteria**:

- [ ] Configure `AWS_S3_BUCKET` and credentials
- [ ] Implement `S3StorageProvider` implementing `StorageProvider` interface
- [ ] Add pre-signed URL generation for secure uploads/downloads
- [ ] Update `ContentService` to use S3 provider in production

---

## Issue #11: Implement Billing Plan Limits

**Priority**: Medium
**Component**: Billing Service
**File**: `src/billing/plan-limits.service.ts`

**Description**:
Billing plan limits logic is commented out because `billingPlan` model is missing.

**Current Code**:

```typescript
// TODO: Re-enable when billingPlan model exists in schema
```

**Acceptance Criteria**:

- [ ] Create `BillingPlan` and `Subscription` models in Prisma
- [ ] Implement plan limits logic (e.g. max sessions/month, max storage)
- [ ] Uncomment limit checks in `PlanLimitsService`

---

## Issue #12: Implement Freeze Token Logic (Gamification)

**Priority**: Low
**Component**: Gamification Service
**File**: `src/gamification/gamification.service.ts`

**Description**:
Logic for "Freeze Tokens" (to save streaks) is missing.

**Current Code**:

```typescript
// TODO: Implement Freeze Token Logic here
```

**Acceptance Criteria**:

- [ ] Add `freezeTokens` field to `User` or `GamificationProfile`
- [ ] Implement logic to consume token instead of breaking streak
- [ ] Add API to purchase/award freeze tokens

---

## Issue #13: Teach-Back Session Integration

**Priority**: Medium
**Component**: Family Mode
**File**: `src/family/services/teachback.service.ts`

**Description**:
Teach-back service uses hardcoded target words and mocked event logging.

**Current Code**:

```typescript
W1: 'palavra1', // TODO: Get from session
// TODO: Log TEACH_BACK_FINISHED event with stars
```

**Acceptance Criteria**:

- [ ] Retrieve actual target words from `ReadingSession`
- [ ] Log `TEACH_BACK_FINISHED` event with result data
- [ ] Update frontend to display real stars/feedback
