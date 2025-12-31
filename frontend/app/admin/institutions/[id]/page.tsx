'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '@/lib/config/api';
import api from '@/lib/api';

type Tab = 'members' | 'domains' | 'pending' | 'sso';

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

interface SSOConfig {
  id?: string;
  provider: 'SAML' | 'OIDC' | 'GOOGLE' | 'MICROSOFT';
  issuer: string;
  entryPoint: string;
  cert?: string;
  clientId?: string;
  clientSecret?: string;
  roleMapping?: any;
  isEnabled: boolean;
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
  const [ssoConfig, setSSOConfig] = useState<SSOConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);

  useEffect(() => {
    fetchInstitution();
    fetchInvites();
    fetchDomains();
    fetchDomains();
    fetchPending();
    fetchSSO();
  }, [institutionId]);



  const fetchInstitution = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.INSTITUTIONS.GET(institutionId));
      setInstitution(res.data);
    } catch (error) {
      console.error('Failed to fetch institution:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvites = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.INSTITUTIONS.INVITES(institutionId));
      setInvites(res.data);
    } catch (error) {
      console.error('Failed to fetch invites:', error);
    }
  };

  const fetchDomains = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.INSTITUTIONS.DOMAINS(institutionId));
      setDomains(res.data);
    } catch (error) {
      console.error('Failed to fetch domains:', error);
    }
  };

  const fetchPending = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.INSTITUTIONS.PENDING(institutionId));
      setPending(res.data);
    } catch (error) {
      console.error('Failed to fetch pending:', error);
    }
  };

  const fetchSSO = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.INSTITUTIONS.SSO_GET(institutionId));
      setSSOConfig(res.data);
    } catch (error) {
      console.error('Failed to fetch SSO config:', error);
    }
  };

  const handleCreateInvite = async (email: string, role: string) => {
    try {
      const res = await api.post(API_ENDPOINTS.INSTITUTIONS.CREATE_INVITE(institutionId), { 
        email, 
        role, 
        expiresInDays: 7 
      });
      // Axios success is implied by lack of throw, check res.data?
      // Actually standard pattern is just await.
      
      setShowInviteModal(false);
      fetchInvites();
      alert('Invite sent successfully!');
    } catch (error: any) {
      console.error('Failed to create invite:', error);
      const msg = error.response?.data?.message || 'Unknown error';
      alert(`Failed: ${msg}`);
    }
  };

  const handleAddDomain = async (domain: string, autoApprove: boolean, defaultRole: string) => {
    try {
      await api.post(API_ENDPOINTS.INSTITUTIONS.ADD_DOMAIN(institutionId), { 
        domain, 
        autoApprove, 
        defaultRole 
      });

      setShowDomainModal(false);
      fetchDomains();
      alert('Domain added successfully!');
    } catch (error: any) {
      console.error('Failed to add domain:', error);
      const msg = error.response?.data?.message || 'Unknown error';
      alert(`Failed: ${msg}`);
    }
  };

  const handleProcessApproval = async (approvalId: string, approve: boolean, reason?: string) => {
    try {
      await api.post(API_ENDPOINTS.INSTITUTIONS.APPROVE(institutionId, approvalId), { 
        approve, 
        reason 
      });

      fetchPending();
      alert(approve ? 'User approved!' : 'User rejected!');
    } catch (error: any) {
      console.error('Failed to process approval:', error);
      const msg = error.response?.data?.message || 'Unknown error';
      alert(`Failed: ${msg}`);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm('Cancel this invite?')) return;

    try {
      await api.delete(API_ENDPOINTS.INSTITUTIONS.CANCEL_INVITE(institutionId, inviteId));
      fetchInvites();
      alert('Invite cancelled');
    } catch (error) {
      console.error('Failed to cancel invite:', error);
      alert('Failed to cancel invite');
    }
  };

  const handleSaveSSO = async (config: SSOConfig) => {
    try {
      const endpoint = ssoConfig?.id 
        ? API_ENDPOINTS.INSTITUTIONS.SSO_UPDATE(institutionId)
        : API_ENDPOINTS.INSTITUTIONS.SSO_CREATE(institutionId);
        
      const promise = ssoConfig?.id 
        ? api.patch(endpoint, config)
        : api.post(endpoint, config);

      const res = await promise;
      setSSOConfig(res.data);
      alert('SSO Configuration saved!');
    } catch (error: any) {
      console.error('Failed to save SSO config:', error);
      const msg = error.response?.data?.message || 'Unknown error';
      alert(`Failed: ${msg}`);
    }
  };

  const handleTestSSO = async () => {
    try {
      const res = await api.post(API_ENDPOINTS.INSTITUTIONS.SSO_TEST(institutionId));
      const data = res.data;
      alert(`Test Result: ${data.status} - ${data.message}`);
    } catch (error) {
      console.error('SSO Test failed:', error);
      alert('SSO Test failed to execute');
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
            { id: 'sso', label: 'SSO Configuration', count: ssoConfig ? 1 : 0 },
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
        {activeTab === 'sso' && (
          <SSOTab
            config={ssoConfig}
            onSave={handleSaveSSO}
            onTest={handleTestSSO}
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

// SSO Tab Component
function SSOTab({ config, onSave, onTest }: any) {
  const [formData, setFormData] = useState<SSOConfig>({
    provider: 'SAML',
    issuer: '',
    entryPoint: '',
    cert: '',
    isEnabled: false,
    ...config,
  });

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Single Sign-On (SSO) Configuration</h2>
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                name="isEnabled"
                className="sr-only"
                checked={formData.isEnabled}
                onChange={handleChange}
              />
              <div className={`block w-14 h-8 rounded-full ${formData.isEnabled ? 'bg-indigo-600' : 'bg-gray-400'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${formData.isEnabled ? 'transform translate-x-6' : ''}`}></div>
            </div>
            <div className="ml-3 text-gray-700 font-medium">
              {formData.isEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label className="block text-sm font-medium text-gray-700">Provider Type</label>
          <select
            name="provider"
            value={formData.provider}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
          >
            <option value="SAML">SAML 2.0</option>
            <option value="OIDC">OpenID Connect (OIDC)</option>
            <option value="GOOGLE">Google Workspace</option>
            <option value="MICROSOFT">Microsoft Entra ID (Azure AD)</option>
          </select>
        </div>

        <div className="sm:col-span-6 border-t border-gray-200 pt-6">
          {formData.provider === 'SAML' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <div className="rounded-md bg-blue-50 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1 md:flex md:justify-between">
                        <p className="text-sm text-blue-700">
                           Configure your Identity Provider (IdP) with this Entity ID (Audience): <strong>aprendeai-sso</strong>
                           <br/>
                           Assertion Consumer Service (ACS) URL: <strong>{process.env.NEXT_PUBLIC_API_URL || 'https://api.aprendeai.com'}/auth/sso/callback</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Entity ID (Issuer)</label>
                  <input
                    type="text"
                    name="issuer"
                    value={formData.issuer}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    placeholder="https://idp.example.com/metadata"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">SSO Entry Point (Sign-in URL)</label>
                  <input
                    type="text"
                    name="entryPoint"
                    value={formData.entryPoint}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    placeholder="https://idp.example.com/sso"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-700">X.509 Public Certificate</label>
                  <div className="mt-1">
                    <textarea
                      name="cert"
                      rows={5}
                      value={formData.cert}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border font-mono"
                      placeholder="-----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Copy the public certificate from your Identity Provider (PEM format).</p>
                </div>
              </div>
            </div>
          )}

          {(formData.provider === 'OIDC' || formData.provider === 'GOOGLE' || formData.provider === 'MICROSOFT') && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Client ID</label>
                  <input
                    type="text"
                    name="clientId"
                    value={formData.clientId || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Client Secret</label>
                  <input
                    type="password"
                    name="clientSecret"
                    value={formData.clientSecret || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-700">Issuer URL (Discovery Endpoint)</label>
                  <input
                    type="text"
                    name="issuer"
                    value={formData.issuer}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    placeholder="https://accounts.google.com"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3 pt-5 border-t border-gray-200">
        <button
          type="button"
          onClick={onTest}
          disabled={!formData.isEnabled}
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          Test Connection
        </button>
        <button
          type="button"
          onClick={() => onSave(formData)}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}
