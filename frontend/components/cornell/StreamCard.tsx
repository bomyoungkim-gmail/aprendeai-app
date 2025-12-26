import React, { useState } from 'react';
import { Highlighter, FileText, Sparkles, Trash2, Edit2, MapPin } from 'lucide-react';
import type { UnifiedStreamItem, AnnotationStreamItem, NoteStreamItem, AISuggestionStreamItem } from '@/lib/types/unified-stream';
import { HIGHLIGHT_COLORS } from '@/lib/types/cornell';
import { AnnotationEditor, NoteEditor } from './InlineEditor';
import { ITEM_TYPE_LABELS, ITEM_TYPE_ICONS } from '@/lib/cornell/labels';
import type { QuestionStreamItem, StarStreamItem, AIResponseStreamItem } from '@/lib/types/unified-stream';

interface StreamCardProps {
  item: UnifiedStreamItem;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSaveEdit?: (item: UnifiedStreamItem, updates: any) => void;
}

export function StreamCard({ item, onClick, onEdit, onDelete, onSaveEdit }: StreamCardProps) {
  if (item.type === 'annotation') {
    return <AnnotationCard item={item} onClick={onClick} onEdit={onEdit} onDelete={onDelete} onSaveEdit={onSaveEdit} />;
  }
  
  if (item.type === 'note') {
    return <NoteCard item={item} onClick={onClick} onEdit={onEdit} onDelete={onDelete} onSaveEdit={onSaveEdit} />;
  }
  
  if (item.type === 'ai-suggestion') {
    return <AISuggestionCard item={item} onClick={onClick} onDelete={onDelete} />;
  }
  
  if (item.type === 'question') {
    return <QuestionCard item={item} onClick={onClick} onDelete={onDelete} />;
  }
  
  if (item.type === 'star') {
    return <StarCard item={item} onClick={onClick} onDelete={onDelete} />;
  }
  
  if (item.type === 'ai-response') {
    return <AIResponseCard item={item} onClick={onClick} onDelete={onDelete} />;
  }
  
  return null;
}

