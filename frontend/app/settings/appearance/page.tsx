'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor, Palette } from 'lucide-react';
import { SettingsPageHeader } from '@/components/ui/SettingsPageHeader';

export default function AppearancePage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const themes = [
    {
      id: 'light',
      name: 'Light',
      icon: Sun,
      description: 'Clean and bright, perfect for day time.',
    },
    {
      id: 'dark',
      name: 'Dark',
      icon: Moon,
      description: 'Easy on the eyes, great for low light.',
    },
    {
      id: 'system',
      name: 'System',
      icon: Monitor,
      description: 'Syncs with your device preference.',
    },
  ];

  return (
    <div className="space-y-8">
      <SettingsPageHeader
        title="Appearance"
        description="Customize how the application looks on your device."
        icon={Palette}
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Theme Preference</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {themes.map((item) => {
            const isActive = theme === item.id;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => setTheme(item.id)}
                className={`relative flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left group ${
                  isActive
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/40 ring-1 ring-blue-600'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className={`p-2 rounded-lg mb-3 ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <h3 className={`font-medium mb-1 ${
                  isActive ? 'text-blue-900 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                }`}>
                  {item.name}
                </h3>
                
                <p className={`text-sm ${
                  isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {item.description}
                </p>

                {isActive && (
                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
