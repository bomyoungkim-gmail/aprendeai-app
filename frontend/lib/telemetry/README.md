# Telemetry & Content Mode System

## Overview

This directory contains the client-side implementation of the Telemetry and Content Mode system for the AprendeAI application.

## Key Components

### 1. Telemetry Client

`frontend/lib/telemetry/telemetry-client.ts`

- **Singleton Architecture**: accessible via `telemetryClient`.
- **Buffering**: Accumulates events in memory.
- **Batching**: Sends batches of 50 events or every 10 seconds.
- **Reliability**: Uses `fetch` with `keepalive` on page unload to ensure data persistence.

### 2. React Hooks

- **`useTelemetry(contentId)`**: Main hook. Provides `track(eventType, data)` method. Enriches events with `sessionId`, `userId`, `contentId`.
- **`useScrollTracking`**: Automatically tracks scroll depth (25%, 50%, 75%, 90%, 100%).
- **`useTimeTracking`**: Tracks active engagement time. Pauses when tab is hidden or user is inactive > 1 min.

### 3. Content Mode

`frontend/lib/config/mode-config.ts`

- Defines 6 modes: `NARRATIVE`, `DIDACTIC`, `TECHNICAL`, `NEWS`, `SCIENTIFIC`, `LANGUAGE`.
- Configures UI behavior (colors, labels) and detection heuristics.

## Event Schema (v1.0.0)

Every event sent to `/telemetry/batch` includes:

- `eventType`: string (e.g., 'VIEW_CONTENT', 'SCROLL_DEPTH')
- `eventVersion`: '1.0.0'
- `uiPolicyVersion`: from config
- `sessionId`: uuid
- `userId`: uuid (if authenticated)
- `contentId`: uuid
- `mode`: current content mode
- `data`: JSON payload (flexible)
- `timestamp`: epoch ms

## Usage Example

```typescript
import { useTelemetry } from "@/hooks/telemetry/use-telemetry";

function MyComponent() {
  const { track } = useTelemetry("content-123");

  const handleClick = () => {
    track("BUTTON_CLICK", { buttonId: "save_note" });
  };

  return <button onClick={handleClick}>Save</button>;
}
```
