import React, { useState, useRef, useEffect } from 'react';
import { Check, X, MapPin, Hash, Clock, Timer } from 'lucide-react';
import { HIGHLIGHT_COLORS, type ColorKey } from '@/lib/constants/colors';
import { CORNELL_CONFIG } from '@/lib/cornell/unified-config';
import { getColorForKey } from '@/lib/constants/colors';
import { getSynthesisStatus, SYNTHESIS_CATEGORY_LABELS } from '@/lib/cornell/synthesis-logic';
import type { SynthesisAnchor, SynthesisCategory } from '@/lib/types/unified-stream';
import type { Section } from '@/lib/content/section-detector';

interface AnnotationEditorProps {
  initialComment?: string;
  initialColor: string;
  initialType?: string;
  onSave: (comment: string, color: string, type?: string) => void;
  onCancel: () => void;
}

export function AnnotationEditor({
  initialComment = '',
  initialColor,
  initialType = 'HIGHLIGHT',
  onSave,
  onCancel,
}: AnnotationEditorProps) {
  const [comment, setComment] = useState(initialComment);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [selectedType, setSelectedType] = useState(initialType.toUpperCase());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSave = () => {
    onSave(comment.trim(), selectedColor, selectedType);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  // Only show the 4 pedagogical pillars in the editor picker
  const categories = [
    CORNELL_CONFIG.NOTE,      // Vocabulário
    CORNELL_CONFIG.IMPORTANT, // Ideia Central
    CORNELL_CONFIG.HIGHLIGHT, // Evidência
    CORNELL_CONFIG.QUESTION,  // Dúvida
  ];

  return (
    <div className="space-y-4 p-3 bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-100 dark:border-gray-800 shadow-lg">
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
          Pilar Pedagógico
        </span>
        <div className="flex gap-2 p-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          {categories.map((config) => {
            const isSelected = selectedType === config.type;
            const Icon = config.icon;
            const rgb = getColorForKey(config.color);
            
            return (
              <button
                key={config.id}
                onClick={() => {
                  setSelectedType(config.type);
                  setSelectedColor(config.color);
                }}
                className={`
                  flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-md transition-all border-2
                  ${isSelected 
                    ? 'bg-white dark:bg-gray-700 shadow-sm' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent'}
                `}
                style={{ 
                  borderColor: isSelected ? rgb : 'transparent' 
                }}
                title={config.label}
              >
                <Icon 
                  className={`h-5 w-5 mb-1 ${isSelected ? 'scale-110' : 'opacity-60 grayscale'}`} 
                  style={{ color: isSelected ? rgb : undefined }}
                />
                <span className={`text-[9px] font-bold truncate w-full text-center ${isSelected ? 'opacity-100' : 'opacity-40'}`}>
                  {config.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1">
        <textarea
          ref={textareaRef}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="O que você aprendeu com este trecho?"
          className="w-full px-3 py-2 text-sm border-2 border-gray-100 dark:border-gray-800 rounded-lg resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-colors"
          rows={3}
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          CANCELAR
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 transition-all active:scale-95"
        >
          <Check className="h-3.5 w-3.5" />
          SALVAR
        </button>
      </div>
    </div>
  );
}

interface NoteEditorProps {
  initialBody: string;
  initialAnchor?: SynthesisAnchor;
  onSave: (body: string, anchor?: SynthesisAnchor) => void;
  onCancel: () => void;
  sections?: Section[];
  defaultLocationLabel?: string;
}

export function NoteEditor({ initialBody, initialAnchor, onSave, onCancel, sections, defaultLocationLabel }: NoteEditorProps) {
  const [body, setBody] = useState(initialBody);
  
  // Metadata State
  const [locationLabel, setLocationLabel] = useState(initialAnchor?.location?.label || '');
  const [transversalCategory, setTransversalCategory] = useState<SynthesisCategory | ''>(
    initialAnchor?.transversal?.category || ''
  );
  const [transversalTheme, setTransversalTheme] = useState(initialAnchor?.transversal?.theme || '');
  const [temporalLabel, setTemporalLabel] = useState(initialAnchor?.temporal?.label || '');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { length, color, canSave } = getSynthesisStatus(body);

  useEffect(() => {
    textareaRef.current?.focus();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, []);

  const handleSetCurrentTime = () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTemporalLabel(timeStr);
  };

  const handleSave = () => {
    if (canSave) {
      const newAnchor: SynthesisAnchor = {};
      let hasAnchor = false;

      const finalLocation = locationLabel.trim() || defaultLocationLabel;
      if (finalLocation) {
        newAnchor.location = { label: finalLocation };
        hasAnchor = true;
      }
      if (transversalCategory) {
        newAnchor.transversal = {
          category: transversalCategory as SynthesisCategory,
          theme: transversalTheme.trim() || undefined
        };
        hasAnchor = true;
      }
      if (temporalLabel.trim()) {
        newAnchor.temporal = {
          label: temporalLabel.trim(),
          startMs: 0 // Placeholder/Default
        };
        hasAnchor = true;
      }

      onSave(body.trim(), hasAnchor ? newAnchor : undefined);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
    else if (e.key === 'Enter' && e.ctrlKey) handleSave();
  };

  return (
    <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600">
      
      {/* 1. Header: Linear & Transversal */}
      <div className="flex flex-wrap gap-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        
        {/* Linear / Struct */}
        <div className="flex-1 min-w-[140px] flex items-center gap-2 px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 focus-within:ring-1 focus-within:ring-blue-400">
          <MapPin className="w-3.5 h-3.5 text-gray-400" />
          <input 
            type="text" 
            list="location-sections"
            value={locationLabel}
            onChange={(e) => setLocationLabel(e.target.value)}
            placeholder={defaultLocationLabel || "Local (Ex: Cap 1.2)"}
            className="flex-1 text-xs bg-transparent border-none focus:outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
          />
          <datalist id="location-sections">
            {sections?.map(s => {
              // Heuristic: Estimate page from line number (approx 40 lines/page)
              const estPage = Math.floor((s.startLine || 0) / 40) + 1;
              const value = `${s.title} (Pág ${estPage})`;
              return <option key={s.id} value={value} />;
            })}
          </datalist>
        </div>

        {/* Transversal */}
        <div className="flex-[2] min-w-[200px] flex items-center gap-2 px-2 py-1 bg-indigo-50/50 dark:bg-indigo-900/10 rounded border border-indigo-100 dark:border-indigo-800 focus-within:border-indigo-300">
          <Hash className="w-3.5 h-3.5 text-indigo-400" />
          <select
            value={transversalCategory}
            onChange={(e) => setTransversalCategory(e.target.value as SynthesisCategory)}
            className="text-xs bg-transparent border-none focus:outline-none text-indigo-700 dark:text-indigo-300 font-medium max-w-[120px]"
          >
            <option value="">Categoria...</option>
            {Object.entries(SYNTHESIS_CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          {transversalCategory && (
            <input 
              type="text"
              value={transversalTheme}
              onChange={(e) => setTransversalTheme(e.target.value)}
              placeholder="Tema..."
              className="flex-1 text-xs bg-transparent border-none focus:outline-none text-indigo-800 dark:text-indigo-200 placeholder-indigo-300/70 border-l border-indigo-200 dark:border-indigo-700/50 pl-2"
            />
          )}
        </div>
      </div>

      {/* 2. Body */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          onKeyDown={handleKeyDown}
          placeholder="Escreva sua síntese... (Mínimo 50 carac.)"
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
        <div className={`absolute bottom-2 right-3 text-[10px] font-mono ${color}`}>
          {length}
        </div>
      </div>

      {/* 3. Footer: Temporal & Actions */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-200 dark:border-gray-700/50 mt-1">
        
        {/* Temporal Input */}
        <div className="flex items-center gap-1 group">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 focus-within:ring-1 focus-within:ring-blue-400">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <input 
              type="text" 
              value={temporalLabel}
              onChange={(e) => setTemporalLabel(e.target.value)}
              placeholder="00:00" 
              className="w-16 text-xs bg-transparent border-none focus:outline-none text-gray-700 dark:text-gray-200 font-mono"
            />
          </div>
          <button 
            type="button"
            onClick={handleSetCurrentTime}
            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
            title="Usar horário atual"
          >
            <Timer className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Cancelar"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="p-2 text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
            title="Salvar"
          >
            <Check className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
