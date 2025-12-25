'use client';

import { KeyboardEvent } from 'react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading?: boolean;
  placeholder?: string;
}

/**
 * PromptInput - Text input with send button
 * Supports Enter to send, Shift+Enter for new line
 */
export function PromptInput({
  value,
  onChange,
  onSend,
  isLoading,
  placeholder = 'Digite sua mensagem...',
}: PromptInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value?.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="prompt-input-container">
      <div className="prompt-input-wrapper">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className="w-full min-h-[150px] p-4 border border-gray-300 rounded-lg resize-y text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          aria-label="Campo de mensagem"
          data-testid="prompt-input"
        />
      </div>
      
      <div className="flex items-center justify-between mt-3">
        <div className="text-xs text-gray-500">
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Enter</kbd> para enviar
          {' • '}
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Shift + Enter</kbd> quebra de linha
        </div>
        
        <button
          onClick={onSend}
          disabled={isLoading || !value?.trim()}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors text-sm"
          aria-label="Enviar mensagem"
          data-testid="send-prompt"
        >
          {isLoading ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}
