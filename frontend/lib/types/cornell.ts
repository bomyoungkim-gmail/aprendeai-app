import { ContentType, TargetType } from '../constants/enums';

// Import from single source of truth
export type { CornellType, CornellExtendedType } from '@/lib/cornell/constants';

export interface Content {
  id: string;
  title: string;
  contentType: ContentType;
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
  text?: string;
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
  type?: string;
  anchor?: SynthesisAnchor;
}

/**
 * Synthesis Category - Types of study/analysis
 */
export type SynthesisCategory = 
  | 'resumo'          // Resumo padrão do trecho
  | 'mapa_argumentos' // Teses, premissas e evidências
  | 'comparacao'      // A vs B, Prós e Contras, Trade-offs
  | 'glossario'       // Termos e definições chave (Vocabulário recorrente)
  | 'linha_tempo'     // Sequência cronológica de eventos
  | 'causa_efeito'    // Mecanismos, gatilhos e consequências
  | 'analogia'        // Analogias e metáforas didáticas
  | 'aplicacao'       // Casos de uso reais e exercícios
  | 'conclusao'       // Principais "takeaways" e lições aprendidas
  | 'lacuna'          // Dúvida aberta, "open loops" ou o que falta pesquisar
  | 'metodo'          // Passo a passo, algoritmos ou procedimentos
  | 'analise_critica'; // Contra-pontos e visão pessoal do estudante

/**
 * Synthesis Anchor - Coexisting dimensions of a synthesis
 */
export interface SynthesisAnchor {
  location?: {
    label: string;
    tocId?: string;
    pageRange?: [number, number];
  };
  temporal?: {
    label: string;
    startMs: number;
    endMs?: number;
  };
  transversal?: {
    category: SynthesisCategory;
    theme?: string;
  };
}

export interface Highlight {
  id: string;
  contentId: string;
  userId: string;
  kind: 'TEXT' | 'AREA';
  targetType: TargetType;
  pageNumber?: number;
  anchorJson: PDFTextAnchor | PDFAreaAnchor | ImageAreaAnchor | DocxTextAnchor;
  timestampMs?: number;
  durationMs?: number;
  colorKey: string;
  tagsJson: string[];
  commentText?: string;
  visibility?: string;
  visibilityScope?: string;
  contextType?: string;
  contextId?: string;
  learnerId?: string;
  status?: 'ACTIVE' | 'DELETED';
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
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
  target_type: TargetType;
  page_number?: number;
  timestamp_ms?: number;
  anchor_json: PDFTextAnchor | PDFAreaAnchor | ImageAreaAnchor | DocxTextAnchor;
  color_key?: string;
  comment_text?: string;
  tags_json?: string[];
  visibility?: string;
  visibility_scope?: string;
  context_type?: string;
  context_id?: string;
}

export interface UpdateHighlightDto {
  color_key?: string;
  comment_text?: string;
  tags_json?: string[];
}

export interface UpdateHighlightPayload {
  color_key?: string;
  comment_text?: string;
  tags_json?: string[];
  visibility?: string;
  visibility_scope?: string;
  context_type?: string;
  context_id?: string;
}

export interface CreateHighlightPayload {
  type: string;
  kind: 'TEXT' | 'AREA';
  target_type: TargetType;
  page_number?: number;
  timestamp_ms?: number;
  anchor_json: PDFTextAnchor | PDFAreaAnchor | ImageAreaAnchor | DocxTextAnchor;
  comment_text?: string;
  visibility?: string;
  visibility_scope?: string;
  context_type?: string;
  context_id?: string;
}

// UI State
export type ViewMode = 'original' | 'study' | 'review';
export type SaveStatus = 'saved' | 'saving' | 'offline' | 'error';

// Re-export color types from centralized location
export type { ColorKey as HighlightColor } from '@/lib/constants/colors';
