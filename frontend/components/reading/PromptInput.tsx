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
      if (!isLoading && value.trim()) {
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
          className="prompt-input"
          rows={1}
          aria-label="Campo de mensagem"
        />
        
        <button
          onClick={onSend}
          disabled={isLoading || !value.trim()}
          className="prompt-send-button"
          aria-label="Enviar mensagem"
        >
          {isLoading ? (
            <span className="loading-spinner">⏳</span>
          ) : (
            <span className="send-icon">➤</span>
          )}
        </button>
      </div>
      
      <div className="prompt-input-hint">
        <kbd>Enter</kbd> para enviar • <kbd>Shift + Enter</kbd> para quebra de linha
      </div>
    </div>
  );
}
