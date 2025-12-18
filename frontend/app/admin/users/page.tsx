'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Eye, Ban, UserCog } from 'lucide-react';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
  institution?: {
    id: string;
    name: string;
  };
}

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

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all users in the platform including their name, email, role, and status.
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
          <option value="ADMIN">Admin</option>
          <option value="SUPPORT">Support</option>
          <option value="OPS">OPS</option>
          <option value="INSTITUTION_ADMIN">Institution Admin</option>
          <option value="TEACHER">Teacher</option>
          <option value="STUDENT">Student</option>
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
                        Role
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
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">
                            {user.role}
                          </span>
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
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            <Eye className="h-5 w-5 inline" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowImpersonateModal(true);
                            }}
                            className="text-orange-600 hover:text-orange-900"
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
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * pagination.limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {[...Array(pagination.totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      page === i + 1
                        ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
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

// User Detail Modal Component
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
  const [reason, setReason] = useState('');

  const handleStatusUpdate = async () => {
    try {
      await api.put(`/admin/users/${user.id}/status`, { status, reason });
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    }
  };

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">User Details</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{user.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{user.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="mt-1 text-sm text-gray-900">{user.role}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="DELETED">Deleted</option>
                </select>
              </div>

              {status !== user.status && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Reason for change (required)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter reason for status change..."
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="button"
              onClick={handleStatusUpdate}
              disabled={status === user.status || !reason}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Impersonate Modal Component
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
      alert('Failed to impersonate user');
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
              <div className="mt-2">
                <p className="text-sm text-gray-500">Email: {user.email}</p>
                <p className="text-sm text-gray-500">Role: {user.role}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Reason (required) <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                placeholder="Why are you impersonating this user?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
              >
                <option value={5}>5 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>

            <div className="rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>All actions will be logged and attributed to your account.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="button"
              onClick={handleImpersonate}
              disabled={!reason}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
            >
              Start Impersonation
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
