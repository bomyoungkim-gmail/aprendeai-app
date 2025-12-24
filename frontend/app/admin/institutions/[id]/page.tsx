'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/config/api';

type Tab = 'members' | 'domains' | 'pending';

interface Institution {
  id: string;
  name: string;
  type: string;
  city?: string;
  state?: string;
  requiresApproval?: boolean;
  ssoEnabled?: boolean;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  usedAt?: string;
  inviter: { name: string };
}

interface Domain {
  id: string;
  domain: string;
  autoApprove: boolean;
  defaultRole: string;
}

interface PendingApproval {
  id: string;
  email: string;
  name: string;
  requestedRole: string;
  createdAt: string;
  status: string;
}

export default function InstitutionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const institutionId = params.id as string;

  const [activeTab, setActiveTab] = useState<Tab>('members');
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [pending, setPending] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);

  useEffect(() => {
    fetchInstitution();
    fetchInvites();
    fetchDomains();
    fetchPending();
  }, [institutionId]);

  const getToken = () => localStorage.getItem('admin_token');

  const fetchInstitution = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INSTITUTIONS.GET(institutionId)}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInstitution(data);
      }
    } catch (error) {
      console.error('Failed to fetch institution:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvites = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INSTITUTIONS.INVITES(institutionId)}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      if (res.ok) setInvites(await res.json());
    } catch (error) {
      console.error('Failed to fetch invites:', error);
    }
  };

  const fetchDomains = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INSTITUTIONS.DOMAINS(institutionId)}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      if (res.ok) setDomains(await res.json());
    } catch (error) {
      console.error('Failed to fetch domains:', error);
    }
  };

  const fetchPending = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INSTITUTIONS.PENDING(institutionId)}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      if (res.ok) setPending(await res.json());
    } catch (error) {
      console.error('Failed to fetch pending:', error);
    }
  };

  const handleCreateInvite = async (email: string, role: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INSTITUTIONS.CREATE_INVITE(institutionId)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role, expiresInDays: 7 }),
      });

      if (res.ok) {
        setShowInviteModal(false);
        fetchInvites();
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

  const handleAddDomain = async (domain: string, autoApprove: boolean, defaultRole: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INSTITUTIONS.ADD_DOMAIN(institutionId)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain, autoApprove, defaultRole }),
      });

      if (res.ok) {
        setShowDomainModal(false);
        fetchDomains();
        alert('Domain added successfully!');
      } else {
        const error = await res.json();
        alert(`Failed: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to add domain:', error);
      alert('Failed to add domain');
    }
  };

  const handleProcessApproval = async (approvalId: string, approve: boolean, reason?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INSTITUTIONS.APPROVE(institutionId, approvalId)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approve, reason }),
      });

      if (res.ok) {
        fetchPending();
        alert(approve ? 'User approved!' : 'User rejected!');
      } else {
        const error = await res.json();
        alert(`Failed: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to process approval:', error);
      alert('Failed to process approval');
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm('Cancel this invite?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INSTITUTIONS.CANCEL_INVITE(institutionId, inviteId)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });

      if (res.ok) {
        fetchInvites();
        alert('Invite cancelled');
      }
    } catch (error) {
      console.error('Failed to cancel invite:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!institution) {
    return <div className="text-center py-12">Institution not found</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/institutions')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          ← Back to Institutions
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{institution.name}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {institution.type} • {institution.city}, {institution.state}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'members', label: 'Members & Invites', count: invites.length },
            { id: 'domains', label: 'Domains', count: domains.length },
            { id: 'pending', label: 'Pending Approvals', count: pending.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              {tab.label}
              <span className="bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'members' && (
          <MembersTab
            invites={invites}
            onCreateInvite={() => setShowInviteModal(true)}
            onCancelInvite={handleCancelInvite}
          />
        )}
        {activeTab === 'domains' && (
          <DomainsTab
            domains={domains}
            onAddDomain={() => setShowDomainModal(true)}
          />
        )}
        {activeTab === 'pending' && (
          <PendingTab
            pending={pending}
            onProcess={handleProcessApproval}
          />
        )}
      </div>

      {/* Modals */}
      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onSubmit={handleCreateInvite}
        />
      )}
      {showDomainModal && (
        <DomainModal
          onClose={() => setShowDomainModal(false)}
          onSubmit={handleAddDomain}
        />
      )}
    </div>
  );
}

// Members Tab Component
function MembersTab({ invites, onCreateInvite, onCancelInvite }: any) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Invitations</h2>
        <button
          onClick={onCreateInvite}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
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
              invites.map((invite: Invite) => (
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
                        onClick={() => onCancelInvite(invite.id)}
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
    </div>
  );
}

// Domains Tab Component
function DomainsTab({ domains, onAddDomain }: any) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Email Domains</h2>
        <button
          onClick={onAddDomain}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Add Domain
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Domain</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auto-Approve</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Default Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {domains.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                  No domains configured.
                </td>
              </tr>
            ) : (
              domains.map((domain: Domain) => (
                <tr key={domain.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{domain.domain}</td>
                  <td className="px-6 py-4 text-sm">
                    {domain.autoApprove ? (
                      <span className="text-green-600">✓ Yes</span>
                    ) : (
                      <span className="text-yellow-600">Manual</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold text-blue-800">
                      {domain.defaultRole}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Pending Tab Component
function PendingTab({ pending, onProcess }: any) {
  const [rejectReason, setRejectReason] = useState<{ [key: string]: string }>({});

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">Pending Approvals</h2>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {pending.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            No pending approvals.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pending.map((approval: PendingApproval) => (
              <div key={approval.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{approval.name}</h3>
                    <p className="text-sm text-gray-500">{approval.email}</p>
                    <div className="mt-2 flex gap-2">
                      <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold text-blue-800">
                        {approval.requestedRole}
                      </span>
                      <span className="text-xs text-gray-500">
                        Requested {new Date(approval.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => onProcess(approval.id, true)}
                      className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-500"
                    >
                      Approve
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => {
                          const reason = prompt('Rejection reason (optional):');
                          if (reason !== null) {
                            onProcess(approval.id, false, reason);
                          }
                        }}
                        className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Invite Modal Component
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

// Domain Modal Component
function DomainModal({ onClose, onSubmit }: any) {
  const [domain, setDomain] = useState('@');
  const [autoApprove, setAutoApprove] = useState(false);
  const [defaultRole, setDefaultRole] = useState('STUDENT');

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium mb-4">Add Email Domain</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Domain</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              placeholder="@school.edu"
            />
            <p className="mt-1 text-xs text-gray-500">Include @ symbol (e.g., @school.edu)</p>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Auto-approve registrations</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Default Role</label>
            <select
              value={defaultRole}
              onChange={(e) => setDefaultRole(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            >
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
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
            onClick={() => onSubmit(domain, autoApprove, defaultRole)}
            disabled={!domain || domain === '@'}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            Add Domain
          </button>
        </div>
      </div>
    </div>
  );
}
