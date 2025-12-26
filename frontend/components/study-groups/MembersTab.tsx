'use client';

import { useState } from 'react';
import { StudyGroup } from '@/lib/types/study-groups';
import { useAuthStore } from '@/stores/auth-store';
import { useRemoveGroupMember } from '@/hooks/social/use-groups';
import { InviteMemberModal } from './InviteMemberModal';
import { UserPlus, Crown, Shield, User as UserIcon, Trash2 } from 'lucide-react';

interface MembersTabProps {
  group: StudyGroup;
}

export function MembersTab({ group }: MembersTabProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { user } = useAuthStore();
  const removeMember = useRemoveGroupMember(group.id);

  const myMembership = group.members?.find((m) => m.userId === user?.id);
  const canManageMembers = myMembership?.role === 'OWNER' || myMembership?.role === 'MOD';

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    try {
      await removeMember.mutateAsync(userId);
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'MOD':
        return <Shield className="w-4 h-4 text-blue-600" />;
      default:
        return <UserIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      OWNER: 'bg-yellow-100 text-yellow-800',
      MOD: 'bg-blue-100 text-blue-800',
      MEMBER: 'bg-gray-100 text-gray-800',
    };
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${colors[role as keyof typeof colors]}`}>
        {role}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Members ({group.members?.length || 0})</h2>
        {canManageMembers && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      <div className="space-y-3">
        {group.members?.map((member) => (
          <div
            key={member.userId}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              {getRoleIcon(member.role)}
              <div>
                <div className="font-medium">{member.user?.name || 'Unknown'}</div>
                <div className="text-sm text-gray-600">{member.user?.email}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {getRoleBadge(member.role)}
              
              {member.status !== 'ACTIVE' && (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                  {member.status}
                </span>
              )}
              
              {canManageMembers && member.role !== 'OWNER' && member.userId !== user?.id && (
                <button
                  onClick={() => handleRemoveMember(member.userId)}
                  disabled={removeMember.isPending}
                  className="text-red-600 hover:text-red-700 disabled:opacity-50"
                  title="Remove member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <InviteMemberModal
        groupId={group.id}
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  );
}
