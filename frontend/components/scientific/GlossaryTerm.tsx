"use client";

/**
 * Glossary Term Component
 * 
 * Wraps scientific terms to make them clickable and show glossary definitions
 */

import React from 'react';

interface GlossaryTermProps {
  term: string;
  onClick: (term: string) => void;
  children: React.ReactNode;
}

export function GlossaryTerm({ term, onClick, children }: GlossaryTermProps) {
  return (
    <span
      onClick={() => onClick(term)}
      data-testid={`glossary-term-${term}`}
      data-term={term}
      className="cursor-pointer underline decoration-dotted decoration-blue-500 hover:decoration-solid hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors rounded px-0.5"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(term);
        }
      }}
    >
      {children}
    </span>
  );
}
