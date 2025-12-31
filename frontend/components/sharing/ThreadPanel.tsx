import React from 'react';
import { useThread, useAddComment, useDeleteComment } from '@/hooks/social/use-threads';
import { GetThreadsQuery, CreateCommentDto } from '@/lib/types/sharing';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { Loader2, MessageSquare } from 'lucide-react';

interface ThreadPanelProps {
  query: GetThreadsQuery;
}

export const ThreadPanel: React.FC<ThreadPanelProps> = ({ query }) => {
  const { data: thread, isLoading, isError } = useThread(query);
  const addCommentMutation = useAddComment(thread?.id || '');
  const deleteCommentMutation = useDeleteComment(thread?.id || '');

  const handleAddComment = async (body: string) => {
    if (!thread) return;
    await addCommentMutation.mutateAsync({ body });
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!thread) return;
    if (window.confirm('Tem certeza que deseja excluir este comentário?')) {
      await deleteCommentMutation.mutateAsync(commentId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <p className="text-sm">Carregando conversas...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-center text-red-500 text-sm">
        Falha ao carregar conversas. Por favor, tente novamente.
      </div>
    );
  }

  const comments = thread?.comments || [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 opacity-60">
            <MessageSquare className="w-12 h-12" />
            <p className="text-sm font-medium">Nenhuma conversa ainda</p>
            <p className="text-xs">Seja o primeiro a comentar!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem 
              key={comment.id} 
              comment={comment} 
              onDelete={handleDeleteComment}
            />
          ))
        )}
      </div>

      <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <CommentForm 
          onSubmit={handleAddComment} 
          isLoading={addCommentMutation.isPending}
        />
      </div>
    </div>
  );
};
