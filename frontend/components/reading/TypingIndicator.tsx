'use client';

/**
 * TypingIndicator - Shows when AI is thinking/responding
 */
export function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <div className="typing-dots">
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>
      <span className="typing-text">Educador está digitando...</span>
    </div>
  );
}
