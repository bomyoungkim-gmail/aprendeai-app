'use client';

import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';

export default function InstitutionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/institution/dashboard', icon: '📊' },
    { name: 'Members & Invites', href: '/institution/members', icon: '👥' },
    { name: 'Pending Approvals', href: '/institution/pending', icon: '⏳' },
    { name: 'Domains', href: '/institution/domains', icon: '🌐' },
    { name: 'SSO Configuration', href: '/institution/sso', icon: '🔐' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Institution Admin</h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                ← Back to Main Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="mt-5 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-3 py-2 text-sm font-medium border-l-4 transition-colors`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
