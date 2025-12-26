import { useCallback } from 'react';
import api from '@/lib/api';

type EventType = 
  | 'MARK_UNKNOWN_WORD' 
  | 'MARK_KEY_IDEA' 
  | 'CHECKPOINT_RESPONSE' 
  | 'QUIZ_RESPONSE' 
  | 'PRODUCTION_SUBMIT';

interface EventPayload {
  [key: string]: any;
}

export function useSessionEvents(sessionId?: string) {
  const recordEvent = useCallback(async (
    eventType: EventType,
    payload: EventPayload
  ) => {
    if (!sessionId) {
      console.warn('No session ID provided, event not recorded');
      return;
    }

    try {
      const response = await api.post(`/reading-sessions/${sessionId}/events`, {
        eventType,
        payload,
      });

      return response.data;
    } catch (err) {
      console.error('Failed to record event:', err);
      // Don't throw - event tracking shouldn't break the app
    }
  }, [sessionId]);

  const recordUnknownWord = useCallback((term: string, context?: string) => {
    return recordEvent('MARK_UNKNOWN_WORD', {
      term,
      context,
      timestamp: new Date().toISOString(),
    });
  }, [recordEvent]);

  const recordKeyIdea = useCallback((highlightId: string, noteSnippet?: string) => {
    return recordEvent('MARK_KEY_IDEA', {
      highlight_id: highlightId,
      note_snippet: noteSnippet,
      timestamp: new Date().toISOString(),
    });
  }, [recordEvent]);

  const recordCheckpointResponse = useCallback((checkpointId: string, response: string) => {
    return recordEvent('CHECKPOINT_RESPONSE', {
      checkpoint_id: checkpointId,
      response_text: response,
      timestamp: new Date().toISOString(),
    });
  }, [recordEvent]);

  const recordQuizResponse = useCallback((quizId: string, answerText: string, confidence?: number) => {
    return recordEvent('QUIZ_RESPONSE', {
      quiz_id: quizId,
      answer_text: answerText,
      confidence: confidence || 0.5,
      timestamp: new Date().toISOString(),
    });
  }, [recordEvent]);

  const recordProduction = useCallback((text: string, wordCount: number) => {
    return recordEvent('PRODUCTION_SUBMIT', {
      text,
      word_count: wordCount,
      timestamp: new Date().toISOString(),
    });
  }, [recordEvent]);

  return {
    recordEvent,
    recordUnknownWord,
    recordKeyIdea,
    recordCheckpointResponse,
    recordQuizResponse,
    recordProduction,
  };
}
