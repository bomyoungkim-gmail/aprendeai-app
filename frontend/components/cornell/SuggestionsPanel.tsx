import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import type { Suggestion } from '@/hooks/cornell/use-content-context';

interface SuggestionsPanelProps {
  suggestions: Suggestion[];
  onAccept: (suggestionId: string) => void;
  onDismiss: (suggestionId: string) => void;
  position?: 'sidebar' | 'corner';
}

export function SuggestionsPanel({
  suggestions,
  onAccept,
  onDismiss,
  position = 'corner',
}: SuggestionsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set());

  if (suggestions.length === 0) {
    return null;
  }

  const handleDismiss = (suggestionId: string) => {
    // Add dismissing animation
    setDismissingIds(prev => new Set(prev).add(suggestionId));
    
    // Wait for animation then actually dismiss
    setTimeout(() => {
      onDismiss(suggestionId);
      setDismissingIds(prev => {
        const next = new Set(prev);
        next.delete(suggestionId);
        return next;
      });
    }, 300);
  };

  const handleAccept = (suggestionId: string) => {
    onAccept(suggestionId);
  };

  // Minimized state (just badge)
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`
          fixed z-50 flex items-center gap-2 px-4 py-3 rounded-full 
          bg-purple-600 hover:bg-purple-700 text-white shadow-lg 
          transition-all hover:scale-105
          ${position === 'corner' ? 'bottom-6 right-6' : 'bottom-4 right-4'}
        `}
        aria-label="Abrir sugestões do Educator"
      >
        <Sparkles className="h-5 w-5" />
        <span className="font-medium">{suggestions.length}</span>
        <ChevronUp className="h-4 w-4" />
      </button>
    );
  }

  // Expanded state (full cards)
  return (
    <div
      className={`
        fixed z-50 max-w-md w-full
        ${position === 'corner' ? 'bottom-6 right-6' : 'bottom-4 right-4'}
      `}
    >
      {/* Header */}
      <div className="bg-purple-600 dark:bg-purple-700 rounded-t-lg px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="h-5 w-5" />
          <span className="font-semibold">Sugestões do Educator</span>
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium">
            {suggestions.length}
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-white hover:bg-white/10 p-1 rounded transition"
          aria-label="Minimizar"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>

      {/* Suggestions List */}
      <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-2xl max-h-[70vh] overflow-y-auto">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={() => handleAccept(suggestion.id)}
              onDismiss={() => handleDismiss(suggestion.id)}
              isDismissing={dismissingIds.has(suggestion.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAccept: () => void;
  onDismiss: () => void;
  isDismissing: boolean;
}

function SuggestionCard({ suggestion, onAccept, onDismiss, isDismissing }: SuggestionCardProps) {
  return (
    <div
      className={`
        p-4 transition-all duration-300
        ${isDismissing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
      `}
    >
      {/* Icon & Title */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">{suggestion.icon}</span>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {suggestion.title}
          </h3>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded transition"
          aria-label="Dispensar sugestão"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        {suggestion.description}
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition"
        >
          {suggestion.actionLabel}
        </button>
        {suggestion.dismissLabel && (
          <button
            onClick={onDismiss}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm transition"
          >
            {suggestion.dismissLabel}
          </button>
        )}
      </div>
    </div>
  );
}
