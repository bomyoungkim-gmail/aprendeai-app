import { useEffect, useState } from 'react';

/**
 * Hook to detect online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook to sync save status with online/offline
 */
export function useSaveStatusWithOnline(
  baseStatus: 'saved' | 'saving' | 'error'
): 'saved' | 'saving' | 'offline' | 'error' {
  const isOnline = useOnlineStatus();

  if (!isOnline && baseStatus === 'saved') {
    return 'offline';
  }

  return baseStatus;
}
