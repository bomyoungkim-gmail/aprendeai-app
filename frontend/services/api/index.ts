/**
 * API Services Index
 * 
 * Central export point for all API services.
 * Pure API calls only - no business logic.
 */

// Cornell API
// export * from './cornell.api'; // Moved to lib/api/cornell

// Games API
export * from './games.api';

// Content API (NEW)
export * from './content.api';

// Sessions API (NEW)
export * from './sessions.api';

// Groups API (NEW)
export * from './groups.api';

// PKM API (NEW)
export * from './pkm.api';

// Default export of the axios instance
import api from '@/lib/api';
export default api;
export { api };
