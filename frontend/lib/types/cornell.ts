// Cornell Reader Types

export interface Content {
  id: string;
  title: string;
  contentType: 'PDF' | 'IMAGE' | 'DOCX' | 'ARTICLE' | 'VIDEO' | 'AUDIO';
  sourceUrl?: string;
  file?: {
    id: string;
    viewUrl: string;
    mimeType: string;
    originalFilename?: string;
    storageKey?: string;
  };
  createdAt: string;
  updatedAt: string;
  duration?: number;
}

export interface CornellNotes {
  id: string;
  contentId: string;
  userId: string;
  cuesJson: CueItem[];
  notesJson: NoteItem[];
  summaryText: string;
  createdAt: string;
  updatedAt: string;
}

export interface CueItem {
  id: string;
  prompt: string;
  linkedHighlightIds: string[];
}

export interface NoteItem {
  id: string;
  body: string;
  linkedHighlightIds: string[];
}

export interface Highlight {
  id: string;
  contentId: string;
  userId: string;
  kind: 'TEXT' | 'AREA';
  targetType: 'PDF' | 'IMAGE' | 'DOCX';
  pageNumber?: number;
  anchorJson: PDFTextAnchor | PDFAreaAnchor | ImageAreaAnchor | DocxTextAnchor;
  colorKey: string;
  commentText?: string;
  tagsJson: string[];
  createdAt: string;
  updatedAt: string;
}

// Anchor types
export interface PDFTextAnchor {
  type: 'PDF_TEXT';
  position: {
    boundingRect: BoundingRect;
    rects: Array<BoundingRect & { pageNumber: number }>;
    pageNumber: number;
  };
  quote?: string;
}

export interface PDFAreaAnchor {
  type: 'PDF_AREA';
  position: {
    boundingRect: BoundingRect;
    pageNumber: number;
  };
  imageSnapshotKey?: string;
}

export interface ImageAreaAnchor {
  type: 'IMAGE_AREA';
  rect: { x: number; y: number; w: number; h: number };
  zoom: number;
  viewport: { width: number; height: number };
}

export interface DocxTextAnchor {
  type: 'DOCX_TEXT';
  range: {
    startPath: string[];
    startOffset: number;
    endPath: string[];
    endOffset: number;
  };
  quote: string;
}

export interface BoundingRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
}

// API DTOs
export interface UpdateCornellDto {
  cues_json?: CueItem[];
  notes_json?: NoteItem[];
  summary_text?: string;
}

export interface CreateHighlightDto {
  kind: 'TEXT' | 'AREA';
  target_type: 'PDF' | 'IMAGE' | 'DOCX';
  page_number?: number;
  anchor_json: PDFTextAnchor | PDFAreaAnchor | ImageAreaAnchor | DocxTextAnchor;
  color_key?: string;
  comment_text?: string;
  tags_json?: string[];
}

export interface UpdateHighlightDto {
  color_key?: string;
  comment_text?: string;
  tags_json?: string[];
}

// UI State
export type ViewMode = 'original' | 'study' | 'review';
export type SaveStatus = 'saved' | 'saving' | 'offline' | 'error';

// Re-export color types from centralized location
export type { ColorKey as HighlightColor } from '@/lib/constants/colors';
