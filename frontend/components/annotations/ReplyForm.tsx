'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { useCreateReply } from '@/hooks/content/use-annotations';

interface ReplyFormProps {
  annotationId: string;
  onSuccess?: () => void;
}

export function ReplyForm({ annotationId, onSuccess }: ReplyFormProps) {
  const [content, setContent] = useState('');
  const { mutate: createReply, isPending } = useCreateReply();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    createReply(
      { annotationId, content },
      {
        onSuccess: () => {
          setContent('');
          onSuccess?.();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a reply..."
        disabled={isPending}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        data-testid="reply-input"
      />
      <button
        type="submit"
        disabled={isPending || !content.trim()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        data-testid="submit-reply"
      >
        <Send className="h-4 w-4" />
        {isPending ? 'Sending...' : 'Reply'}
      </button>
    </form>
  );
}
