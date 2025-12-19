'use client';

import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatMessageProps {
  message: {
    id: string;
    userId: string;
    message: string;
    createdAt: Date | string;
    user: {
      id: string;
      name: string;
    };
    userRole: string | null;
  };
  currentUserId?: string;
}

export function ChatMessage({ message, currentUserId }: ChatMessageProps) {
  const isOwnMessage = message.userId === currentUserId;
  
  const getRoleColor = (role: string | null) => {
    if (!role) return 'bg-gray-100 text-gray-800';
    
    const colors: Record<string, string> = {
      FACILITATOR: 'bg-purple-100 text-purple-800',
      TIMEKEEPER: 'bg-blue-100 text-blue-800',
      CLARIFIER: 'bg-green-100 text-green-800',
      CONNECTOR: 'bg-yellow-100 text-yellow-800',
      SCRIBE: 'bg-red-100 text-red-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleIcon = (role: string | null) => {
    const icons: Record<string, string> = {
      FACILITATOR: '🟣',
      TIMEKEEPER: '🔵',
      CLARIFIER: '🟢',
      CONNECTOR: '🟡',
      SCRIBE: '🔴',
    };
    return role ? icons[role] || '⚪' : '⚪';
  };

  const timestamp = typeof message.createdAt === 'string' 
    ? new Date(message.createdAt) 
    : message.createdAt;

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* User info */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{getRoleIcon(message.userRole)}</span>
          <span className="text-xs font-medium text-gray-700">
            {isOwnMessage ? 'Você' : message.user.name}
          </span>
          {message.userRole && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(message.userRole)}`}>
              {message.userRole}
            </span>
          )}
        </div>
        
        {/* Message bubble */}
        <div className={`rounded-lg px-4 py-2 ${
          isOwnMessage 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 text-gray-900'
        }`}>
          <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
        </div>
        
        {/* Timestamp */}
        <span className="text-xs text-gray-500 mt-1">
          {formatDistanceToNow(timestamp, { addSuffix: true, locale: ptBR })}
        </span>
      </div>
    </div>
  );
}
