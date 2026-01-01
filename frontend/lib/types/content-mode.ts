export enum ContentMode {
  NARRATIVE = 'NARRATIVE',
  DIDACTIC = 'DIDACTIC',
  TECHNICAL = 'TECHNICAL',
  NEWS = 'NEWS',
  SCIENTIFIC = 'SCIENTIFIC',
  LANGUAGE = 'LANGUAGE'
}

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
