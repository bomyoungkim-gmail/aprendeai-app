import React, { useEffect, useState } from 'react';
import { BookOpen, Highlighter, MessageSquare, HelpCircle, Sparkles } from 'lucide-react';
import { ACTION_LABELS, KEYBOARD_SHORTCUTS } from '@/lib/cornell/labels';
import { isInputLike } from '@/lib/utils/dom';

import type { SelectionAction } from './TextSelectionMenu';

interface ActionToolbarProps {
  onTriageClick: () => void;
  onHighlightClick: () => void;
  onNoteClick: () => void;
  onQuestionClick: () => void;
  onAIClick: () => void;
  hasUnseenSuggestions?: boolean;
  activeAction?: SelectionAction | null;
}

export function ActionToolbar({
  onTriageClick,
  onHighlightClick,
  onNoteClick,
  onQuestionClick,
  onAIClick,
  hasUnseenSuggestions = false,
  activeAction = null,
}: ActionToolbarProps) {
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Track if user is typing in an input/textarea
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      setIsInputFocused(isInputLike(e.target));
    };

    const handleBlur = () => setIsInputFocused(false);

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isInputFocused) return;

      if (e.key === KEYBOARD_SHORTCUTS.HIGHLIGHT) {
        e.preventDefault();
        onHighlightClick();
      } else if (e.key === KEYBOARD_SHORTCUTS.NOTE) {
        e.preventDefault();
        onNoteClick();
      } else if (e.key === KEYBOARD_SHORTCUTS.QUESTION) {
        e.preventDefault();
        onQuestionClick();
      } else if (e.key === KEYBOARD_SHORTCUTS.AI) {
        e.preventDefault();
        onAIClick();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isInputFocused, onHighlightClick, onNoteClick, onQuestionClick, onAIClick]);

  const buttonClass = (isActive: boolean) =>
    `relative inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
      isActive
        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-2 border-blue-500'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border-2 border-transparent'
    }`;

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {/* Triagem Button */}
      <button
        onClick={onTriageClick}
        className={buttonClass(false)}
        title={`${ACTION_LABELS.TRIAGE} - Ver vocabulário do texto`}
        aria-label={ACTION_LABELS.TRIAGE}
      >
        <BookOpen className="h-4 w-4" />
        <span className="hidden sm:inline">{ACTION_LABELS.TRIAGE}</span>
      </button>

      {/* Highlight Button */}
      <button
        onClick={onHighlightClick}
        className={buttonClass(activeAction === 'annotation')}
        title={`${ACTION_LABELS.HIGHLIGHT} (${KEYBOARD_SHORTCUTS.HIGHLIGHT.toUpperCase()})`}
        aria-label={ACTION_LABELS.HIGHLIGHT}
      >
        <Highlighter className="h-4 w-4" />
        <span className="hidden sm:inline">{ACTION_LABELS.HIGHLIGHT}</span>
      </button>

      {/* Note Button */}
      <button
        onClick={onNoteClick}
        className={buttonClass(activeAction === 'note')}
        title={`${ACTION_LABELS.NOTE} (${KEYBOARD_SHORTCUTS.NOTE.toUpperCase()})`}
        aria-label={ACTION_LABELS.NOTE}
      >
        <MessageSquare className="h-4 w-4" />
        <span className="hidden sm:inline">{ACTION_LABELS.NOTE}</span>
      </button>

      {/* Question Button */}
      <button
        onClick={onQuestionClick}
        className={buttonClass(activeAction === 'question')}
        title={`${ACTION_LABELS.QUESTION} (${KEYBOARD_SHORTCUTS.QUESTION.toUpperCase()})`}
        aria-label={ACTION_LABELS.QUESTION}
      >
        <HelpCircle className="h-4 w-4" />
        <span className="hidden sm:inline">{ACTION_LABELS.QUESTION}</span>
      </button>

      {/* AI Button with Badge */}
      <button
        onClick={onAIClick}
        className={`${buttonClass(activeAction === 'ai')} relative`}
        title={`${ACTION_LABELS.AI} (${KEYBOARD_SHORTCUTS.AI})`}
        aria-label={ACTION_LABELS.AI}
      >
        <Sparkles className="h-4 w-4" />
        <span className="hidden sm:inline">{ACTION_LABELS.AI}</span>
        
        {/* Badge for unseen suggestions */}
        {hasUnseenSuggestions && (
          <span 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-purple-600 dark:bg-purple-500 animate-pulse"
            aria-label="Novas sugestões disponíveis"
          >
            <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
              !
            </span>
          </span>
        )}
      </button>
    </div>
  );
}
