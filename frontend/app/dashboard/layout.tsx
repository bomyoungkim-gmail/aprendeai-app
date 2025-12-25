'use client';

import { useState } from 'react';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { Menu } from 'lucide-react';
import AuthGuard from '@/components/auth-guard';
import DashboardSidebar from '@/components/dashboard-sidebar';

// ... imports

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
        <DashboardSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile header */}
          <div className="md:hidden flex items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">AprendeAI</h1>
            <div className="w-6" /> {/* Spacer for centering */}
          </div>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="mb-6">
              <GlobalSearch />
            </div>
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
