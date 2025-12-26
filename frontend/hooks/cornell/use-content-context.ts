import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface PedagogicalData {
  id: string;
  contentId: string;
  vocabularyTriage?: {
    words: Array<{
      word: string;
      definition: string;
      difficulty?: string;
    }>;
  };
  socraticQuestions?: Array<{
    sectionId: string;
    questions: Array<{
      question: string;
      type: string;
      difficulty?: string;
    }>;
  }>;
  quizQuestions?: any[];
  tabooCards?: any[];
  bossFightConfig?: any;
  processingVersion?: string;
}

export interface ContentContext {
  pedagogicalData: PedagogicalData | null;
  suggestions: Suggestion[];
}

export interface Suggestion {
  id: string;
  type: 'vocabulary_triage' | 'checkpoint_quiz' | 'mini_game' | 'concept_reinforcement';
  icon: '💡' | '🎯' | '🤖' | '🎮';
  title: string;
  description: string;
  actionLabel: string;
  dismissLabel?: string;
}

/**
 * Hook to fetch content context including pedagogical data and AI suggestions
 * @param contentId - ID of the content to fetch context for
 */
export function useContentContext(contentId: string) {
  const { data, isLoading, error, refetch } = useQuery<ContentContext>({
    queryKey: ['content-context', contentId],
    queryFn: async () => {
      const response = await api.get(`/cornell/contents/${contentId}/context`);
      return response.data;
    },
    enabled: !!contentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    pedagogicalData: data?.pedagogicalData ?? null,
    suggestions: data?.suggestions ?? [],
    isLoading,
    error,
    refetch,
  };
}
