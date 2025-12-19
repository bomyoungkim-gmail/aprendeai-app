# WebSocket Real-Time API Documentation

## Overview

The AprendeAI WebSocket implementation provides real-time collaboration features for Study Groups sessions. It uses Socket.IO for bidirectional communication between the frontend and backend.

## Connection

### Endpoint

```
ws://localhost:8000/study-groups
```

### Authentication

WebSocket connections require JWT authentication via one of two methods:

**Method 1: Auth Object (Recommended)**

```typescript
import { io } from "socket.io-client";

const socket = io("http://localhost:8000/study-groups", {
  auth: {
    token: "your-jwt-token", // No 'Bearer' prefix needed
  },
});
```

**Method 2: Query Parameters**

```typescript
const socket = io("http://localhost:8000/study-groups?token=your-jwt-token");
```

### Connection Events

```typescript
socket.on("connect", () => {
  console.log("Connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("Connection error:", error.message);
});
```

---

## Client-Side Events (Emit)

### Join Session

Join a specific study group session to start receiving events.

```typescript
socket.emit("joinSession", { sessionId: "session-uuid" });
```

**Response:** Server logs locally, other users receive `userJoined` event.

### Leave Session

Leave a session room.

```typescript
socket.emit("leaveSession", { sessionId: "session-uuid" });
```

**Response:** Other users receive `userLeft` event.

---

## Server-Side Events (Listen)

All events follow this format:

```typescript
{
  ...eventData,
  timestamp: "2025-12-19T08:00:00.000Z"
}
```

### User Presence Events

#### `userJoined`

Emitted when a user joins the session room.

```typescript
socket.on("userJoined", (data) => {
  console.log(data);
  // {
  //   userId: "user-uuid",
  //   userName: "John Doe",
  //   timestamp: "2025-12-19T08:00:00.000Z"
  // }
});
```

#### `userLeft`

Emitted when a user leaves the session room.

```typescript
socket.on("userLeft", (data) => {
  console.log(data);
  // {
  //   userId: "user-uuid"
  //   timestamp: "2025-12-19T08:00:00.000Z"
  // }
});
```

---

### Session Lifecycle Events

#### `session.started`

Emitted when facilitator starts the session.

```typescript
socket.on("session.started", (data) => {
  console.log(data);
  // {
  //   sessionId: "session-uuid",
  //   status: "RUNNING",
  //   startedBy: "user-uuid",
  //   timestamp: "2025-12-19T08:00:00.000Z"
  // }
});
```

**Triggers:**

- `PUT /group-sessions/:sessionId/start`

**Frontend Action:**

- Invalidate `['session', sessionId]` query
- Update UI to show session running
- Start timer

---

#### `session.ended`

Emitted when session finishes.

```typescript
socket.on("session.ended", (data) => {
  console.log(data);
  // {
  //   sessionId: "session-uuid",
  //   status: "FINISHED",
  //   timestamp: "2025-12-19T08:00:00.000Z"
  // }
});
```

---

### Round Events

#### `round.advanced`

Emitted when facilitator advances round status.

```typescript
socket.on("round.advanced", (data) => {
  console.log(data);
  // {
  //   sessionId: "session-uuid",
  //   roundId: "round-uuid",
  //   roundIndex: 1,
  //   status: "VOTING" | "DISCUSSING" | "REVOTING" | "EXPLAINING" | "DONE",
  //   timestamp: "2025-12-19T08:00:00.000Z"
  // }
});
```

**Triggers:**

- `POST /group-sessions/:sessionId/rounds/:roundIndex/advance`

**Frontend Action:**

- Invalidate `['session', sessionId]` query
- Update round status UI
- Show appropriate panel (VotingPanel, DiscussionPanel, etc.)

---

#### `prompt.updated`

Emitted when facilitator updates the round question.

```typescript
socket.on("prompt.updated", (data) => {
  console.log(data);
  // {
  //   sessionId: "session-uuid",
  //   roundId: "round-uuid",
  //   roundIndex: 1,
  //   prompt: "What is the main idea?",
  //   timestamp: "2025-12-19T08:00:00.000Z"
  // }
});
```

**Triggers:**

- `PATCH /group-sessions/:sessionId/rounds/:roundIndex/prompt`

---

### Activity Events

#### `vote.submitted`

Emitted when a user submits their vote.

```typescript
socket.on("vote.submitted", (data) => {
  console.log(data);
  // {
  //   sessionId: "session-uuid",
  //   roundId: "round-uuid",
  //   roundIndex: 1,
  //   userId: "user-uuid",
  //   eventType: "PI_VOTE_SUBMIT",
  //   timestamp: "2025-12-19T08:00:00.000Z"
  // }
});
```

**Triggers:**

- `POST /group-sessions/:sessionId/events` with eventType: `PI_VOTE_SUBMIT`

**Frontend Action:**

- Invalidate `['session', sessionId]` query
- Invalidate `['events', sessionId]` query
- Update vote progress indicator

---

#### `revote.submitted`

Emitted when a user submits their revote.

```typescript
socket.on("revote.submitted", (data) => {
  console.log(data);
  // {
  //   sessionId: "session-uuid",
  //   roundId: "round-uuid",
  //   roundIndex: 1,
  //   userId: "user-uuid",
  //   eventType: "PI_REVOTE_SUBMIT",
  //   timestamp: "2025-12-19T08:00:00.000Z"
  // }
});
```

---

#### `sharedCard.created`

Emitted when scribe submits group explanation.

