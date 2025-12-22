# PromptDrawer Component

**Component**: `PromptDrawer`
**Location**: `frontend/src/components/reading/PromptDrawer.tsx`
**Status**: Production Ready ✅

## 1. Overview

The PromptDrawer is a persistent, collapsible chat interface that houses the AI Agent (Educator/OpsCoach). It replaces the old split-view layout, allowing the AI to be present without consuming 50% of the screen.

## 2. Key Features

### 2.1 States

The drawer has 3 distinct visibility states:

1.  **Collapsed** (Default)

    - Only a floating icon is visible.
    - Shows unread message badge.
    - Least intrusive.

2.  **Expanded** (Active)

    - Full chat interface.
    - Overlays content (mobile) or pushes content (desktop).
    - Input field focused.

3.  **Peek** (Minimized)
    - Small bar at the bottom.
    - Shows latest message snippet.
    - "Heads up" mode for passive assistance.

### 2.2 Behavior

- **Persistence**: Chat history is preserved across navigation within the session.
- **Auto-Minimize**: Automatically shrinks to "Peek" after 60s of inactivity to focus the user on reading.
- **Keyboard Shortcuts**:
  - `Cmd/Ctrl + D`: Toggle Expanded/Collapsed.
  - `Escape`: Minimize/Close.

## 3. Usage

```tsx
import { PromptDrawer } from "@/components/reading/PromptDrawer";

export default function ReadingPage() {
  return (
    <div className="layout">
      <ContentArea />
      <PromptDrawer sessionId="123">
        <PromptConsole />
      </PromptDrawer>
    </div>
  );
}
```

## 4. CSS Architecture

Uses strict CSS Modules for layout stability.

- `.prompt-drawer-host`: The container.
- `.drawer-content`: The scrollable area.
- `.drawer-header`: Controls (Minimize, Close).

## 5. Testing

Unit tests cover:

- State transitions.
- Auto-minimize timers.
- Keyboard shortcuts.
- Unread badge logic.

See `frontend/tests/unit/PromptDrawer.spec.tsx`.
