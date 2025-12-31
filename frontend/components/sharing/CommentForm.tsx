import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface CommentFormProps {
  onSubmit: (body: string) => Promise<void>;
  isLoading?: boolean;
}

export const CommentForm: React.FC<CommentFormProps> = ({ onSubmit, isLoading }) => {
  const [body, setBody] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || isLoading) return;

    try {
      await onSubmit(body);
      setBody('');
    } catch (error) {
      console.error('Failed to submit comment:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="relative">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Escreva um comentário..."
          className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none min-h-[80px]"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!body.trim() || isLoading}
          className="absolute bottom-2 right-2 p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </form>
  );
};
