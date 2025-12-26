// Sessions Hooks Barrel File
// Unified entry point for all session-related hooks

// Reading sessions (individual) - aliased to avoid conflicts with group
export {
  useSession as useReadingSession,
  useSessionEvents as useReadingSessionEvents
} from './reading';

// Group sessions (collaborative) - using aliases from group/index.ts
export {
  useGroupSession,
  useGroupSessionEvents,
  useGroupSessionEventsLegacy,
  useCreateSession,
  useStartSession,
  useAdvanceRound,
  useSubmitEvent,
  useSharedCards,
  StudyGroupEvent
} from './group';

// Sessions history (shared)
export { useSessionsHistory } from './use-sessions-history';
