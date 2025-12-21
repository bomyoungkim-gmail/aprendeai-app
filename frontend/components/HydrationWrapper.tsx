'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';

interface HydrationWrapperProps {
  children: React.ReactNode;
}

export function HydrationWrapper({ children }: HydrationWrapperProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  useEffect(() => {
    // Wait for zustand to hydrate from localStorage
    if (hasHydrated) {
      setIsHydrated(true);
    }
  }, [hasHydrated]);

  // Show minimal loading screen while hydrating
  if (!isHydrated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
