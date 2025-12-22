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
      <div className="flex h-screen bg-gray-100">
        <DashboardSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile header with hamburger menu */}
          <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-900"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">AprendeAI</h1>
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
