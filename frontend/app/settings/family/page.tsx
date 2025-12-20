'use client';

import { useState } from 'react';
import { useFamilies, useRemoveMember, useAcceptInvite } from '@/hooks/use-family';
import { CreateFamilyModal } from '@/components/family/CreateFamilyModal';
import { InviteMemberModal } from '@/components/family/InviteMemberModal';
import { Plus, Users, UserPlus, Trash2, Shield, User as UserIcon, Check, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { Family, FamilyMember } from '@/lib/types/family';
import Link from 'next/link';

export default function FamilySettingsPage() {
  const { data: families, isLoading } = useFamilies();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [inviteModal, setInviteModal] = useState<{ isOpen: boolean; familyId: string }>({ 
    isOpen: false, 
    familyId: '' 
  });
  const user = useAuthStore((state) => state.user);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Family Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Create families, invite members, and manage access.
          </p>
        </div>
        <button
          data-testid="create-family-btn"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Family
        </button>
      </div>

      {!families || families.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No families yet</h3>
          <p className="mt-1 text-gray-500 max-w-sm mx-auto">
            Create a family to share your plan and collaborate with others.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your first family
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {families.map((family) => (
            <FamilyCard
              key={family.id}
              family={family}
              currentUserId={user?.id}
              onInvite={() => setInviteModal({ isOpen: true, familyId: family.id })}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateFamilyModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
      
      {inviteModal.familyId && (
        <InviteMemberModal
          familyId={inviteModal.familyId}
          isOpen={inviteModal.isOpen}
          onClose={() => setInviteModal({ ...inviteModal, isOpen: false })}
        />
      )}
    </div>
  );
}

function FamilyCard({ 
  family, 
  currentUserId, 
  onInvite 
}: { 
  family: Family; 
  currentUserId?: string;
  onInvite: () => void;
}) {
  const removeMember = useRemoveMember();
  const acceptInvite = useAcceptInvite();
  
  // Am I an Admin/Owner?
  const myMembership = family.members.find(m => m.userId === currentUserId);
  const canManage = myMembership?.role === 'OWNER' || myMembership?.role === 'ADMIN';

  const handleRemove = async (userId: string) => {
    const isMe = userId === currentUserId;
    const msg = isMe ? 'Are you sure you want to leave this family?' : 'Are you sure you want to remove this member?';
    
    if (confirm(msg)) {
      await removeMember.mutateAsync({ familyId: family.id, userId });
    }
  };

  const isInvited = myMembership?.status === 'INVITED';

  if (isInvited) {
     return (
        <div className="bg-blue-50 rounded-xl border border-blue-200 shadow-sm p-6">
           <div className="flex justify-between items-center">
             <div>
               <h3 className="font-semibold text-gray-900 text-lg">{family.name}</h3>
               <p className="text-blue-700 mt-1 flex items-center gap-2">
                 <Shield className="w-4 h-4" />
                 You have been invited to join this family as a <strong>{myMembership?.role}</strong>.
               </p>
             </div>
             <div className="flex gap-3">
               <button
                 onClick={() => handleRemove(currentUserId!)} // Decline = Remove self
                 className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
               >
                 <X className="w-4 h-4" />
                 Decline
               </button>
               <button
                 onClick={() => acceptInvite.mutate(family.id)}
                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
               >
                 <Check className="w-4 h-4" />
                 Accept Invitation
               </button>
             </div>
           </div>
        </div>
     );
  }

  return (
    <div data-testid="family-card" className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <div>
          <Link href={`/settings/family/${family.id}`} className="hover:underline cursor-pointer">
             <h3 className="font-semibold text-gray-900">{family.name}</h3>
          </Link>
          <p className="text-xs text-gray-500 mt-0.5">
            Created on {new Date(family.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
            <Link 
                href={`/settings/family/${family.id}`}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-1 bg-white border border-gray-200 rounded-lg flex items-center"
            >
                View Dashboard
            </Link>
            {canManage && (
            <button
                onClick={onInvite}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1 bg-blue-50 rounded-lg"
            >
                <UserPlus className="w-4 h-4" />
                Invite
            </button>
            )}
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {family.members.map((member) => (
          <div key={member.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                {member.user?.avatarUrl ? (
                  <img src={member.user.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <UserIcon className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {member.user?.name || member.user?.email || 'Unknown User'} 
                  {member.userId === currentUserId && <span className="text-gray-400 ml-2">(You)</span>}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    {member.role === 'OWNER' && <Shield className="w-3 h-3 text-orange-500" />}
                    {member.role}
                  </span>
                  <span>•</span>
                  <span className={
                    member.status === 'ACTIVE' ? 'text-green-600' : 
                    member.status === 'INVITED' ? 'text-yellow-600' : 'text-gray-600'
                  }>
                    {member.status}
                  </span>
                </div>
              </div>
            </div>

            {(canManage && member.userId !== currentUserId) || (member.userId === currentUserId && member.role !== 'OWNER') ? (
              <button
                onClick={() => handleRemove(member.userId)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title={member.userId === currentUserId ? "Leave Family" : "Remove Member"}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
