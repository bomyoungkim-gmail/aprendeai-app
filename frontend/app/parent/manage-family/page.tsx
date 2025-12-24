'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/config/api';
import toast from 'react-hot-toast';
import { SkeletonTable } from '@/components/ui/skeleton';

interface FamilyMember {
  id: string;
  role: string;
  active: boolean; // Computed from status
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string; // Optional
  };
}

interface FamilyData {
  id: string;
  name: string;
  members: FamilyMember[];
}

export default function ManageFamilyPage() {
  const [family, setFamily] = useState<FamilyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const getToken = () => localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FAMILY.MY_FAMILY}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Transform members to flat structure if needed
        setFamily({
          ...data,
          members: data.members.map((m: any) => ({
             id: m.id, // ID of the FamilyMember relation
             role: m.role,
             active: m.status === 'ACTIVE',
             user: m.user,
          }))
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (email: string, role: string) => {
    if (!family) return;

    const loadingToast = toast.loading('Sending invite...');
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FAMILY.INVITE(family.id)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      });

      if (res.ok) {
        setShowInviteModal(false);
        fetchData();
        toast.success('Invitation sent successfully!', { id: loadingToast });
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to send invite', { id: loadingToast });
      }
    } catch (error) {
      console.error(error);
      toast.error('Network error. Please try again.', { id: loadingToast });
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!family || !confirm('Are you sure you want to remove this member?')) return;

    const loadingToast = toast.loading('Removing member...');
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FAMILY.REMOVE_MEMBER(family.id, memberUserId)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });

      if (res.ok) {
        fetchData();
        toast.success('Member removed successfully', { id: loadingToast });
      } else {
        toast.error('Failed to remove member', { id: loadingToast });
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error('Network error. Please try again.', { id: loadingToast });
    }
  };

  const handleTransferOwnership = async (newOwnerId: string) => {
    if (!family || !confirm('DANGER: Transfer ownership? You will become a GUARDIAN.')) return;

    const loadingToast = toast.loading('Transferring ownership...');
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FAMILY.TRANSFER_OWNERSHIP(family.id)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newOwnerId }),
      });

      if (res.ok) {
        setShowTransferModal(false);
        fetchData();
        toast.success('Ownership transferred successfully!', { id: loadingToast });
      } else {
        const err = await res.json();
        toast.error(err.message || 'Transfer failed', { id: loadingToast });
      }
    } catch (error) {
      console.error('Transfer failed:', error);
      toast.error('Network error. Please try again.', { id: loadingToast });
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manage Family</h1>
        </div>
        <SkeletonTable rows={3} />
      </div>
    );
  }

  if (!family) return <div>No family data</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Family</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTransferModal(true)}
            className="rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Transfer Ownership
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Invite Member
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {family.members.map((member) => (
              <tr key={member.id}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {member.user.name?.charAt(0) || '?'}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{member.user.name}</div>
                      <div className="text-sm text-gray-500">{member.user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                   <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${member.role === 'OWNER' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                   {member.active ? (
                     <span className="text-green-600">Active</span>
                   ) : (
                     <span className="text-yellow-600">Pending</span>
                   )}
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  {member.role !== 'OWNER' && (
                    <button
                      onClick={() => handleRemoveMember(member.user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onSubmit={handleInvite}
        />
      )}

      {/* Transfer Ownership Modal */}
      {showTransferModal && (
        <TransferModal
            members={family.members.filter(m => m.role !== 'OWNER')}
            onClose={() => setShowTransferModal(false)}
            onSubmit={handleTransferOwnership}
        />
      )}
    </div>
  );
}

function InviteModal({ onClose, onSubmit }: any) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('CHILD');

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium mb-4">Invite Family Member</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              placeholder="member@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            >
              <option value="CHILD">Child (Learner)</option>
              <option value="GUARDIAN">Guardian (Parent)</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSubmit(email, role)} disabled={!email} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">Send Invite</button>
        </div>
      </div>
    </div>
  );
}

function TransferModal({ members, onClose, onSubmit }: any) {
    const [selectedId, setSelectedId] = useState('');

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4 text-red-600">Transfer Ownership</h3>
            <p className="text-sm text-gray-600 mb-4">
                Select the new owner. You will stop being the Owner and become a Guardian. This action transfers billing responsibility.
            </p>
            <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">New Owner</label>
                <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                >
                <option value="">Select a member...</option>
                {members.map((m: any) => (
                    <option key={m.user.id} value={m.user.id}>
                        {m.user.name} ({m.role})
                    </option>
                ))}
                </select>
            </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
            <button onClick={onClose} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancel</button>
            <button onClick={() => onSubmit(selectedId)} disabled={!selectedId} className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50">Confirm Transfer</button>
            </div>
        </div>
        </div>
    );
}
