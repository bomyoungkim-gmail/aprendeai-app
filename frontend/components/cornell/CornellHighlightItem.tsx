/**
 * Cornell Highlight Item
 * 
 * Individual highlight item with actions and comments.
 */

'use client';

import React, { useState } from 'react';
import { MoreVertical, Trash2, Lock, MessageSquare, Clock } from 'lucide-react';
import { useDeleteHighlight, useCreateComment, type Highlight } from '@/hooks/cornell/use-cornell-highlights';
import { getColorForCornellType, inferCornellType } from '@/lib/cornell/type-color-map';
import { CORNELL_TYPE_LABELS } from '@/lib/constants/enums';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface CornellHighlightItemProps {
  highlight: Highlight;
  contentId: string;
  onSelect?: () => void;
}

export function CornellHighlightItem({
  highlight,
  contentId,
  onSelect,
}: CornellHighlightItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  
  const deleteHighlight = useDeleteHighlight(contentId);
  const createComment = useCreateComment(highlight.id, contentId);

  // Infer Cornell type from tags
  const cornellType = inferCornellType(highlight.tagsJson as string[]);
  const colorInfo = getColorForCornellType(cornellType);

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja deletar esta anotação?')) {
      try {
        await deleteHighlight.mutateAsync(highlight.id);
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await createComment.mutateAsync(commentText);
      setCommentText('');
      setIsCommentOpen(false);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(highlight.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <div
      className={cn(
        'p-4 hover:bg-gray-50 transition-colors cursor-pointer',
        colorInfo.bgColor
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1">
          {/* Type badge */}
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
              colorInfo.textColor,
              'bg-white border',
              colorInfo.borderColor
            )}
          >
            {CORNELL_TYPE_LABELS[cornellType] || cornellType}
          </span>

          {/* Visibility indicator */}
          {highlight.visibility !== 'PRIVATE' && (
            <span className="text-xs text-gray-500">
              {highlight.visibility === 'PUBLIC' ? '🌐' : '👥'}
            </span>
          )}
        </div>

        {/* Actions menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="p-1 hover:bg-white rounded-md transition-colors"
          >
            <MoreVertical className="h-4 w-4 text-gray-400" />
          </button>

          {showActions && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                  setShowActions(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Deletar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {highlight.commentText && (
        <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
          {highlight.commentText}
        </p>
      )}

      {/* Meta info */}
      <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {timeAgo}
        </span>
        {highlight.user && (
          <span>por {highlight.user.name}</span>
        )}
        {highlight.pageNumber && (
          <span>• Página {highlight.pageNumber}</span>
        )}
      </div>

      {/* Comments */}
      {highlight.comments && highlight.comments.length > 0 && (
        <div className="mt-3 space-y-2 pl-3 border-l-2 border-gray-200">
          {highlight.comments.map((comment) => (
            <div key={comment.id} className="text-sm">
              <p className="text-gray-700">{comment.text}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {comment.user.name} • {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add comment */}
      <div className="mt-3">
        {isCommentOpen ? (
          <form onSubmit={handleAddComment} className="space-y-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Adicionar comentário..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!commentText.trim() || createComment.isPending}
                className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {createComment.isPending ? 'Enviando...' : 'Enviar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCommentOpen(false);
                  setCommentText('');
                }}
                className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCommentOpen(true);
            }}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
          >
            <MessageSquare className="h-3 w-3" />
            Adicionar comentário
          </button>
        )}
      </div>
    </div>
  );
}
