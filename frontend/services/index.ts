/**
 * Services Index
 * 
 * Central export point for all services
 */

// Storage Service (Fase 1.2)
export { storageService } from './storage/storage.service';
export type { StorageKey, StorageSchema } from './storage/storage.service';

// WebSocket Service (Fase 2.4 - NEW)
export { websocketService } from './websocket/websocket.service';

// API Services (Fase 2.1)
export * from './api';

// Domain Services - Cornell (existing)
export * from './cornell/highlights.service';

// Domain Services - Games (existing)
export * from './games/questions.service';

// Domain Services - Content (Fase 2.2 - NEW)
export * from './content/content.service';