```typescript
socket.on("sharedCard.created", (data) => {
  console.log(data);
  // {
  //   sessionId: "session-uuid",
  //   roundId: "round-uuid",
  //   roundIndex: 1,
  //   timestamp: "2025-12-19T08:00:00.000Z"
  // }
});
```

**Triggers:**

- `POST /group-sessions/:sessionId/events` with eventType: `GROUP_EXPLANATION_SUBMIT`

**Frontend Action:**

- Invalidate `['session', sessionId]` query
- Show toast notification
- Update shared cards count

---

### Chat Events

#### `chat.message`

Emitted when a user sends a chat message.

```typescript
socket.on("chat.message", (data) => {
  console.log(data);
  // {
  //   sessionId: "session-uuid",
  //   roundIndex: 1,
  //   message: "I think the answer is A",
  //   userId: "user-uuid",
  //   userName: "John Doe",
  //   timestamp: "2025-12-19T08:00:00.000Z"
  // }
});
```

**Triggers:**

- `POST /groups/:groupId/sessions/:sessionId/chat`

**Frontend Action:**

- Append message to chat UI
- Show notification if chat panel closed

---

## Frontend Integration

### React Hook Example

```typescript
// hooks/use-session-events.ts
import { useEffect } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useQueryClient } from "@tanstack/react-query";

export function useSessionEvents(sessionId: string) {
  const { socket, isConnected, joinSession, leaveSession } = useWebSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isConnected || !sessionId) return;

    // Join session room
    joinSession(sessionId);

    // Listen to events
    const handleSessionStarted = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    };

    const handleRoundAdvanced = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    };

    const handleVoteSubmitted = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["events", sessionId] });
    };

    socket.on("session.started", handleSessionStarted);
    socket.on("round.advanced", handleRoundAdvanced);
    socket.on("vote.submitted", handleVoteSubmitted);

    // Cleanup
    return () => {
      socket.off("session.started", handleSessionStarted);
      socket.off("round.advanced", handleRoundAdvanced);
      socket.off("vote.submitted", handleVoteSubmitted);
      leaveSession(sessionId);
    };
  }, [socket, isConnected, sessionId]);

  return { isConnected };
}
```

---

## Error Handling

### Connection Errors

```typescript
socket.on("connect_error", (error) => {
  if (error.message.includes("token")) {
    // JWT expired or invalid - refresh token
    refreshAuthToken().then((newToken) => {
      socket.auth = { token: newToken };
      socket.connect();
    });
  }
});
```

### Reconnection

Socket.IO automatically reconnects on disconnect. Frontend should:

1. Show "Reconnecting..." status
2. Re-join session after reconnect:

```typescript
socket.on("connect", () => {
  if (activeSessionId) {
    socket.emit("joinSession", { sessionId: activeSessionId });
    // Sync state
    queryClient.invalidateQueries({ queryKey: ["session", activeSessionId] });
  }
});
```

---

## Testing

### Manual Testing

Use browser DevTools → Network → WS tab to inspect frames:

```
↑ emit: joinSession {"sessionId":"abc123"}
↓ receive: userJoined {"userId":"def456","userName":"Jane",...}
↓ receive: round.advanced {"roundIndex":1,"status":"VOTING",...}
```

### Integration Tests

See `test/integration/websocket.spec.ts` for examples:

```bash
npm run test:integration websocket.spec.ts
```

---

## Backend Implementation

### Emitting Events

```typescript
// In any service
constructor(private readonly wsGateway: StudyGroupsWebSocketGateway) {}

someMethod() {
  // Emit to all users in session
  this.wsGateway.emitToSession(sessionId, 'session.started', {
    sessionId,
    status: 'RUNNING',
    startedBy: userId,
  });
}
```

### Module Configuration

```typescript
// WebSocketModule exports gateway
@Module({
  imports: [AuthModule],
  providers: [StudyGroupsWebSocketGateway],
  exports: [StudyGroupsWebSocketGateway], // ✅ Must export!
})
export class WebSocketModule {}

// StudyGroupsModule imports WebSocketModule
@Module({
  imports: [PrismaModule, WebSocketModule], // ✅ Must import!
  providers: [GroupSessionsService, ...],
})
export class StudyGroupsModule {}
```

---

## Performance Considerations

- **Room-based broadcasting**: Events only sent to users in the session room
- **HTTP fallback**: App works without WebSocket (query invalidation via polling)
- **Automatic reconnect**: Built-in reconnection logic with exponential backoff
- **Binary data**: Not currently used (all JSON)

---

## Security

- ✅ JWT authentication required for connection
- ✅ User identity validated via JwtService
- ✅ CORS configured (`FRONTEND_URL` environment variable)
- ✅ Room isolation (users only receive events from joined sessions)

---

## Troubleshooting

### Events not received

**Check backend logs:**

```
[WebSocket] Client connected: <socket-id>, User: <user-id>
[WebSocket] User <user-id> joined session <session-id>
[WebSocket] Emitted <event> to session <session-id>
```

**Check frontend console:**

```
[WebSocket] Connected: <socket-id>
[WebSocket] Joining session: <session-id>
[WebSocket] Round advanced: {...}
```

### "Invalid or expired token"

- Token may be expired (check `exp` claim)
- Token may be missing `sub` (userId), `email`, or `name`
- JWT_SECRET mismatch between services

### "Cannot read property 'emitToSession' of undefined"

- WebSocketModule not exported
- StudyGroupsModule not importing WebSocketModule
- Check module configuration

---

## Future Enhancements

- [ ] Typing indicators for chat
- [ ] Read receipts
- [ ] Binary protocol for performance
- [ ] Connection pooling for scaling
- [ ] Redis adapter for multi-server deployments
