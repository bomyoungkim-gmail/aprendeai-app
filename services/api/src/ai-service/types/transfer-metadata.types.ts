/**
 * Transfer Metadata Extraction - AI Service Types
 * 
 * Types for LLM fallback when deterministic extraction yields empty results.
 */

export interface TransferMetadataPrompt {
  contentId: string;
  sectionRef: {
    chunkId?: string;
    page?: number;
    timestamp?: number;
    chunkIndex?: number;
  };
  mode: string;
  learner: {
    level: string;
    language: string;
  };
  seed: {
    concept: any; // concept_json from deterministic extraction
    tier2: any; // tier2_json from deterministic extraction
    evidence: Array<{
      anchor_json: any;
      note_excerpt: string;
    }>; // Up to 2 Cornell notes with MAIN_IDEA/EVIDENCE tags
  };
  output: {
    need: Array<'analogies' | 'domains'>;
    maxItems: {
      analogies: number;
      domains: number;
    };
  };
  caps: {
    maxTokens: number;
    modelTier: string;
  };
}

export interface MetadataResponse {
  analogies: Array<{
    source_domain: string;
    target_domain: string;
    mapping: string;
  }>;
  domains: string[];
  tokensUsed?: number;
  model?: string;
}
