'use client';

import { useState, useEffect, useRef } from 'react';
import { GroupRound } from '@/lib/types/study-groups';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useChatHistory, useSendChatMessage } from '@/hooks/social/use-chat';
import { useAuthStore } from '@/stores/auth-store';
import { ChatMessage } from './ChatMessage';
import { Send, MessageSquare } from 'lucide-react';

interface ChatPanelProps {
  sessionId: string;
  currentRound: GroupRound;
}

export function ChatPanel({ sessionId, currentRound }: ChatPanelProps) {
  const { user } = useAuthStore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket } = useWebSocket();
  
  // Fetch chat history
  const { data: history, isLoading } = useChatHistory(sessionId, currentRound.roundIndex);
  const sendMessage = useSendChatMessage(sessionId);

  // Initialize messages from history
  useEffect(() => {
    if (history) {
      setMessages(history);
    }
  }, [history]);

  // Subscribe to real-time chat messages
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (data: any) => {
      // Only add if from same session and round
      if (data.sessionId === sessionId && data.roundId === currentRound.id) {
        setMessages(prev => [...prev, data]);
      }
    };

    socket.on('chat.message', handleChatMessage);
    return () => {
      socket.off('chat.message', handleChatMessage);
    };
  }, [socket, sessionId, currentRound.id]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sendMessage.isPending) return;

    try {
      await sendMessage.mutateAsync({
        roundIndex: currentRound.roundIndex,
        message: input.trim(),
      });
      setInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[500px] bg-white rounded-lg shadow border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-sm">Chat da Discussão</h3>
            <p className="text-xs text-gray-600">Round {currentRound.roundIndex}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && (
          <div className="text-center text-gray-500 text-sm">
            Carregando mensagens...
          </div>
        )}
        
        {!isLoading && messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            Nenhuma mensagem ainda. Seja o primeiro a comentar!
          </div>
        )}
        
        {messages.map((msg) => (
          <ChatMessage 
            key={msg.id} 
            message={msg} 
            currentUserId={user?.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem... (Enter para enviar)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            rows={2}
            maxLength={500}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 min-h-[44px]"
            title="Enviar mensagem (Enter)"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </div>
        <div className="flex justify-between items-center mt-2">
          <div className="text-xs text-gray-500">
            {input.length}/500
          </div>
          <div className="text-xs text-gray-500">
            Shift+Enter para nova linha
          </div>
        </div>
      </div>
    </div>
  );
}
