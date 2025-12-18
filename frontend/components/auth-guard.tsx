'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Needs to wait for hydration (zustand persist)
    // A simple check is if window is defined, but zustand persist might take a tick
    
    // We can assume if token is null after mount, redirect.
    if (!token) {
      router.push('/login');
    } else {
      setAuthorized(true);
    }
  }, [token, router]);

  if (!authorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return <>{children}</>;
}
