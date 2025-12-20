'use client';

import { useState } from 'react';
import { useFamily, useFamilyUsage, useRemoveMember, useSetPrimaryFamily } from '@/hooks/use-family';
import { useRouter } from 'next/navigation';
import { ChevronLeft, BarChart2, DollarSign, Users, UserPlus, Trash2, Shield, User as UserIcon } from 'lucide-react';
import { InviteMemberModal } from '@/components/family/InviteMemberModal';
import { useAuthStore } from '@/stores/auth-store';

export default function FamilyDashboard({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: family, isLoading: familyLoading } = useFamily(params.id);
  const { data: usage, isLoading: usageLoading } = useFamilyUsage(params.id);
  const user = useAuthStore((state) => state.user);
  const removeMember = useRemoveMember();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  if (familyLoading || usageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!family) {
    return <div>Family not found</div>;
  }

  const myMembership = family.members.find(m => m.userId === user?.id);
  const canManage = myMembership?.role === 'OWNER' || myMembership?.role === 'ADMIN';

  const handleRemove = async (userId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      await removeMember.mutateAsync({ familyId: family.id, userId });
    }
  };

  // Safe access usage stats
  const uploadMetric = usage?.metrics['content_uploads_per_month'];
  const uploadCount = uploadMetric?.quantity || 0;
  const totalCost = usage?.totalCost || 0;

  const setPrimary = useSetPrimaryFamily();

  const handleSetPrimary = async () => {
    try {
        await setPrimary.mutateAsync(family.id);
        alert('Primary family updated successfully');
    } catch (e) {
        alert('Failed to set primary family');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex justify-between items-start mb-2">
            <button 
              onClick={() => router.back()} 
              className="flex items-center text-sm text-gray-500 hover:text-gray-900"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Families
            </button>
            {myMembership?.role === 'OWNER' && (
                <div className="flex gap-2">
                     <button
                        onClick={() => {
                             // Placeholder for transfer functionality (To be implemented with Modal)
                             alert('Transfer Ownership functionality coming soon!');
                        }}
                        className="text-xs flex items-center gap-1 text-gray-600 hover:text-blue-600 px-2 py-1 bg-gray-50 rounded border border-gray-200"
                     >
                        <Shield className="w-3 h-3" />
                        Transfer Owner
                     </button>
                     <button
                        onClick={() => {
                            if (confirm('Are you certain you want to delete this family? This action cannot be undone.')) {
                                // Placeholder for delete functionality
                                alert('Please implement useDeleteFamily hook connection');
                            }
                        }}
                        className="text-xs flex items-center gap-1 text-red-600 hover:text-red-700 px-2 py-1 bg-red-50 rounded border border-red-100"
                     >
                        <Trash2 className="w-3 h-3" />
                        Delete Family
                     </button>
                </div>
            )}
        </div>
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">{family.name}</h1>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                Free Plan
                {(user?.settings as any)?.primaryFamilyId === family.id && (
                    <span className="ml-2 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                        Primary
                    </span>
                )}
            </span>
            
            {/* Action Buttons */}
            <div className="flex gap-2 mt-2 md:mt-0">
               {/* Set Primary Button */}
               {(user?.settings as any)?.primaryFamilyId !== family.id && (
                  <button
                    onClick={handleSetPrimary}
                    className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 px-2 py-1 bg-blue-50 rounded border border-blue-200"
                  >
                     <Users className="w-3 h-3" />
                     Set as Primary
                  </button>
               )}
            </div>
        </div>
        
        {/* Helper text explaining Primary */}
        {(user?.settings as any)?.primaryFamilyId === family.id && (
            <p className="text-xs text-gray-500 mt-1">
                This is your primary family for billing and usage tracking.
            </p>
        )}
      </div>

      {/* Usage Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <BarChart2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-gray-500">Content Uploads (30d)</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{uploadCount}</p>
          <p className="text-xs text-gray-400 mt-1">Usage across all members</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
                <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-gray-500">Approx. Cost (30d)</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">${totalCost.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">Estimated operational cost</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-gray-500">Members</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{family.members.length}</p>
          <p className="text-xs text-gray-400 mt-1">Active and invited users</p>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Family Members</h3>
            {canManage && (
                <button
                    data-testid="invite-member-btn"
                    onClick={() => setInviteModalOpen(true)}
                    className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <UserPlus className="w-4 h-4" />
                    Invite Member
                </button>
            )}
        </div>

        <div className="divide-y divide-gray-100">
            {family.members.map((member) => (
                <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                             {member.user?.avatarUrl ? (
                                <img src={member.user.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
                              ) : (
                                <UserIcon className="w-5 h-5" />
                              )}
                        </div>
                        <div>
                             <p className="text-sm font-medium text-gray-900">
                                {member.user?.name || member.user?.email || 'Unknown User'}
                                {member.userId === user?.id && <span className="text-gray-400 ml-2">(You)</span>}
                             </p>
                             <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className={`capitalize ${member.role === 'OWNER' ? 'text-orange-600 font-medium' : ''}`}>
                                    {member.role.toLowerCase()}
                                </span>
                                <span>•</span>
                                <span className={member.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-500'}>
                                    {member.status.toLowerCase()}
                                </span>
                             </div>
                        </div>
                    </div>

                    {canManage && member.userId !== user?.id && (
                        <button
                            onClick={() => handleRemove(member.userId)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors bg-gray-50 rounded-full"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ))}
        </div>
      </div>

      {/* Invite Modal */}
      <InviteMemberModal
        familyId={family.id}
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </div>
  );
}
