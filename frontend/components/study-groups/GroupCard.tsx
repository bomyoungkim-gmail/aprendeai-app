'use client';

import Link from 'next/link';
import { StudyGroup } from '@/lib/types/study-groups';
import { Users, BookOpen, Calendar } from 'lucide-react';

interface GroupCardProps {
  group: StudyGroup;
}

export function GroupCard({ group }: GroupCardProps) {
  return (
    <Link 
      href={`/groups/${group.id}`}
      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
    >
      <h3 className="text-xl font-semibold mb-2">{group.name}</h3>
      
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>{group._count?.members || 0} members</span>
        </div>
        
        <div className="flex items-center gap-1">
          <BookOpen className="w-4 h-4" />
          <span>{group._count?.contents || 0} contents</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{group._count?.sessions || 0} sessions</span>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        Created {new Date(group.createdAt).toLocaleDateString()}
      </div>
    </Link>
  );
}
