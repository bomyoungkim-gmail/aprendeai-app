/**
 * Cornell Session Domain Hook
 * 
 * Manages reading session state including bookmarks, navigation, session lifecycle,
 * synthesis items, annotation counts, and thread context.
 * 
 * This hook extracts session management logic from ModernCornellLayout.
 */

import { useMemo } from 'react';
import { toast } from 'sonner';
import { useBookmarks, useCreateBookmark, useDeleteBookmark } from '@/hooks/cornell/use-bookmarks';
import { useFinishSession } from '@/hooks/sessions/reading/use-reading-session';
import { useAuthStore } from '@/stores/auth-store';
import { ShareContextType } from '@/lib/types/sharing';
import type { UnifiedStreamItem } from '@/lib/types/unified-stream';
import { filterSynthesisItems } from '@/lib/cornell/helpers';

export interface Bookmark {
  id: string;
  page_number: number;
  scroll_pct: number;
  label?: string;
  created_at: string;
}

export interface UseCornellSessionReturn {
  // Bookmarks
  bookmarks: Bookmark[];
  createBookmark: (data: { page_number: number; scroll_pct: number }) => void;
  deleteBookmark: (id: string) => void;
  
  // Session
  sessionId?: string;
  finishSession: () => Promise<void>;
  isFinishing: boolean;
  
  // Navigation
  onNavigate?: (page: number, scrollPct?: number) => void;
  
  // Synthesis
  synthesisItems: UnifiedStreamItem[];
  
  // Section Annotations
  annotationCounts: Record<string, number>;
  
  // Thread Context
  threadContext: { type: ShareContextType; id: string };
}

/**
 * Hook for managing Cornell session state
 */
export function useCornellSession(
  contentId: string,
  sessionId?: string,
  streamItems: UnifiedStreamItem[] = [],
  onNavigate?: (page: number, scrollPct?: number) => void,
  onFinishSession?: () => void
): UseCornellSessionReturn {
  const user = useAuthStore((state) => state.user);
  
  // Bookmarks
  const { data: bookmarksData } = useBookmarks(contentId);
  const createBookmarkMutation = useCreateBookmark(contentId);
  const deleteBookmarkMutation = useDeleteBookmark(contentId);
  
  const bookmarks = (bookmarksData || []) as Bookmark[];
  
  const createBookmark = (data: { page_number: number; scroll_pct: number }) => {
    createBookmarkMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Marcador criado!');
      },
      onError: () => {
        toast.error('Erro ao criar marcador');
      },
    });
  };
  
  const deleteBookmark = (id: string) => {
    deleteBookmarkMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Marcador removido!');
      },
      onError: () => {
        toast.error('Erro ao remover marcador');
      },
    });
  };
  
  // Session finish
  const finishSessionMutation = useFinishSession(sessionId || '');
  
  const finishSession = async () => {
    if (!sessionId) return;
    try {
      await finishSessionMutation.mutateAsync(undefined);
      toast.success('Tarefa finalizada com sucesso!');
      onFinishSession?.();
    } catch (error) {
      toast.error('Erro ao finalizar tarefa.');
    }
  };
  
  // Synthesis items
  const synthesisItems = useMemo(() => {
    return filterSynthesisItems(streamItems);
  }, [streamItems]);
  
  // Annotation counts by section
  const annotationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    streamItems.forEach(item => {
      if (item.type === 'annotation') {
        // For MVP/Test, we randomly assign or mock sections if not present
        const sec = (item as any).section || 'abstract';
        counts[sec] = (counts[sec] || 0) + 1;
      }
    });
    return counts;
  }, [streamItems]);
  
  // Thread context
  const threadContext = useMemo(() => {
    if (user?.activeInstitutionId) {
      return { type: ShareContextType.CLASSROOM, id: user.activeInstitutionId };
    }
    if (user?.settings?.primaryFamilyId) {
      return { type: ShareContextType.FAMILY, id: user.settings.primaryFamilyId };
    }
    // Fallback or Individual - UI should really provide this if in a Study Group
    return { type: ShareContextType.STUDY_GROUP, id: contentId };
  }, [user, contentId]);
  
  return {
    // Bookmarks
    bookmarks,
    createBookmark,
    deleteBookmark,
    
    // Session
    sessionId,
    finishSession,
    isFinishing: finishSessionMutation.isPending,
    
    // Navigation
    onNavigate,
    
    // Synthesis
    synthesisItems,
    
    // Section Annotations
    annotationCounts,
    
    // Thread Context
    threadContext,
  };
}
