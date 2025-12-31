'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Eye, Ban, UserCog, Trash2, Edit2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  
  // Legacy role (keep for backward compatibility)
  role?: string;
  
  // New dual-role structure
  systemRole?: 'ADMIN' | 'SUPPORT' | 'OPS' | null;
  contextRole: 'OWNER' | 'INSTITUTION_EDUCATION_ADMIN' | 'TEACHER' | 'STUDENT' | 'INSTITUTION_ENTERPRISE_ADMIN' | 'EMPLOYEE';
  activeInstitutionId?: string | null;
  
  status: string;
  lastLoginAt: string | null;
  institution?: {
    id: string;
    name: string;
  };
}

const SYSTEM_ROLES = [
  { value: '', label: 'None (Regular User)' },
  { value: 'ADMIN', label: 'System Admin' },
  { value: 'SUPPORT', label: 'Support' },
  { value: 'OPS', label: 'Operations' },
];

const CONTEXT_ROLES = [
  { value: 'OWNER', label: 'Owner (Personal)' },
  { value: 'INSTITUTION_EDUCATION_ADMIN', label: 'Institution Admin' },
  { value: 'TEACHER', label: 'Teacher' },
  { value: 'STUDENT', label: 'Student' },
  { value: 'INSTITUTION_ENTERPRISE_ADMIN', label: 'Enterprise Admin' },
  { value: 'EMPLOYEE', label: 'Employee' },
];

