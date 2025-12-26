import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Suggestion } from './useContentContext';

/**
 * Hook to manage AI suggestions lifecycle (polling, accept, dismiss)
 * @param contentId - ID of the content to manage suggestions for
 */
export function useSuggestions(contentId: string) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isPolling, setIsPolling] = useState(false);

  // Poll for new suggestions every 30 seconds
  useEffect(() => {
    if (!contentId) return;

    const fetchSuggestions = async () => {
      try {
        const response = await api.get(`/cornell/contents/${contentId}/context`);
        setSuggestions(response.data.suggestions || []);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      }
    };

    // Initial fetch
    fetchSuggestions();

    // Set up polling
    const interval = setInterval(fetchSuggestions, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [contentId]);

  const acceptSuggestion = async (suggestionId: string) => {
    try {
      // Log acceptance to backend
      await api.post(`/cornell/suggestions/${suggestionId}/accept`);
      
      // Remove from local state
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      
      // Trigger associated action based on suggestion type
      const suggestion = suggestions.find(s => s.id === suggestionId);
      if (suggestion) {
        // Emit event or callback for parent component to handle
        window.dispatchEvent(new CustomEvent('suggestion-accepted', { 
          detail: { suggestion } 
        }));
      }
    } catch (error) {
      console.error('Failed to accept suggestion:', error);
    }
  };

  const dismissSuggestion = async (suggestionId: string) => {
    try {
      // Log dismissal to backend
      await api.post(`/cornell/suggestions/${suggestionId}/dismiss`);
      
      // Remove from local state with animation delay
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    } catch (error) {
      console.error('Failed to dismiss suggestion:', error);
    }
  };

  const dismissAll = () => {
    suggestions.forEach(s => dismissSuggestion(s.id));
  };

  return {
    suggestions,
    acceptSuggestion,
    dismissSuggestion,
    dismissAll,
    hasUnseenSuggestions: suggestions.length > 0,
  };
}
