import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Lightbulb, Link2, Sparkles } from 'lucide-react';

interface SubClause {
  text: string;
  function: string;
  connector: string;
}

interface RewriteLayered {
  L1?: string;
  L2?: string;
  L3?: string;
}

interface SentenceAnalysisData {
  main_clause: string;
  main_idea: string;
  subordinate_clauses?: SubClause[];
  connectors?: string[];
  simplification: string;
  rewrite_layered?: RewriteLayered;
  confidence?: number;
}

// SCRIPT 07: Grammar payload structure (spec format)
interface GrammarClause {
  type: 'MAIN' | 'SUBORDINATE';
  text: string;
  label?: string;
  function?: string;
  connector?: string;
}

interface GrammarPayload {
  clauses?: GrammarClause[];
  main_idea?: string;
  compressed_summary?: string;
  connectors?: string[];
}

interface SentenceAnalysisViewProps {
  data: unknown; // Accept any structure, normalize internally
}

/**
 * SCRIPT 07: Normalize payload to support both formats
 * - SCRIPT 07 spec: { grammar: { clauses, main_idea, compressed_summary } }
 * - Current backend: { main_clause, main_idea, subordinate_clauses, simplification }
 * 
 * Follows incremental evolution principle: supports both without breaking existing code
 */
function normalizePayload(input: unknown): SentenceAnalysisData {
  // Case 1: SCRIPT 07 spec format (grammar wrapper)
  if (typeof input === 'object' && input !== null && 'grammar' in input) {
    const grammar = (input as { grammar: GrammarPayload; confidence?: number }).grammar;
    const mainClause = grammar.clauses?.find((c) => c.type === 'MAIN');
    const subClauses = grammar.clauses?.filter((c) => c.type !== 'MAIN') || [];
    
    return {
      main_clause: mainClause?.text || grammar.main_idea || '',
      main_idea: grammar.main_idea || '',
      subordinate_clauses: subClauses.map((c) => ({
        text: c.text || '',
        function: c.label || c.function || 'SUBORDINATE',
        connector: c.connector || ''
      })),
      simplification: grammar.compressed_summary || '',
      connectors: grammar.connectors || [],
      confidence: (input as { confidence?: number }).confidence
    };
  }
  
  // Case 2: Current backend format (SCRIPT 11/04) - passthrough
  if (typeof input === 'object' && input !== null && ('main_clause' in input || 'sentences' in input)) {
    const typedInput = input as Partial<SentenceAnalysisData> & { main_proposition?: string; summary_1line?: string };
    return {
      main_clause: typedInput.main_clause || typedInput.main_proposition || '',
      main_idea: typedInput.main_idea || typedInput.main_proposition || '',
      subordinate_clauses: typedInput.subordinate_clauses || [],
      simplification: typedInput.simplification || typedInput.summary_1line || '',
      connectors: typedInput.connectors || [],
      rewrite_layered: typedInput.rewrite_layered,
      confidence: typedInput.confidence
    };
  }
  
  // Case 3: Already normalized or unknown format - passthrough
  return input as SentenceAnalysisData;
}

export function SentenceAnalysisView({ data }: SentenceAnalysisViewProps) {
  const [showLayers, setShowLayers] = useState(false);
  const [showConnectors, setShowConnectors] = useState(false);

  // SCRIPT 07: Normalize payload to support both formats
  const normalized = normalizePayload(data);

  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-purple-200 dark:border-purple-700">
        <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        <h3 className="font-semibold text-purple-900 dark:text-purple-100">Análise Sintática</h3>
        {normalized.confidence && (
          <span className="ml-auto text-xs text-purple-600 dark:text-purple-400">
            Confiança: {Math.round(normalized.confidence * 100)}%
          </span>
        )}
      </div>

      {/* Main Clause - Highlighted */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 border-purple-500">
        <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
          NÚCLEO (Oração Principal)
        </div>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {normalized.main_clause}
        </div>
      </div>

      {/* Main Idea */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border-l-4 border-blue-500">
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            IDEIA CENTRAL
          </div>
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {normalized.main_idea}
        </div>
      </div>

      {/* Subordinate Clauses */}
      {normalized.subordinate_clauses && normalized.subordinate_clauses.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
            Estrutura de Apoio ({normalized.subordinate_clauses.length})
          </div>
          {normalized.subordinate_clauses.map((clause, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-gray-800 rounded-lg p-3 border-l-2 border-gray-300 dark:border-gray-600"
            >
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                  {idx + 1}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                      {clause.function}
                    </span>
                    {clause.connector && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Link2 className="h-3 w-3" />
                        {clause.connector}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 italic">
                    &ldquo;{clause.text}&rdquo;
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connectors - Collapsible */}
      {normalized.connectors && normalized.connectors.length > 0 && (
        <div>
          <button
            onClick={() => setShowConnectors(!showConnectors)}
            className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            {showConnectors ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Conectivos Identificados ({normalized.connectors.length})
          </button>
          {showConnectors && (
            <div className="mt-2 flex flex-wrap gap-2">
              {normalized.connectors.map((connector, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600"
                >
                  {connector}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Simplification */}
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border-l-4 border-green-500">
        <div className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
          REESCRITA SIMPLES
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {normalized.simplification}
        </div>
      </div>

      {/* Layered Rewrites - Collapsible */}
      {normalized.rewrite_layered && (normalized.rewrite_layered.L1 || normalized.rewrite_layered.L2 || normalized.rewrite_layered.L3) && (
        <div>
          <button
            onClick={() => setShowLayers(!showLayers)}
            className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            {showLayers ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Versões por Nível
          </button>
          {showLayers && (
            <div className="mt-2 space-y-2">
              {normalized.rewrite_layered.L1 && (
                <div className="text-sm">
                  <span className="font-semibold text-gray-600 dark:text-gray-400">L1 (Básico):</span>{' '}
                  <span className="text-gray-700 dark:text-gray-300">{normalized.rewrite_layered.L1}</span>
                </div>
              )}
              {normalized.rewrite_layered.L2 && (
                <div className="text-sm">
                  <span className="font-semibold text-gray-600 dark:text-gray-400">L2 (Intermediário):</span>{' '}
                  <span className="text-gray-700 dark:text-gray-300">{normalized.rewrite_layered.L2}</span>
                </div>
              )}
              {normalized.rewrite_layered.L3 && (
                <div className="text-sm">
                  <span className="font-semibold text-gray-600 dark:text-gray-400">L3 (Avançado):</span>{' '}
                  <span className="text-gray-700 dark:text-gray-300">{normalized.rewrite_layered.L3}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
