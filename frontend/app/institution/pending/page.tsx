'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/config/api';

interface PendingApproval {
  id: string;
  email: string;
  name: string;
  requestedRole: string;
  createdAt: string;
  status: string;
}

interface InstitutionData {
  id: string;
  name: string;
}

export default function PendingApprovalsPage() {
  const [institution, setInstitution] = useState<InstitutionData | null>(null);
  const [pending, setPending] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);

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

        // Fetch pending approvals
        const pendingRes = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INSTITUTIONS.PENDING(instData.id)}`, {
          headers: { 'Authorization': `Bearer ${getToken()}` },
        });
        if (pendingRes.ok) {
          setPending(await pendingRes.json());
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessApproval = async (approvalId: string, approve: boolean, reason?: string) => {
    if (!institution) return;

    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INSTITUTIONS.APPROVE(institution.id, approvalId)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approve, reason }),
      });

      if (res.ok) {
        fetchData();
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

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pending Approvals</h1>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {pending.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            No pending approvals.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pending.map((approval) => (
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
                      onClick={() => handleProcessApproval(approval.id, true)}
                      className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-500"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Rejection reason (optional):');
                        if (reason !== null) {
                          handleProcessApproval(approval.id, false, reason);
                        }
                      }}
                      className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500"
                    >
                      Reject
                    </button>
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
