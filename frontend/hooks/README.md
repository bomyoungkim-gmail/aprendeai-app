# Hooks Import Guide

## ✅ Correct Import Patterns

### Cornell Hooks

```typescript
// Data fetching
import { useContent } from "@/hooks/cornell/use-data";
import { useCornellNotes, useHighlights } from "@/hooks/cornell/use-data";

// Auto-save and status
import { useCornellAutosave } from "@/hooks/cornell/use-autosave";
import { useSaveStatusWithOnline } from "@/hooks/ui/use-online-status";

// Suggestions and AI
import { useSuggestions } from "@/hooks/cornell/use-suggestions";
import { useContentContext } from "@/hooks/cornell/use-content-context";

// Unified stream
import { useUnifiedStream } from "@/hooks/cornell/use-unified-stream";
import { useStreamFilter } from "@/hooks/cornell/use-stream-filter";

// Mutations
import {
  useUpdateCornellNotes,
  useCreateHighlight,
  useUpdateHighlight,
  useDeleteHighlight,
} from "@/hooks/cornell";
```

### Session Hooks

```typescript
// Reading sessions
import { useReadingSession } from "@/hooks/sessions/reading/use-session";
import { useReadingSessionEvents } from "@/hooks/sessions/reading/use-session-events";

// Group sessions
import { useGroupSession } from "@/hooks/sessions/group/use-sessions";
import { useGroupSessionEvents } from "@/hooks/sessions/group/use-session-events";

// History
import { useSessionsHistory } from "@/hooks/sessions/use-sessions-history";
```

### UI Hooks

```typescript
// Text selection
import { useTextSelection } from "@/hooks/ui/use-text-selection";
import { useTextSelectionAdapted } from "@/hooks/ui/use-text-selection-adapted";

// Utilities
import { useDebounce } from "@/hooks/ui/use-debounce";
import { useOnlineStatus } from "@/hooks/ui/use-online-status";
import { useFocusTracking } from "@/hooks/ui/use-focus-tracking";
```

### Content Hooks

```typescript
import { useUploadContent } from "@/hooks/content/use-upload";
import { useAnnotations } from "@/hooks/content/use-annotations";
import { useContentSearch } from "@/hooks/content/use-search";
import { useRecommendations } from "@/hooks/content/use-recommendations";
```

### Game Hooks

```typescript
import { useGameAnimation } from "@/hooks/games/use-game-animation";
import { useGameProgress } from "@/hooks/games/use-game-progress";
import { useRoundTimer } from "@/hooks/games/use-round-timer";
```

---

## ❌ Anti-Patterns (Avoid These)

### Deprecated Barrel Import

```typescript
// ❌ DON'T DO THIS - Deprecated!
import { useCornellAutosave, useContent } from "@/hooks";
```

**Why avoid?**

- Main barrel (`hooks/index.ts`) is deprecated
- Causes bundling issues
- Hides dependencies
- Slower TypeScript compilation

### Wildcard Exports in Your Own Barrels

```typescript
// ❌ DON'T DO THIS
export * from "./use-my-hook";
export * from "./use-another-hook";
```

**Why avoid?**

- Can cause naming conflicts
- Poor tree-shaking
- Makes refactoring harder

**Do this instead:**

```typescript
// ✅ DO THIS - Explicit exports
export { useMyHook } from "./use-my-hook";
export { useAnotherHook, type MyHookOptions } from "./use-another-hook";
```

---

## 🏗️ Hook Organization Structure

