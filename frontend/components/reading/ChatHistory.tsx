'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/types/session';
import { ChatBubble } from './ChatBubble';
import { TypingIndicator } from './TypingIndicator';
import './typing-indicator.css';

interface ChatHistoryProps {
  messages: Message[];
  isLoading?: boolean;
}

/**
 * ChatHistory - Scrollable message list
 * Auto-scrolls to bottom on new messages
 */
export function ChatHistory({ messages, isLoading }: ChatHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="chat-history chat-history-empty">
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <p className="empty-title">Comece a conversa</p>
          <p className="empty-description">
            O educador AI está pronto para ajudar você nesta leitura.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="chat-history">
      <div className="chat-history-content">
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
        
        {isLoading && <TypingIndicator />}
        
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
