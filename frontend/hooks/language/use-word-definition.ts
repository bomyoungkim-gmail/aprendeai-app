/**
 * Word Definition Hook for LANGUAGE Mode
 * 
 * Orchestration layer - manages React state and side effects
 * Following MelhoresPraticas.txt: hooks/domain for orchestration
 * 
 * G6.1: Definições instantâneas
 * G6.2: SRS automático com limite
 */

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DefinitionFetcher, Definition } from '@/lib/language/definition-fetcher';
import { SRSManager, MAX_SRS_WORDS_PER_SESSION } from '@/lib/language/srs-manager';
import { useTelemetry } from '../telemetry/use-telemetry';

interface UseWordDefinitionProps {
  contentId: string;
  knownWords?: Set<string>;
}

export function useWordDefinition({ contentId, knownWords = new Set() }: UseWordDefinitionProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [definition, setDefinition] = useState<Definition | null>(null);
  const [srsCount, setSrsCount] = useState(0);
  
  const { track } = useTelemetry(contentId);
  const fetcher = new DefinitionFetcher();
  const srsManager = new SRSManager();

  const definitionMutation = useMutation({
    mutationFn: async (word: string) => {
      return await fetcher.fetchDefinition(word, 'pt');
    },
    onSuccess: (data) => {
      setDefinition(data);
    },
    onError: (error) => {
      toast.error('Erro ao buscar definição');
      console.error('Definition fetch error:', error);
    }
  });

  const handleWordClick = useCallback(async (word: string, context: string) => {
    setSelectedWord(word);
    
    // Fetch definition
    const def = await definitionMutation.mutateAsync(word);
    
    // G6.2: Auto-add to SRS if unknown AND under limit
    const isKnown = srsManager.isKnown(word, knownWords);
    const canAdd = srsManager.canAddWord();
    
    if (!isKnown && canAdd) {
      const card = srsManager.createCard(word, def.definitions[0], context, contentId);
      
      // Would save to backend here
      // await api.post('/srs/cards', card);
      
      srsManager.incrementCount();
      setSrsCount(prev => prev + 1);
      
      if (srsCount + 1 === MAX_SRS_WORDS_PER_SESSION) {
        toast.warning('Limite de 20 palavras por sessão atingido');
      }
    }
    
    // G6.1: Track telemetry
    track('definition_opened', {
      word,
      addedToSRS: !isKnown && canAdd,
      srsCount: srsCount + ((!isKnown && canAdd) ? 1 : 0),
      source: def.source
    });
  }, [contentId, knownWords, srsCount]);

  const closeDefinition = useCallback(() => {
    setSelectedWord(null);
    setDefinition(null);
  }, []);

  return {
    selectedWord,
    definition,
    srsCount,
    remainingSlots: MAX_SRS_WORDS_PER_SESSION - srsCount,
    handleWordClick,
    closeDefinition,
    isLoading: definitionMutation.isPending
  };
}
