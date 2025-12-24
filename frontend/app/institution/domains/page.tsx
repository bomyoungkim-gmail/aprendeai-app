'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/config/api';

interface Domain {
  id: string;
  domain: string;
  autoApprove: boolean;
  defaultRole: string;
}

interface InstitutionData {
  id: string;
  name: string;
}

export default function DomainsPage() {
  const [institution, setInstitution] = useState<InstitutionData | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDomainModal, setShowDomainModal] = useState(false);

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

        // Fetch domains
        const domainsRes = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INSTITUTIONS.DOMAINS(instData.id)}`, {
          headers: { 'Authorization': `Bearer ${getToken()}` },
        });
        if (domainsRes.ok) {
          setDomains(await domainsRes.json());
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async (domain: string, autoApprove: boolean, defaultRole: string) => {
    if (!institution) return;

    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INSTITUTIONS.ADD_DOMAIN(institution.id)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain, autoApprove, defaultRole }),
      });

      if (res.ok) {
        setShowDomainModal(false);
        fetchData();
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

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Email Domains</h1>
        <button
          onClick={() => setShowDomainModal(true)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
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
              domains.map((domain) => (
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

      {showDomainModal && (
        <DomainModal
          onClose={() => setShowDomainModal(false)}
          onSubmit={handleAddDomain}
        />
      )}
    </div>
  );
}

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
