import React from 'react';
import { Comment } from '@/lib/types/sharing';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

interface CommentItemProps {
  comment: Comment;
  onDelete?: (id: string) => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, onDelete }) => {
  const user = useAuthStore((state) => state.user);
  const isAuthor = user?.id === comment.authorId;

  return (
    <div className="flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-xs">
        {comment.authorAvatar ? (
          <img src={comment.authorAvatar} alt={comment.authorName} className="w-full h-full rounded-full object-cover" />
        ) : (
          comment.authorName.charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {comment.authorName}
          </span>
          <span className="text-[10px] text-gray-500 whitespace-nowrap">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ptBR })}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 break-words">
          {comment.body}
        </p>
      </div>
      {isAuthor && onDelete && (
        <button
          onClick={() => onDelete(comment.id)}
          className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
          title="Excluir comentário"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
