import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User, AlertCircle } from 'lucide-react';
import { CHAT_LABELS } from '@/lib/cornell/labels';
import { URLS } from '@/lib/config/urls';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage?: (message: string) => Promise<void>;

  initialInput?: string;
  selection?: string; // NEW: Context for the AI
}

export function AIChatPanel({ isOpen, onClose, onSendMessage, initialInput = '', selection = '' }: AIChatPanelProps) {
  const [input, setInput] = useState(initialInput);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: CHAT_LABELS.EMPTY_STATE,
      timestamp: new Date(),
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Update input when initialInput changes (e.g. from selection)
  useEffect(() => {
    if (isOpen && initialInput) {
      setInput(initialInput);
    }
  }, [isOpen, initialInput]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      if (onSendMessage) {
        await onSendMessage(userMessage.content);
      } else {
        // Call Real Backend
        const response = await fetch(`${URLS.ai.base}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: 'user-123', // TODO: Get from context
            content_id: 'content-ABC', // TODO: Get from context
            message: userMessage.content,
            context: {
              selection: selection, // Pass actual selection context
            }
          }),
        });

        if (!response.ok) {
          throw new Error('Falha na comunicação com o assistente');
        }

        const data = await response.json();

        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content || 'Sem resposta.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiResponse]);
        setIsTyping(false);
      }
    } catch (error) {
      console.error('Failed to send message', error);
      setIsTyping(false);
      
      // Add error message
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao conectar com o servidor. Tente novamente.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out"
      role="dialog"
      aria-label={CHAT_LABELS.TITLE}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            {CHAT_LABELS.TITLE}
          </h2>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
          aria-label={CHAT_LABELS.CLOSE}
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                  : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
              }`}
            >
              {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            
            <div 
              className={`max-w-[80%] rounded-lg p-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-sm'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <span className={`text-[10px] mt-1 block opacity-70 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form 
        onSubmit={handleSubmit}
        className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={CHAT_LABELS.PLACEHOLDER}
            className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-gray-100"
            disabled={isTyping}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 transition-colors"
            aria-label={CHAT_LABELS.SEND}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
