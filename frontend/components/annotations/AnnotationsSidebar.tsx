'use client';

import { MessageSquare, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useAnnotations, useDeleteAnnotation, Annotation } from '@/hooks/content/use-annotations';
import { formatDistanceToNow } from 'date-fns';

interface AnnotationsSidebarProps {
  contentId: string;
  groupId?: string | null; // Changed undefined to null for consistency
}

export function AnnotationsSidebar({ contentId, groupId }: AnnotationsSidebarProps) {
  const { data: annotations, isLoading } = useAnnotations(contentId, groupId || undefined);
  const deleteMutation = useDeleteAnnotation(contentId);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');

  if (isLoading) {
    return (
      <div className="w-80 border-l bg-gray-50 p-4">
        <div className="animate-pulse">Loading annotations...</div>
      </div>
    );
  }

  const filteredAnnotations = annotations?.filter(a => 
    filter === 'all' || a.user.id === 'current-user-id' // Replace with actual user ID
  ) || [];

  return (
    <div className="w-80 border-l bg-gray-50 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <h3 className="font-semibold text-lg mb-3">Annotations</h3>
        
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('mine')}
            className={`px-3 py-1 text-sm rounded ${
              filter === 'mine'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Mine
          </button>
        </div>
      </div>

      {/* Annotations List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredAnnotations.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No annotations yet</p>
            <p className="text-sm mt-1">Select text to add highlights or notes</p>
          </div>
        ) : (
          filteredAnnotations.map((annotation) => (
            <AnnotationCard
              key={annotation.id}
              annotation={annotation}
              onDelete={() => deleteMutation.mutate(annotation.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function AnnotationCard({ annotation, onDelete }: { annotation: Annotation; onDelete: () => void }) {
  const colorMap: Record<string, string> = {
    yellow: 'bg-yellow-100 border-yellow-300',
    green: 'bg-green-100 border-green-300',
    blue: 'bg-blue-100 border-blue-300',
    pink: 'bg-pink-100 border-pink-300',
  };

  const bgColor = annotation.color ? colorMap[annotation.color] : 'bg-white';

  return (
    <div className={`p-3 rounded-lg border ${bgColor}`} data-testid="annotation">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="text-xs text-gray-600 mb-1">
            {annotation.user.name} · {formatDistanceToNow(new Date(annotation.createdAt), { addSuffix: true })}
          </div>
          
          {annotation.type === 'HIGHLIGHT' && (
            <div className="inline-block px-2 py-0.5 bg-white rounded text-xs font-medium mb-1">
              Highlight
            </div>
          )}
        </div>

        <button
          onClick={onDelete}
          className="p-1 hover:bg-white/50 rounded transition-colors"
          title="Delete annotation"
          data-testid="delete-annotation"
        >
          <Trash2 className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>

      {annotation.selectedText && (
        <div className="text-sm bg-white/70 p-2 rounded mb-2 italic">
          "{annotation.selectedText}"
        </div>
      )}

      {annotation.text && (
        <p className="text-sm text-gray-800">{annotation.text}</p>
      )}

      {/* Replies */}
      {annotation.replies && annotation.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {annotation.replies.map((reply) => (
            <div key={reply.id} className="ml-3 pl-3 border-l-2 border-gray-300 py-1">
              <div className="text-xs text-gray-600 mb-0.5">{reply.user.name}</div>
              <p className="text-sm">{reply.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
