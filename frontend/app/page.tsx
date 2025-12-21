'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { ROUTES } from '@/lib/config/routes';

export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for Zustand to hydrate from localStorage
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return; // Don't redirect until hydrated
    
    if (user) {
      // User is logged in, redirect to dashboard
      router.replace(ROUTES.DASHBOARD.HOME);
    } else {
      // User is not logged in, redirect to login
      router.replace(ROUTES.AUTH.LOGIN);
    }
  }, [user, router, isHydrated]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        </div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