function AnnotationCard({ item, onClick, onEdit, onDelete, onSaveEdit }: { 
  item: AnnotationStreamItem; 
  onClick?: () => void; 
  onEdit?: () => void; 
  onDelete?: () => void;
  onSaveEdit?: (item: UnifiedStreamItem, updates: any) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const color = HIGHLIGHT_COLORS[item.colorKey as keyof typeof HIGHLIGHT_COLORS] || HIGHLIGHT_COLORS.yellow;
  
  const handleSaveEdit = (comment: string, colorKey: string) => {
    onSaveEdit?.(item, { commentText: comment, colorKey });
    setIsEditing(false);
  };
  
  if (isEditing) {
    return (
      <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <AnnotationEditor
          initialComment={item.commentText || ''}
          initialColor={item.colorKey}
          onSave={handleSaveEdit}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }
  
  return (
    <div 
      className="group relative p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Highlighter 
            className="h-4 w-4 shrink-0" 
            style={{ color: color.border }}
          />
          {item.pageNumber && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <MapPin className="h-3 w-3" />
              Pg. {item.pageNumber}
            </span>
          )}
        </div>
        
        {/* Actions (visible on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Edit"
          >
            <Edit2 className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      {item.quote && (
        <p 
          className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 px-2 py-1 rounded"
          style={{ backgroundColor: color.bg + '20' }}
        >
          "{item.quote}"
        </p>
      )}
      
      {item.commentText && (
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 italic">
          {item.commentText}
        </p>
      )}
      
      {/* Timestamp */}
      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
        {new Date(item.createdAt).toLocaleDateString('pt-BR', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </p>
    </div>
  );
}

function NoteCard({ item, onClick, onEdit, onDelete, onSaveEdit }: { 
  item: NoteStreamItem; 
  onClick?: () => void; 
  onEdit?: () => void; 
  onDelete?: () => void;
  onSaveEdit?: (item: UnifiedStreamItem, updates: any) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  
  const handleSaveEdit = (body: string) => {
    onSaveEdit?.(item, { body });
    setIsEditing(false);
  };
  
  if (isEditing) {
    return (
      <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <NoteEditor
          initialBody={item.body}
          onSave={handleSaveEdit}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }
  return (
    <div 
      className="group relative p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{ITEM_TYPE_LABELS.NOTE}</span>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Edit note"
          >
            <Edit2 className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
        {item.body}
      </p>
      
      {/* Timestamp */}
      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
        {new Date(item.createdAt).toLocaleDateString('pt-BR', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </p>
    </div>
  );
}

function AISuggestionCard({ item, onClick, onDelete }: { item: AISuggestionStreamItem; onClick?: () => void; onDelete?: () => void }) {
  return (
    <div 
      className="group relative p-3 rounded-lg border-2 border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
            IA Sugestão
          </span>
        </div>
        
        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="p-1 rounded hover:bg-purple-100 dark:hover:bg-purple-800/40 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Dismiss"
        >
          <Trash2 className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
        {item.content}
      </p>
      
      {!item.accepted && (
        <div className="mt-3 flex gap-2">
          <button className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded transition">
            Aceitar
          </button>
          <button className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition">
            Descartar
          </button>
        </div>
      )}
    </div>
  );
}

function QuestionCard({ item, onClick, onDelete }: { item: QuestionStreamItem; onClick?: () => void; onDelete?: () => void }) {
  const { Star, HelpCircle, CheckCircle } = require('lucide-react');
  
  return (
    <div 
      className={`group relative p-3 rounded-lg border-2 ${
        item.resolved 
          ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/10'
          : 'border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'
      } hover:shadow-md transition-all cursor-pointer`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <HelpCircle className={`h-4 w-4 shrink-0 ${
            item.resolved ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
          }`} />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {ITEM_TYPE_LABELS.QUESTION}
          </span>
          {item.section && (
            <span className="text-xs text-gray-500 dark:text-gray-400">• {item.section}</span>
          )}
        </div>
        
        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-800/40 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete question"
        >
          <Trash2 className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
        {item.question}
      </p>
      
      {item.resolved && item.aiResponseId && (
        <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
          <CheckCircle className="h-3.5 w-3.5" />
          <span>{ITEM_TYPE_LABELS.AI_RESPONSE} respondeu</span>
        </div>
      )}
      
      {/* Timestamp */}
      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
        {new Date(item.createdAt).toLocaleDateString('pt-BR', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </p>
    </div>
  );
}

function StarCard({ item, onClick, onDelete }: { item: StarStreamItem; onClick?: () => void; onDelete?: () => void }) {
  const { Star, MapPin } = require('lucide-react');
  
  return (
    <div 
      className="group relative p-3 rounded-lg border-2 border-yellow-300 dark:border-yellow-600 bg-yellow-50/50 dark:bg-yellow-900/10 hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400 fill-yellow-600 dark:fill-yellow-400" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {ITEM_TYPE_LABELS.STAR}
          </span>
          {item.pageNumber && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <MapPin className="h-3 w-3" />
              Pg. {item.pageNumber}
            </span>
          )}
        </div>
        
        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="p-1 rounded hover:bg-yellow-100 dark:hover:bg-yellow-800/40 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Unstar"
        >
          <Trash2 className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 px-2 py-1 rounded bg-yellow-100/50 dark:bg-yellow-900/20">
        "{item.quote}"
      </p>
      
      {item.note && (
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 italic">
          {item.note}
        </p>
      )}
      
      {/* Timestamp */}
      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
        {new Date(item.createdAt).toLocaleDateString('pt-BR', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </p>
    </div>
  );
}

function AIResponseCard({ item, onClick, onDelete }: { item: AIResponseStreamItem; onClick?: () => void; onDelete?: () => void }) {
  const { MessageSquare, ThumbsUp, ThumbsDown } = require('lucide-react');
  
  return (
    <div 
      className="group relative p-3 rounded-lg border-2 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10 hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
            {ITEM_TYPE_LABELS.AI_RESPONSE}
          </span>
        </div>
        
        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800/40 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
        {item.response}
      </p>
      
      {/* Feedback */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-gray-600 dark:text-gray-400">Útil?</span>
        <button 
          className={`p-1 rounded transition ${
            item.helpful === true ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'
          }`}
          title="Helpful"
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </button>
        <button 
          className={`p-1 rounded transition ${
            item.helpful === false ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'
          }`}
          title="Not helpful"
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </button>
      </div>
      
      {/* Timestamp */}
      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
        {new Date(item.createdAt).toLocaleDateString('pt-BR', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </p>
    </div>
  );
}

