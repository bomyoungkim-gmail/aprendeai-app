'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LucideIcon } from 'lucide-react';

interface SettingsPageHeaderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export function SettingsPageHeader({ title, description, icon: Icon }: SettingsPageHeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    setPortalContainer(document.getElementById('settings-header-portal'));
  }, []);

  if (!mounted) return null;

  const content = (
    <div className="text-right">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center justify-end gap-3">
        {Icon && <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
        {title}
      </h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  );

  // If portal exists, render there. Otherwise render in place (fallback)
  if (portalContainer) {
    return createPortal(content, portalContainer);
  }

  return <div className="mb-8">{content}</div>;
}
