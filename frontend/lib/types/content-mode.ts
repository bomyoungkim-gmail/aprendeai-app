// Re-export ContentMode from Prisma generated types (single source of truth)
// This ensures frontend and backend use the exact same enum values
export { ContentMode } from '@prisma/client';

export type ContentModeSource = 'PRODUCER' | 'USER' | 'HEURISTIC';

export interface ContentModeInfo {
  mode: ContentMode | null;
  modeSource: ContentModeSource | null;
  modeSetBy: string | null;
  modeSetAt: Date | null;
}

export interface UpdateContentModePayload {
  mode: ContentMode;
  source?: 'PRODUCER' | 'USER';
}
