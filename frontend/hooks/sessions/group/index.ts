// Group Sessions Hooks Barrel File
// Group study session management with WebSocket events

// Export specific hooks from use-sessions
export {
  useSession as useGroupSession,
  useCreateSession,
  useStartSession,
  useAdvanceRound,
  useSubmitEvent,
  useSessionEvents as useGroupSessionEventsLegacy,
  useSharedCards
} from './use-sessions';

// Export from use-session-events (aliased to avoid conflict)
export {
  useSessionEvents as useGroupSessionEvents,
  StudyGroupEvent
} from './use-session-events';
