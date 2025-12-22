'use client';

import { Message } from '@/types/session';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatBubbleProps {
  message: Message;
}

/**
 * ChatBubble - Individual message display
 * Different styles for user vs agent messages
 */
export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`chat-bubble-container chat-bubble-${message.role}`}>
      <div className={`chat-bubble ${message.status ? `status-${message.status}` : ''}`}>
        <div className="bubble-content">
          {message.text}
        </div>
        
        <div className="bubble-meta">
          <time className="bubble-timestamp">
            {formatDistanceToNow(message.timestamp, {
              addSuffix: true,
              locale: ptBR,
            })}
          </time>
          
          {message.status && (
            <span className="bubble-status">
              {message.status === 'sending' && '⏳'}
              {message.status === 'sent' && '✓'}
              {message.status === 'error' && '⚠️'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
