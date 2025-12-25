import React, { useState } from 'react';
import { Sparkles, Lightbulb, BookOpen, X } from 'lucide-react';

interface AIAssistMenuProps {
  onClose: () => void;
  onExplain?: () => void;
  onSummarize?: () => void;
  onGenerateCues?: () => void;
  selectedText?: string;
}

export function AIAssistMenu({
  onClose,
  onExplain,
  onSummarize,
  onGenerateCues,
  selectedText,
}: AIAssistMenuProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              IA Assistente
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Como posso ajudar?
            </p>
          </div>
        </div>

        {/* Selected Text Preview */}
        {selectedText && (
          <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-xs text-purple-800 dark:text-purple-300 line-clamp-3">
              "{selectedText}"
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {selectedText && onExplain && (
            <button
              onClick={() => {
                onExplain();
                onClose();
              }}
              className="w-full flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
            >
              <Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Explicar Seleção
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Obtenha uma explicação simplificada do texto selecionado
                </p>
              </div>
            </button>
          )}

          {onSummarize && (
            <button
              onClick={() => {
                onSummarize();
                onClose();
              }}
              className="w-full flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
            >
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Resumir Página
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Gere um resumo conciso da página atual
                </p>
              </div>
            </button>
          )}

          {onGenerateCues && (
            <button
              onClick={() => {
                onGenerateCues();
                onClose();
              }}
              className="w-full flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
            >
              <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Gerar Tópicos
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Crie perguntas e tópicos de estudo desta página
                </p>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