// Combined roles for filtering (dual-role system)
const ALL_ROLES = [...SYSTEM_ROLES.map(r => r.value), ...CONTEXT_ROLES.map(r => r.value)];

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['users', search, statusFilter, roleFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('query', search);
      if (statusFilter) params.append('status', statusFilter);
      if (roleFilter) params.append('role', roleFilter);
      params.append('page', page.toString());
      params.append('limit', '25');

      const response = await api.get(`/admin/users?${params.toString()}`);
      return response.data;
    },
  });

  const users = data?.users || [];
  const pagination = data?.pagination;

  const handleDelete = async (user: User) => {
      const reason = window.prompt(`Are you sure you want to delete ${user.name}? This will set status to DELETED.\n\nPlease enter a reason:`);
      if (reason === null) return; // Cancelled
      if (!reason) {
          toast.error("Reason is required to delete a user.");
          return;
      }

      try {
          // Using status update to DELETED as logical delete
          await api.put(`/admin/users/${user.id}/status`, { status: "DELETED", reason });
          toast.success("User deleted (status set to DELETED)");
          refetch();
      } catch (error) {
          console.error("Delete failed", error);
          toast.error("Failed to delete user");
      }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage users, assign roles, and update status.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="DELETED">Deleted</option>
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">All Roles</option>
          {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Name
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Email
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Roles
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Last Login
                      </th>
                      <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {users.map((user: User) => (
                      <tr key={user.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {user.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          <div className="flex flex-col gap-1">
                            {user.systemRole && (
                              <span className="inline-flex rounded-full bg-orange-100 px-2 text-xs font-semibold leading-5 text-orange-800">
                                System: {user.systemRole}
                              </span>
                            )}
                            <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">
                              Context: {user.contextRole}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              user.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800'
                                : user.status === 'SUSPENDED'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleString()
                            : 'Never'}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="text-gray-600 hover:text-indigo-900"
                            title="Edit User"
                          >
                            <Edit2 className="h-5 w-5 inline" />
                          </button>
                          <button
                             onClick={() => handleDelete(user)}
                             className="text-gray-600 hover:text-red-900"
                             title="Delete User"
                          >
                             <Trash2 className="h-5 w-5 inline" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowImpersonateModal(true);
                            }}
                            className="text-orange-600 hover:text-orange-900"
                            title="Impersonate"
                          >
                            <UserCog className="h-5 w-5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow">
            <div className="flex-1 flex justify-between">
                <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    Previous
                </button>
                <div className="hidden sm:block">
                     <p className="text-sm text-gray-700 mt-2">
                         Page {page} of {pagination.totalPages}
                     </p>
                </div>
                <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= pagination.totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && !showImpersonateModal && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onRefresh={refetch}
        />
      )}

      {/* Impersonate Modal */}
      {showImpersonateModal && selectedUser && (
        <ImpersonateModal
          user={selectedUser}
          onClose={() => {
            setShowImpersonateModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}

function UserDetailModal({
  user,
  onClose,
  onRefresh,
}: {
  user: User;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [status, setStatus] = useState(user.status);
  const [systemRole, setSystemRole] = useState<string>(user.systemRole || '');
  const [contextRole, setContextRole] = useState(user.contextRole);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
        const promises = [];
        // Update Status if changed
        if (status !== user.status) {
            promises.push(api.put(`/admin/users/${user.id}/status`, { status, reason }));
        }
        
        // Update System Role if changed
        if (systemRole !== (user.systemRole || '')) {
            promises.push(api.put(`/admin/users/${user.id}/roles`, { 
                roles: [{ 
                    role: systemRole || null, 
                    scopeType: 'SYSTEM',
                    scopeId: null 
                }], 
                reason: reason 
            }));
        }
        
        // Update Context Role if changed
        if (contextRole !== user.contextRole) {
            promises.push(api.put(`/admin/users/${user.id}/roles`, { 
                roles: [{ 
                    role: contextRole, 
                    scopeType: 'CONTEXT',
                    scopeId: user.activeInstitutionId 
                }], 
                reason: reason 
            }));
        }

        await Promise.all(promises);
        toast.success("User updated successfully");
        onRefresh();
        onClose();
    } catch (error: any) {
        console.error("Failed to update user", error);
        toast.error("Failed to update user");
    } finally {
        setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Edit User</h3>
            {/* Read-only fields */}
            <div className="space-y-4 mb-4">
               <div><label className="text-sm font-medium text-gray-700">Name</label><p>{user.name}</p></div>
               <div><label className="text-sm font-medium text-gray-700">Email</label><p>{user.email}</p></div>
            </div>

            {/* Editable Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">System Role</label>
                <select
                  value={systemRole}
                  onChange={(e) => setSystemRole(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                >
                    {SYSTEM_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  System roles grant global admin privileges. Most users should have "None".
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Context Role</label>
                <select
                  value={contextRole}
                  onChange={(e) => setContextRole(e.target.value as any)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                >
                    {CONTEXT_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Context role determines permissions within institutions or families.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="DELETED">Deleted</option>
                </select>
              </div>

              {(status !== user.status || systemRole !== (user.systemRole || '') || contextRole !== user.contextRole) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Reason for change <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                    placeholder="Reason required..."
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="button"
              onClick={handleSave}
              disabled={(!status && !contextRole) || ((status !== user.status || systemRole !== (user.systemRole || '') || contextRole !== user.contextRole) && !reason) || saving}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImpersonateModal({
    user,
    onClose,
  }: {
    user: User;
    onClose: () => void;
  }) {
    const [reason, setReason] = useState('');
    const [duration, setDuration] = useState(15);
  
    const handleImpersonate = async () => {
      try {
        const response = await api.post(`/admin/users/${user.id}/impersonate`, {
          reason,
          durationMinutes: duration,
        });
        const { impersonationToken } = response.data;
  
        // Store token and redirect
        localStorage.setItem('impersonation_token', impersonationToken);
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('Failed to impersonate:', error);
        toast.error('Failed to impersonate user');
      }
    };
  
    return (
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
          <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
            <div>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
                <UserCog className="h-6 w-6 text-orange-600" />
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Impersonate User: {user.name}
                </h3>
              </div>
            </div>
            <div className="mt-4 space-y-4">
               <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason..." className="w-full border rounded p-2" />
               <select value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full border rounded p-2">
                   <option value={5}>5 min</option>
                   <option value={15}>15 min</option>
                   <option value={60}>1 hr</option>
               </select>
               <button onClick={handleImpersonate} disabled={!reason} className="w-full bg-orange-600 text-white rounded py-2 disabled:opacity-50">Start Impersonation</button>
               <button onClick={onClose} className="w-full border rounded py-2 mt-2">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
