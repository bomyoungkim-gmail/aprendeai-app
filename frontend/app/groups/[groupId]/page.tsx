'use client';

import { useState, Fragment } from 'react';
import { Tab } from '@headlessui/react';
import { useGroup } from '@/hooks/use-groups';
import { AuthGuard } from '@/components/auth-guard';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, BookOpen, Calendar } from 'lucide-react';
import { MembersTab } from '@/components/study-groups/MembersTab';
import { PlaylistTab } from '@/components/study-groups/PlaylistTab';
import { SessionsTab } from '@/components/study-groups/SessionsTab';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function GroupPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const { data: group, isLoading, error } = useGroup(groupId);

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600">Loading group...</div>
        </div>
      </AuthGuard>
    );
  }

  if (error || !group) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              Failed to load group. Please try again.
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Link 
              href="/groups"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Groups
            </Link>
            
            <h1 className="text-2xl font-bold mb-2">{group.name}</h1>
            
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{group.members?.length || 0} members</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span>{group.contents?.length || 0} contents</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{group._count?.sessions || 0} sessions</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          <Tab.Group>
            <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6">
              {['Members', 'Playlist', 'Sessions'].map((tab) => (
                <Tab
                  key={tab}
                  className={({ selected }) =>
                    classNames(
                      'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                      'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                      selected
                        ? 'bg-white text-blue-700 shadow'
                        : 'text-blue-900 hover:bg-white/[0.12] hover:text-blue-800'
                    )
                  }
                >
                  {tab}
                </Tab>
              ))}
            </Tab.List>
            
            <Tab.Panels>
              <Tab.Panel>
                <MembersTab group={group} />
              </Tab.Panel>
              
              <Tab.Panel>
                <PlaylistTab group={group} />
              </Tab.Panel>
              
              <Tab.Panel>
                <SessionsTab group={group} />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </AuthGuard>
  );
}
