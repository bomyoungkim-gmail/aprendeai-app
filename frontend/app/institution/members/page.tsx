'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/config/api';

interface Invite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  usedAt?: string;
  inviter: { name: string };
}

interface InstitutionData {
  id: string;
  name: string;
}

export default function MembersPage() {
  const router = useRouter();
  const [institution, setInstitution] = useState<InstitutionData | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const getToken = () => localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const instRes = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INSTITUTIONS.MY_INSTITUTION}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      if (instRes.ok) {
        const instData = await instRes.json();
        setInstitution(instData);

        // Fetch invites for this institution
        const invitesRes = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INSTITUTIONS.INVITES(instData.id)}`, {
          headers: { 'Authorization': `Bearer ${getToken()}` },
        });
        if (invitesRes.ok) {
          setInvites(await invitesRes.json());
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async (email: string, role: string) => {
    if (!institution) return;

    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INSTITUTIONS.CREATE_INVITE(institution.id)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role, expiresInDays: 7 }),
      });

      if (res.ok) {
        setShowInviteModal(false);
        fetchData();
        alert('Invite sent successfully!');
      } else {
        const error = await res.json();
        alert(`Failed: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to create invite:', error);
      alert('Failed to send invite');
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!institution || !confirm('Cancel this invite?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INSTITUTIONS.CANCEL_INVITE(institution.id, inviteId)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });

      if (res.ok) {
        fetchData();
        alert('Invite cancelled');
      }
    } catch (error) {
      console.error('Failed to cancel invite:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Members & Invitations</h1>
        <button
          onClick={() => setShowInviteModal(true)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Create Invite
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invited By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invites.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No invites yet. Create one to get started.
                </td>
              </tr>
            ) : (
              invites.map((invite) => (
                <tr key={invite.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{invite.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold text-blue-800">
                      {invite.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {invite.usedAt ? (
                      <span className="text-green-600">✓ Used</span>
                    ) : new Date(invite.expiresAt) < new Date() ? (
                      <span className="text-red-600">Expired</span>
                    ) : (
                      <span className="text-yellow-600">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{invite.inviter.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(invite.expiresAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    {!invite.usedAt && new Date(invite.expiresAt) > new Date() && (
                      <button
                        onClick={() => handleCancelInvite(invite.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onSubmit={handleCreateInvite}
        />
      )}
    </div>
  );
}

function InviteModal({ onClose, onSubmit }: any) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('STUDENT');

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium mb-4">Create Invitation</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            >
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
              <option value="INSTITUTION_ADMIN">Admin</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(email, role)}
            disabled={!email}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            Send Invite
          </button>
        </div>
      </div>
    </div>
  );
}
