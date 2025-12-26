import React, { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { HIGHLIGHT_COLORS, getDefaultPalette, type ColorKey } from '@/lib/constants/colors';

interface AnnotationEditorProps {
  initialComment?: string;
  initialColor: string;
  onSave: (comment: string, color: string) => void;
  onCancel: () => void;
}

export function AnnotationEditor({
  initialComment = '',
  initialColor,
  onSave,
  onCancel,
}: AnnotationEditorProps) {
  const [comment, setComment] = useState(initialComment);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Focus textarea on mount
    textareaRef.current?.focus();
  }, []);

  const handleSave = () => {
    onSave(comment.trim(), selectedColor);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  return (
    <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600">
      {/* Color Picker */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Cor:
        </span>
        <div className="flex gap-1.5">
          {getDefaultPalette().map((key) => {
            const color = HIGHLIGHT_COLORS[key];
            return (
              <button
                key={key}
                onClick={() => setSelectedColor(key)}
                className={`
                  w-6 h-6 rounded-full border-2 transition-all
                  ${selectedColor === key ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}
                `}
                style={{ backgroundColor: color.rgb }}
                title={color.name}
              />
            );
          })}
        </div>
      </div>

      {/* Comment Input */}
      <textarea
        ref={textareaRef}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Adicionar comentário... (Ctrl+Enter para salvar)"
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={3}
      />

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <X className="h-4 w-4" />
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
        >
          <Check className="h-4 w-4" />
          Salvar
        </button>
      </div>
    </div>
  );
}

interface NoteEditorProps {
  initialBody: string;
  onSave: (body: string) => void;
  onCancel: () => void;
}

export function NoteEditor({ initialBody, onSave, onCancel }: NoteEditorProps) {
  const [body, setBody] = useState(initialBody);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, []);

  const handleSave = () => {
    if (body.trim()) {
      onSave(body.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  return (
    <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600">
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          // Auto-resize
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
        }}
        onKeyDown={handleKeyDown}
        placeholder="Escreva sua nota... (Ctrl+Enter para salvar)"
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={4}
      />

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <X className="h-4 w-4" />
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={!body.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
        >
          <Check className="h-4 w-4" />
          Salvar
        </button>
      </div>
    </div>
  );
}
