/**
 * Transfer Metadata Extraction Types
 * 
 * Defines the contract for metadata extraction results including
 * execution metrics (cache hits, LLM usage) and provider telemetry.
 */

export type ExtractMetadataResult = {
  metadata: {
    concept: any;       // Concept JSON structure
    tier2: any[];       // List of Tier 2 vocabulary items
    analogies?: any[];  // Analogy items (can be empty)
    domains?: any[];    // Domain items (can be empty)
  };
  usedLLMCount: number;
  cacheHitCount: number;
  channel: 'DETERMINISTIC' | 'CACHED_LLM' | 'LLM';
  providerUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    costUsd?: number;
    model?: string;
  };
};
