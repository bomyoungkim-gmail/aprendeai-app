/**
 * Glossary Hook
 * 
 * Following MelhoresPraticas.txt:
 * - Hooks em hooks/ para orquestração
 * - Gerencia React state
 * - Usa API client
 * 
 * G5.3: Manages glossary lookups
 */

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

interface Definition {
  term: string;
  definition: string;
  source: 'PubMed' | 'Wikipedia' | 'Wiktionary';
  examples?: string[];
}

export function useGlossary() {
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });

  // Fetch definition when term is selected
  const { data: definition, isLoading } = useQuery({
    queryKey: ['glossary-definition', selectedTerm],
    queryFn: async (): Promise<Definition> => {
      const response = await api.get('/glossary/definition', {
        params: { term: selectedTerm }
      });
      return response.data;
    },
    enabled: !!selectedTerm
  });

  // Handle term click
  const handleTermClick = useCallback((term: string, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setPopoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setSelectedTerm(term);
  }, []);

  // Close popover
  const closePopover = useCallback(() => {
    setSelectedTerm(null);
  }, []);

  return {
    selectedTerm,
    definition,
    isLoading,
    popoverPosition,
    handleTermClick,
    closePopover
  };
}
