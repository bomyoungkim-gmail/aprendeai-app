'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Bot, 
  Flag, 
  Key, 
  FileText, 
  Activity, 
  Settings, 
  LogOut,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/institutions', label: 'Institutions', icon: Building2 },
  { href: '/admin/ai-usage', label: 'AI Analytics', icon: Bot },
  { href: '/admin/feature-flags', label: 'Feature Flags', icon: Flag },
  { href: '/admin/secrets', label: 'Secrets', icon: Key },
  { href: '/admin/audit', label: 'Audit Logs', icon: FileText },
  { href: '/admin/observability', label: 'Observability', icon: Activity },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={clsx(
        "fixed md:static inset-y-0 left-0 z-50 flex h-full flex-col bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-all duration-300 border-r border-gray-200 dark:border-slate-800",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        isCollapsed ? "md:w-20" : "md:w-64",
        "w-64" // Always full width on mobile
      )}>
        <div className={clsx(
          "flex h-16 items-center border-b border-gray-200 dark:border-slate-800",
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        )}>
          {/* Title - hidden when collapsed */}
          {!isCollapsed && (
            <h1 className="text-xl font-bold">
              Admin
            </h1>
          )}
          
          {/* Close button for mobile */}
          {!isCollapsed && (
            <button 
              onClick={onClose}
              className="md:hidden text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          )}
          
          {/* Collapse toggle for desktop - ALWAYS VISIBLE */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:block text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.href === '/admin' 
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800',
                  isCollapsed && 'justify-center'
                )}
                onClick={() => onClose()}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        
        {/* Bottom Section */}
        <div className="border-t border-gray-200 dark:border-slate-800 p-4 space-y-3">
          {/* Theme Toggle in Sidebar */}
           <div className={clsx("flex items-center gap-3", isCollapsed && "justify-center")}>
             <ThemeToggle />
             {!isCollapsed && <span className="text-sm">Theme</span>}
           </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={clsx(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
}
