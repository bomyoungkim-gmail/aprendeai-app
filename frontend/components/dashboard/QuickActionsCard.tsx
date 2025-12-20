'use client';

import Link from 'next/link';
import { 
  Upload, 
  FileText, 
  PlayCircle, 
  Users, 
  Plus,
  ArrowRight 
} from 'lucide-react';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  bgColor: string;
}

const quickActions: QuickAction[] = [
  {
    title: 'Upload Content',
    description: 'Add new learning materials',
    icon: Upload,
    href: '/upload',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Create Cornell Notes',
    description: 'Start organized note-taking',
    icon: FileText,
    href: '/cornell-notes/new',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    title: 'Start Study Session',
    description: 'Begin a focused study session',
    icon: PlayCircle,
    href: '/study-sessions/new',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    title: 'Join Study Group',
    description: 'Collaborate with others',
    icon: Users,
    href: '/study-groups',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
];

export function QuickActionsCard() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <Plus className="h-5 w-5 text-gray-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <QuickActionButton key={action.title} action={action} />
        ))}
      </div>
    </div>
  );
}

function QuickActionButton({ action }: { action: QuickAction }) {
  const Icon = action.icon;

  return (
    <Link
      href={action.href}
      className="group flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
    >
      <div className={`flex-shrink-0 w-10 h-10 ${action.bgColor} rounded-lg flex items-center justify-center`}>
        <Icon className={`h-5 w-5 ${action.color}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 truncate">
          {action.title}
        </h3>
        <p className="text-xs text-gray-500 truncate">
          {action.description}
        </p>
      </div>

      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}
