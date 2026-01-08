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

interface SentenceAnalysisViewProps {
  data: SentenceAnalysisData;
}

export function SentenceAnalysisView({ data }: SentenceAnalysisViewProps) {
  const [showLayers, setShowLayers] = useState(false);
  const [showConnectors, setShowConnectors] = useState(false);

  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-purple-200 dark:border-purple-700">
        <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        <h3 className="font-semibold text-purple-900 dark:text-purple-100">Análise Sintática</h3>
        {data.confidence && (
          <span className="ml-auto text-xs text-purple-600 dark:text-purple-400">
            Confiança: {Math.round(data.confidence * 100)}%
          </span>
        )}
      </div>

      {/* Main Clause - Highlighted */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 border-purple-500">
        <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
          NÚCLEO (Oração Principal)
        </div>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {data.main_clause}
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
          {data.main_idea}
        </div>
      </div>

      {/* Subordinate Clauses */}
      {data.subordinate_clauses && data.subordinate_clauses.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
            Estrutura de Apoio ({data.subordinate_clauses.length})
          </div>
          {data.subordinate_clauses.map((clause, idx) => (
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
                    "{clause.text}"
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connectors - Collapsible */}
      {data.connectors && data.connectors.length > 0 && (
        <div>
          <button
            onClick={() => setShowConnectors(!showConnectors)}
            className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            {showConnectors ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Conectivos Identificados ({data.connectors.length})
          </button>
          {showConnectors && (
            <div className="mt-2 flex flex-wrap gap-2">
              {data.connectors.map((connector, idx) => (
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
          {data.simplification}
        </div>
      </div>

      {/* Layered Rewrites - Collapsible */}
      {data.rewrite_layered && (data.rewrite_layered.L1 || data.rewrite_layered.L2 || data.rewrite_layered.L3) && (
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
              {data.rewrite_layered.L1 && (
                <div className="text-sm">
                  <span className="font-semibold text-gray-600 dark:text-gray-400">L1 (Básico):</span>{' '}
                  <span className="text-gray-700 dark:text-gray-300">{data.rewrite_layered.L1}</span>
                </div>
              )}
              {data.rewrite_layered.L2 && (
                <div className="text-sm">
                  <span className="font-semibold text-gray-600 dark:text-gray-400">L2 (Intermediário):</span>{' '}
                  <span className="text-gray-700 dark:text-gray-300">{data.rewrite_layered.L2}</span>
                </div>
              )}
              {data.rewrite_layered.L3 && (
                <div className="text-sm">
                  <span className="font-semibold text-gray-600 dark:text-gray-400">L3 (Avançado):</span>{' '}
                  <span className="text-gray-700 dark:text-gray-300">{data.rewrite_layered.L3}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
