'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/config/routes';

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.SETTINGS.ACCOUNT);
  }, [router]);

  return null;
}
