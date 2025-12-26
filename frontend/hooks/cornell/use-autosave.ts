import { useCallback, useState, useRef, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { logger } from '@/lib/utils/logger';
import type { SaveStatus as SaveStatusType } from '@/lib/types/cornell';

// Re-export SaveStatus for barrel file
export type SaveStatus = SaveStatusType;

interface AutosaveOptions<T> {
  onSave: (data: T) => Promise<void>;
  delay?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface AutosaveReturn<T> {
  save: (data: T) => void;
  saveNow: (data: T) => Promise<void>;
  status: SaveStatus;
  lastSaved: Date | null;
}

export function useCornellAutosave<T>({
  onSave,
  delay = 1000,
  onSuccess,
  onError,
}: AutosaveOptions<T>): AutosaveReturn<T> {
  const [status, setStatus] = useState<SaveStatusType>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const pendingDataRef = useRef<T | null>(null);
  const isSavingRef = useRef(false);

  // Immediate save function
  const saveNow = useCallback(
    async (data: T) => {
      if (isSavingRef.current) {
        // Queue this data to save after current save completes
        pendingDataRef.current = data;
        return;
      }

      try {
        isSavingRef.current = true;
        setStatus('saving');

        await onSave(data);

        setStatus('saved');
        setLastSaved(new Date());
        onSuccess?.();

        // If there's pending data, save it now
        if (pendingDataRef.current) {
          const pending = pendingDataRef.current;
          pendingDataRef.current = null;
          setTimeout(() => saveNow(pending), 100);
        }
      } catch (error) {
        console.error('Autosave failed:', error);
        setStatus('error');
        onError?.(error as Error);
      } finally {
        isSavingRef.current = false;
      }
    },
    [onSave, onSuccess, onError]
  );

  // Debounced save
  const debouncedSave = useDebouncedCallback(saveNow, delay);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  return {
    save: debouncedSave,
    saveNow,
    status,
    lastSaved,
  };
}

// Simpler version for basic autosave with retry limit
export function useAutosave<T>(
  saveFn: (data: T) => Promise<void>,
  delay = 1000,
  maxRetries = 3
) {
  const [status, setStatus] = useState<SaveStatusType>('saved');
  const retriesRef = useRef(0);

  const save = useDebouncedCallback(
    async (data: T) => {
      try {
        setStatus('saving');
        await saveFn(data);
        setStatus('saved');
        retriesRef.current = 0; // Reset on success
      } catch (error) {
        logger.error('Autosave error', error);
        setStatus('error');
        
        // Retry with exponential backoff if under maxRetries
        if (retriesRef.current < maxRetries) {
          retriesRef.current++;
          const backoffDelay = 5000 * retriesRef.current; // 5s, 10s, 15s
          console.log(`Retrying autosave (${retriesRef.current}/${maxRetries}) in ${backoffDelay}ms`);
          
          setTimeout(() => {
            save(data);
          }, backoffDelay);
        } else {
          console.error('Max retries reached. Autosave failed permanently.');
          retriesRef.current = 0; // Reset for next attempt
        }
      }
    },
    delay
  );

  return { save, status };
}
