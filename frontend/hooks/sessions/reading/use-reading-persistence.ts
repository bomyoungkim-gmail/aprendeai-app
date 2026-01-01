import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from '@/services/api/sessions.api';
import { toast } from 'sonner';

interface ReadingPersistenceOptions {
  contentId: string;
  currentPage: number;
  scrollPercentage: number;
  autoSaveIntervalMs?: number;
  onRestore?: (progress: { last_page: number; last_scroll_pct: number }) => void;
}

/**
 * Hook to manage reading position persistence and bookmarks.
 * Automatically saves progress at regular intervals.
 */
export function useReadingPersistence({
  contentId,
  currentPage,
  scrollPercentage,
  autoSaveIntervalMs = 30000,
  onRestore
}: ReadingPersistenceOptions) {
  const queryClient = useQueryClient();
  const lastSavedRef = useRef({ page: 0, scroll: 0 });
  const isInitialRestoreDone = useRef(false);

  // 1. Fetch Progress
  const { data: progress, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['readingProgress', contentId],
    queryFn: () => sessionsApi.getProgress(contentId),
    enabled: !!contentId,
    staleTime: Infinity, // Rely on cache and manual updates
  });

  // 2. Fetch Bookmarks
  const { data: bookmarks, isLoading: isLoadingBookmarks } = useQuery({
    queryKey: ['bookmarks', contentId],
    queryFn: () => sessionsApi.getBookmarks(contentId),
    enabled: !!contentId,
  });

  // 3. Mutations
  const updateProgressMutation = useMutation({
    mutationFn: (data: { last_page: number; last_scroll_pct: number }) =>
      sessionsApi.updateProgress(contentId, data),
    onSuccess: (data) => {
      queryClient.setQueryData(['readingProgress', contentId], data);
      lastSavedRef.current = { page: data.last_page, scroll: data.last_scroll_pct };
    }
  });

  const createBookmarkMutation = useMutation({
    mutationFn: (data: { page_number: number; scroll_pct?: number; label?: string; color?: string }) =>
      sessionsApi.createBookmark(contentId, data),
    onSuccess: (newBookmark) => {
      queryClient.setQueryData(['bookmarks', contentId], (old: any) => [newBookmark, ...(old || [])]);
      toast.success('Bookmark saved!');
    },
    onError: () => {
      toast.error('Failed to save bookmark');
    }
  });

  const deleteBookmarkMutation = useMutation({
    mutationFn: (id: string) => sessionsApi.deleteBookmark(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(['bookmarks', contentId], (old: any) => 
        (old || []).filter((b: any) => b.id !== id)
      );
      toast.success('Bookmark removed');
    },
    onError: () => {
      toast.error('Failed to remove bookmark');
    }
  });

  // 4. Restore Logic - Triggered when progress data is loaded for the first time
  useEffect(() => {
    if (progress && !isInitialRestoreDone.current && onRestore) {
      if (progress.last_page > 0 || progress.last_scroll_pct > 0) {
        onRestore({
          last_page: progress.last_page,
          last_scroll_pct: progress.last_scroll_pct
        });
        isInitialRestoreDone.current = true;
        
        // Initialize lastSavedRef to prevent immediate redundant save
        lastSavedRef.current = { 
          page: progress.last_page, 
          scroll: progress.last_scroll_pct 
        };
      }
    }
  }, [progress, onRestore]);

  // 5. Auto-Save Interval
  useEffect(() => {
    if (!contentId) return;

    const interval = setInterval(() => {
      // Only save if something changed meaningfully (>5% scroll or page change)
      const hasChanged = 
        currentPage !== lastSavedRef.current.page || 
        Math.abs(scrollPercentage - lastSavedRef.current.scroll) > 5;

      if (hasChanged) {
        updateProgressMutation.mutate({
          last_page: currentPage,
          last_scroll_pct: scrollPercentage
        });
      }
    }, autoSaveIntervalMs);

    return () => clearInterval(interval);
  }, [contentId, currentPage, scrollPercentage, autoSaveIntervalMs, updateProgressMutation]);

  return {
    progress,
    isLoadingProgress,
    bookmarks,
    isLoadingBookmarks,
    createBookmark: createBookmarkMutation.mutate,
    deleteBookmark: deleteBookmarkMutation.mutate,
    isSaving: updateProgressMutation.isPending
  };
}
