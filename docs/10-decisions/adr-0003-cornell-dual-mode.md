# ADR-0003 — Cornell Dual-Mode UI

**Status:** Accepted  
**Date:** 2024-12-12  
**Context:** Cornell Notes requires reading source content _while_ taking notes. Mobile screens make split-screen difficult. Desktop offers more space.

## Decision

Implement a **Dual-Mode UI state machine** for the Cornell Note interface:

1.  **Reading Mode (Default)**

    - Content takes 100% width (mobile) or 60% (desktop).
    - Notes panel is minimized or sidebar.
    - User highlights text → Context menu offers "Add to Cornell".

2.  **Editing Mode**
    - Notes panel expands/overlays.
    - Three distinct input areas: Cue (Left), Notes (Right), Summary (Bottom).
    - "Autosave" active.

**Responsiveness:**

- **Desktop:** Split pane (Left: Content, Right: Notes).
- **Mobile:** Tabbed/Overlay approach. User toggles `[Book Icon]` (Read) vs `[Pen Icon]` (Note).

**Highlight Linking:**

- In Reading Mode: Selecting text creates a "Highlight".
- This Highlight stores an `anchor` (coordinates/index).
- In Editing Mode: Clicking a highlight in content scrolls to the linked Note.

## Consequences

**Positive:**

- Optimizes for the specific task (reading vs writing).
- Solves mobile screen real estate issue.
- Keeps UI clean.

**Negative:**

- State management complexity (syncing modes).
- "Where did my note go?" confusion if hidden.

## Alternatives Considered

### 1. Always Split Screen

Rejected for mobile (too cramped).

### 2. Floating Note Window

Rejected. Hard to manage `z-index` and focus on web.

### 3. Inline Notes (Google Docs style comments)

Rejected. Cornell method specifically requires the "Cue/Note/Summary" layout structure, not just marginalia.

## Links

- [Cornell Panel Component Spec](../06-frontend/01-cornell-ui.md)