```
hooks/
├── auth/               # Authentication hooks
│   ├── use-oauth.ts
│   └── index.ts
├── billing/            # Billing & subscriptions
│   ├── use-entitlements.ts
│   └── index.ts
├── content/            # Content management
│   ├── use-upload.ts
│   ├── use-annotations.ts
│   ├── use-search.ts
│   └── index.ts
├── cornell/            # Cornell Notes
│   ├── use-data.ts
│   ├── use-autosave.ts
│   ├── use-suggestions.ts
│   └── index.ts
├── games/              # Educational games
│   ├── use-game-animation.ts
│   ├── use-game-progress.ts
│   └── index.ts
├── profile/            # User profile
│   ├── use-activity.ts
│   └── index.ts
├── sessions/           # Study sessions
│   ├── reading/
│   ├── group/
│   └── index.ts
├── shared/             # Shared utilities
│   ├── use-auto-track.ts
│   ├── use-search.ts
│   └── index.ts
├── social/             # Social features
│   ├── use-family.ts
│   ├── use-groups.ts
│   └── index.ts
└── ui/                 # UI utilities
    ├── use-debounce.ts
    ├── use-online-status.ts
    └── index.ts
```

---

## 📝 Naming Conventions

### Hook Names

- **Prefix:** Always start with `use`
- **Descriptive:** Clearly state what it does
- **Specific:** Avoid generic names like `useData`

**Good examples:**

- `useCornellAutosave` - Clear purpose
- `useGameProgress` - Specific domain
- `useTextSelection` - Exact functionality

**Bad examples:**

- `useContent` - Too generic (which content?)
- `useData` - What data?
- `useHelper` - Not descriptive

### File Names

- **Lowercase with dashes:** `use-my-hook.ts`
- **Match hook name:** File `use-cornell-autosave.ts` exports `useCornellAutosave`
- **One hook per file:** (exceptions for tightly coupled hooks)

---

## 🔄 Migration from Old Patterns

### If you see this pattern:

```typescript
// Old pattern
import { useCornellAutosave } from "@/hooks";
```

### Replace with:

```typescript
// New pattern
import { useCornellAutosave } from "@/hooks/cornell/use-autosave";
```

### Quick Find & Replace

**VS Code users:**

1. Open Find (`Ctrl+Shift+F`)
2. Search: `from '@/hooks'`
3. Replace individually with correct paths

---

## 🧪 Testing Hooks

### Import in Tests

```typescript
// ✅ Correct - Same direct import as production code
import { useCornellAutosave } from "@/hooks/cornell/use-autosave";
import { renderHook } from "@testing-library/react";

describe("useCornellAutosave", () => {
  it("should autosave after delay", () => {
    const { result } = renderHook(() =>
      useCornellAutosave({
        onSave: jest.fn(),
        delay: 500,
      })
    );
    // ...
  });
});
```

---

## 🚀 Performance Benefits

### Direct Imports Enable:

1. **Better Tree-Shaking**

   - Unused hooks completely eliminated from bundle
   - Smaller production bundles (~5-10% reduction)

2. **Faster TypeScript Compilation**

   - No need to resolve barrel files
   - Clearer dependency graph

3. **Improved Hot Module Replacement**
   - Only affected modules reload
   - Faster development iteration

---

## 🆘 Common Issues

### Issue: "Cannot find module '@/hooks/cornell/use-data'"

**Solution:** Check file exists and path is correct. May need to restart TypeScript server.

### Issue: "Hook exported but not found"

**Solution:** Check the barrel file (`index.ts`) exports the hook correctly.

### Issue: "Circular dependency detected"

**Solution:** Don't import from sibling hooks. Extract shared logic to utilities.

---

## 📚 Additional Resources

- [Option C Refactoring Walkthrough](../brain/option_c_refactoring_walkthrough.md)
- [ESLint Barrel Prevention Guide](../brain/eslint_barrel_prevention.md)
- [Frontend Code Review](../brain/frontend_code_review.md)

---

## ✅ Checklist for New Hooks

- [ ] Named with `use` prefix
- [ ] File name matches hook name (kebab-case)
- [ ] Placed in correct domain folder
- [ ] Exported from domain `index.ts` with explicit export
- [ ] Imports use direct paths (not barrels)
- [ ] Has TypeScript types defined
- [ ] Documented with JSDoc comments
- [ ] Has unit tests

---

_Last updated: 2025-12-26_  
_For questions, see [Team Wiki] or ask in #frontend-guild_
