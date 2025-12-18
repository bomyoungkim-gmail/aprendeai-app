// Cornell Reader Types

export interface Content {
  id: string;
  title: string;
  contentType: 'PDF' | 'IMAGE' | 'DOCX' | 'ARTICLE';
  sourceUrl?: string;
  file?: {
    id: string;
    viewUrl: string;
    mimeType: string;
    originalFilename?: string;
  };
  createdAt: string;
  updatedAt: string;
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
  cuesJson?: CueItem[];
  notesJson?: NoteItem[];
  summaryText?: string;
}

export interface CreateHighlightDto {
  kind: 'TEXT' | 'AREA';
  targetType: 'PDF' | 'IMAGE' | 'DOCX';
  pageNumber?: number;
  anchorJson: PDFTextAnchor | PDFAreaAnchor | ImageAreaAnchor | DocxTextAnchor;
  colorKey?: string;
  commentText?: string;
  tagsJson?: string[];
}

export interface UpdateHighlightDto {
  colorKey?: string;
  commentText?: string;
  tagsJson?: string[];
}

// UI State
export type ViewMode = 'original' | 'study';
export type SaveStatus = 'saved' | 'saving' | 'offline' | 'error';

export const HIGHLIGHT_COLORS = {
  yellow: { bg: '#fff176', border: '#fdd835', label: 'Yellow' },
  green: { bg: '#aed581', border: '#9ccc65', label: 'Green' },
  blue: { bg: '#64b5f6', border: '#42a5f5', label: 'Blue' },
  red: { bg: '#e57373', border: '#ef5350', label: 'Red' },
  purple: { bg: '#ba68c8', border: '#ab47bc', label: 'Purple' },
} as const;

export type HighlightColor = keyof typeof HIGHLIGHT_COLORS;
