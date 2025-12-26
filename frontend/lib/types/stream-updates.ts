// Stream item update types for better type safety

export interface HighlightUpdates {
  commentText?: string;
  colorKey?: string;
}

export interface NoteUpdates {
  body?: string;
}

export type StreamItemUpdates = HighlightUpdates | NoteUpdates;
