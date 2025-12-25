'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Bell, Lock, Settings as SettingsIcon, Users, ArrowLeft, Palette, CreditCard } from 'lucide-react';

const settingsNav = [
  { name: 'Account', href: '/settings/account', icon: User },
  { name: 'Appearance', href: '/settings/appearance', icon: Palette },
  { name: 'Billing', href: '/settings/billing', icon: CreditCard },
  { name: 'Notifications', href: '/settings/notifications', icon: Bell },
  { name: 'Privacy', href: '/settings/privacy', icon: Lock },
  { name: 'Family', href: '/settings/family', icon: Users },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Voltar ao Dashboard</span>
        </Link>

        {/* Header */}
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row justify-between lg:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <SettingsIcon className="w-8 h-8" />
              Settings
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your account settings and preferences</p>
          </div>
          <div id="settings-header-portal" />
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <nav className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
              {settingsNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/40 dark:text-blue-400'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
