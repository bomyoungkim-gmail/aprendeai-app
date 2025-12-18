# Cornell Script 3/5 - Frontend Components Guide

**Version:** 1.0.0

---

## Overview

The Study Sessions frontend provides a phase-based workflow for active reading with pedagogical support.

---

## Components

### 1. SessionRibbon

**Location:** Top of reader page  
**File:** `components/cornell/session/SessionRibbon.tsx`

**Purpose:** Persistent progress indicator showing current session phase.

**Props:**

```typescript
interface SessionRibbonProps {
  session: ReadingSession;
  onAdvancePhase: (toPhase: "POST" | "FINISHED") => Promise<void>;
}
```

**Features:**

- Phase indicators: PRE → DURING → POST → FINISHED
- Time tracking
- Advance phase button
- Auto-hides when finished

**Usage:**

```tsx
<SessionRibbon session={session} onAdvancePhase={handleAdvancePhase} />
```

---

### 2. PrePhaseForm

**Type:** Modal (blocking)  
**File:** `components/cornell/session/PrePhaseForm.tsx`

**Purpose:** Pre-reading reflection form shown in PRE phase.

**Props:**

```typescript
interface PrePhaseFormProps {
  isOpen: boolean;
  minTargetWords: number;
  onSubmit: (data: PrePhaseData) => Promise<void>;
  onClose?: () => void;
}
```

**Features:**

- Goal statement textarea (min 10 chars)
- Prediction textarea (min 10 chars)
- Dynamic target words input
- Real-time validation
- Character/word counters

**Validation:**

- Shows minTargetWords from session
- Inline error messages
- Disabled submit until valid

**Usage:**

```tsx
{
  session?.phase === "PRE" && (
    <PrePhaseForm
      isOpen={true}
      minTargetWords={session.minTargetWords || 5}
      onSubmit={handlePrePhaseSubmit}
    />
  );
}
```

---

### 3. PostPhasePanel

**Type:** Slide-in sidebar  
**File:** `components/cornell/session/PostPhasePanel.tsx`

**Purpose:** Post-reading activities and DoD verification.

**Props:**

```typescript
interface PostPhasePanelProps {
  isOpen: boolean;
  sessionId: string;
  hasSummary: boolean;
  onRecordProduction: (text: string, wordCount: number) => Promise<void>;
  onClose?: () => void;
}
```

**Features:**

- DoD checklist with status icons
- Production textarea (min 50 words)
- Word counter
- Save production button
- Completion status alert

**DoD Visual:**

```
✅ Cornell Notes summary completed
⚠️ Quiz answer required (1 minimum)
⚠️ Production text required (50 words)
```

**Usage:**

```tsx
{
  session?.phase === "POST" && (
    <PostPhasePanel
      isOpen={true}
      sessionId={session.id}
      hasSummary={hasSummary}
      onRecordProduction={handleProductionSubmit}
    />
  );
}
```

---

## Hooks

### useSession

**File:** `hooks/useSession.ts`

**Purpose:** Session lifecycle management.

**Usage:**

```typescript
const {
  session, // Current session state
  loading, // Loading indicator
  error, // Error message
  startSession, // () => Promise<Session>
  updatePrePhase, // (data) => Promise<Session>
  advancePhase, // (toPhase) => Promise<Session>
  refreshSession, // () => Promise<void>
} = useSession(contentId);
```

**Features:**

- Auto-creates session on mount
- Caches session ID in localStorage
- Automatic session restoration
- Error handling

---

### useSessionEvents

**File:** `hooks/useSessionEvents.ts`

**Purpose:** Event tracking for student interactions.

**Usage:**

```typescript
const {
  recordEvent, // Generic event recorder
  recordUnknownWord, // (term, context) => Promise
  recordKeyIdea, // (highlightId, note) => Promise
  recordCheckpointResponse, // (id, response) => Promise
  recordQuizResponse, // (id, answer, confidence) => Promise
  recordProduction, // (text, wordCount) => Promise
} = useSessionEvents(sessionId);
```

**Auto-tracking:**

- Fails silently (doesn't break UX)
- Includes timestamps
- Stores arbitrary payload

---

## Integration Example

```tsx
import { useSession } from "@/hooks/useSession";
import { useSessionEvents } from "@/hooks/useSessionEvents";
import { SessionRibbon } from "@/components/cornell/session/SessionRibbon";
import { PrePhaseForm } from "@/components/cornell/session/PrePhaseForm";
import { PostPhasePanel } from "@/components/cornell/session/PostPhasePanel";

export default function ReaderPage() {
  const { session, updatePrePhase, advancePhase } = useSession(contentId);
  const { recordKeyIdea, recordProduction } = useSessionEvents(session?.id);

  const handleHighlightCreate = async (highlightId: string) => {
    if (session?.phase === "DURING") {
      await recordKeyIdea(highlightId);
    }
  };

  return (
    <div>
      {session && (
        <SessionRibbon session={session} onAdvancePhase={advancePhase} />
      )}

      {session?.phase === "PRE" && (
        <PrePhaseForm
          isOpen={true}
          minTargetWords={session.minTargetWords}
          onSubmit={updatePrePhase}
        />
      )}

      <ContentViewer onHighlightCreate={handleHighlightCreate} />

      {session?.phase === "POST" && (
        <PostPhasePanel
          isOpen={true}
          sessionId={session.id}
          hasSummary={hasSummary}
          onRecordProduction={recordProduction}
        />
      )}
    </div>
  );
}
```

---

## Styling

All components use **Tailwind CSS** with:

- Responsive design
- Dark/light mode ready
- Accessibility (ARIA labels)
- Smooth transitions

---

## Dependencies

- React 18+
- @headlessui/react (modals, transitions)
- date-fns (time formatting)
- Tailwind CSS

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

---

## Testing

Recommended manual tests:

1. Start session → PRE modal appears
2. Submit invalid data → Errors shown
3. Submit valid data → Advances to DURING
4. Create highlight → Event recorded
5. Advance to POST → Panel appears
6. Try finish without DoD → Error
7. Complete DoD → Success
