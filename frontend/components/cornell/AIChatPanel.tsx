import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User, AlertCircle } from 'lucide-react';
import { CHAT_LABELS } from '@/lib/cornell/labels';
import { URLS } from '@/lib/config/urls';
import { SentenceAnalysisView } from '@/components/ai/SentenceAnalysisView';



export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  quickReplies?: string[]; // Quick action buttons from AI
  structuredOutput?: any; // JSON data from tools (e.g., SENTENCE_ANALYSIS)
  toolType?: string; // Tool identifier (e.g., 'SENTENCE_ANALYSIS', 'MORPHOLOGY')
}

interface AIChatPanelProps {
  onSendMessage?: (message: string) => Promise<void>;
  initialInput?: string;
  selection?: string;
  className?: string;
}

export function AIChatPanel({ onSendMessage, initialInput = '', selection = '', className = '' }: AIChatPanelProps) {
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
  }, [messages]);

  // Update input when initialInput changes (e.g. from selection)
  useEffect(() => {
    if (initialInput !== undefined) {
      setInput(initialInput);
    }
  }, [initialInput]);

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
          content: data.content || data.responseText || 'Sem resposta.',
          timestamp: new Date(),
          quickReplies: data.quickReplies || data.quick_replies || [],
          structuredOutput: data.structuredOutput || data.structured_output,
          toolType: data.toolType || data.tool_type,
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

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-800 ${className}`}>
      {/* Header - Optional or Simplified */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          {CHAT_LABELS.TITLE}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className="space-y-2"
          >
            <div className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
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
                className={`max-w-[80%] ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-lg p-3 text-sm'
                    : ''
                }`}
              >
                {/* Conditional Rendering: Structured Output vs Plain Text */}
                {msg.role === 'assistant' && msg.toolType === 'SENTENCE_ANALYSIS' && msg.structuredOutput ? (
                  // Rich visualization for sentence analysis
                  <SentenceAnalysisView data={msg.structuredOutput} />
                ) : (
                  // Default text bubble
                  <div className={msg.role === 'user' ? '' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg p-3 text-sm'}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                )}
                
                <span className={`text-[10px] mt-1 block opacity-70 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Quick Replies - Only for assistant messages */}
            {msg.role === 'assistant' && msg.quickReplies && msg.quickReplies.length > 0 && (
              <div className="flex flex-wrap gap-2 ml-11">
                {msg.quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(reply);
                      // Auto-submit after a brief delay to allow user to see the populated input
                      setTimeout(() => {
                        const form = document.querySelector('form');
                        if (form) form.requestSubmit();
                      }, 100);
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                    disabled={isTyping}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
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
