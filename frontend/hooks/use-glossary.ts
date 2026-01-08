/**
 * Glossary Hook
 * 
 * Hook for managing glossary state and fetching definitions
 */

import { useState, useCallback } from 'react';
import { GlossaryDefinition } from '@/types/scientific';
import { getGlossaryDefinition } from '@/lib/scientific/glossary-data';

export function useGlossary() {
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [definition, setDefinition] = useState<GlossaryDefinition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDefinition = useCallback(async (term: string) => {
    setIsLoading(true);
    setError(null);
    setSelectedTerm(term);
    
    try {
      const def = await getGlossaryDefinition(term);
      if (def) {
        setDefinition(def);
      } else {
        setError(`Definição não encontrada para "${term}"`);
        setDefinition(null);
      }
    } catch (err) {
      setError('Erro ao buscar definição');
      setDefinition(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const closePopover = useCallback(() => {
    setSelectedTerm(null);
    setDefinition(null);
    setError(null);
  }, []);

  return {
    selectedTerm,
    definition,
    isLoading,
    error,
    fetchDefinition,
    closePopover,
    isOpen: selectedTerm !== null,
  };
}
