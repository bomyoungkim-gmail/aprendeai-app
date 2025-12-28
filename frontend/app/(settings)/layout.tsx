/**
 * Settings Route Group Layout
 * 
 * Shared layout for all settings pages with sidebar navigation
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Bell, Lock, Users } from 'lucide-react';

const settingsNav = [
  { href: '/settings/profile', label: 'Perfil', icon: User },
  { href: '/settings/notifications', label: 'Notificações', icon: Bell },
  { href: '/settings/privacy', label: 'Privacidade', icon: Lock },
  { href: '/settings/family', label: 'Família', icon: Users },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Configurações
        </h1>
        
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {settingsNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
