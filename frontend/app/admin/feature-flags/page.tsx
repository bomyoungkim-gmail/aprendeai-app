'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flag, Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '@/lib/api';

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  environment?: string;
  scopeType?: string;
  scopeId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function FeatureFlagsPage() {
  const [envFilter, setEnvFilter] = useState('');
  const [enabledFilter, setEnabledFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);

  const queryClient = useQueryClient();

  const { data: flags, isLoading } = useQuery({
    queryKey: ['feature-flags', envFilter, enabledFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (envFilter) params.append('environment', envFilter);
      if (enabledFilter) params.append('enabled', enabledFilter);

      const response = await api.get(`/admin/feature-flags?${params.toString()}`);
      return response.data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      await api.post(`/admin/feature-flags/${id}/toggle`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await api.delete(`/admin/feature-flags/${id}`, { data: { reason } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    },
  });

  const handleToggle = (flag: FeatureFlag) => {
    const newState = !flag.enabled;
    const confirmed = confirm(
      `${newState ? 'Enable' : 'Disable'} feature flag "${flag.name}"?\n\nThis will take effect immediately.`
    );
    if (confirmed) {
      toggleMutation.mutate({ id: flag.id, enabled: newState });
    }
  };

  const handleDelete = (flag: FeatureFlag) => {
    const reason = prompt('Reason for deletion (required):');
    if (reason) {
      deleteMutation.mutate({ id: flag.id, reason });
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Flag className="h-7 w-7 text-indigo-600" />
            Feature Flags
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Runtime feature toggles without code deployments. Changes take effect immediately.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Flag
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Environment</label>
          <select
            value={envFilter}
            onChange={(e) => setEnvFilter(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All Environments</option>
            <option value="DEV">Development</option>
            <option value="STAGING">Staging</option>
            <option value="PROD">Production</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={enabledFilter}
            onChange={(e) => setEnabledFilter(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All Statuses</option>
            <option value="true">Enabled Only</option>
            <option value="false">Disabled Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              {isLoading ? (
                <div className="text-center py-12 bg-white">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Flag
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Description
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Environment
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Scope
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Enabled
                      </th>
                      <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {flags?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-sm text-gray-500">
                          No feature flags found. Click "Create Flag" to add one.
                        </td>
                      </tr>
                    ) : (
                      flags?.map((flag: FeatureFlag) => (
                        <tr key={flag.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                            <div className="flex flex-col">
                              <div className="font-medium text-gray-900">{flag.name}</div>
                              <div className="text-sm text-gray-500 font-mono">{flag.key}</div>
                            </div>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            {flag.description || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {flag.environment ? (
                              <span
                                className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                  flag.environment === 'PROD'
                                    ? 'bg-red-100 text-red-800'
                                    : flag.environment === 'STAGING'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {flag.environment}
                              </span>
                            ) : (
                              <span className="text-gray-400">ALL</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {flag.scopeType ? (
                              <span className="inline-flex rounded-full bg-purple-100 px-2 text-xs font-semibold leading-5 text-purple-800">
                                {flag.scopeType}
                              </span>
                            ) : (
                              <span className="text-gray-400">GLOBAL</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <button
                              onClick={() => handleToggle(flag)}
                              className="flex items-center gap-2"
                            >
                              {flag.enabled ? (
                                <ToggleRight className="h-8 w-8 text-green-500" />
                              ) : (
                                <ToggleLeft className="h-8 w-8 text-gray-400" />
                              )}
                              <span
                                className={`text-sm font-medium ${
                                  flag.enabled ? 'text-green-600' : 'text-gray-400'
                                }`}
                              >
                                {flag.enabled ? 'ON' : 'OFF'}
                              </span>
                            </button>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                            <button
                              onClick={() => setEditingFlag(flag)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit"
                            >
                              <Edit className="h-5 w-5 inline" />
                            </button>
                            <button
                              onClick={() => handleDelete(flag)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5 inline" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <FlagModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Edit Modal */}
      {editingFlag && (
        <FlagModal
          flag={editingFlag}
          onClose={() => setEditingFlag(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
            setEditingFlag(null);
          }}
        />
      )}
    </div>
  );
}

// Flag Create/Edit Modal
function FlagModal({
  flag,
  onClose,
  onSuccess,
}: {
  flag?: FeatureFlag;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!flag;
  const [formData, setFormData] = useState({
    key: flag?.key || '',
    name: flag?.name || '',
    description: flag?.description || '',
    enabled: flag?.enabled ?? false,
    environment: flag?.environment || '',
    scopeType: flag?.scopeType || '',
    scopeId: flag?.scopeId || '',
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (isEdit) {
        await api.put(`/admin/feature-flags/${flag.id}`, data);
      } else {
        await api.post('/admin/feature-flags', data);
      }
    },
    onSuccess,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <form onSubmit={handleSubmit}>
            <div>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
                <Flag className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {isEdit ? 'Edit' : 'Create'} Feature Flag
                </h3>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={isEdit}
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="enable_ai_translation"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono disabled:bg-gray-100"
                />
                <p className="mt-1 text-xs text-gray-500">Lowercase with underscores only</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="AI Translation"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What this flag controls..."
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
                  Enabled (feature is ON)
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Environment</label>
                <select
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="">All Environments</option>
                  <option value="DEV">Development</option>
                  <option value="STAGING">Staging</option>
                  <option value="PROD">Production</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Scope</label>
                <select
                  value={formData.scopeType}
                  onChange={(e) => {
                    setFormData({ ...formData, scopeType: e.target.value, scopeId: '' });
                  }}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="">Global (all users)</option>
                  <option value="INSTITUTION">Institution-specific</option>
                  <option value="USER">User-specific</option>
                </select>
              </div>

              {formData.scopeType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {formData.scopeType === 'INSTITUTION' ? 'Institution' : 'User'} ID
                  </label>
                  <input
                    type="text"
                    value={formData.scopeId}
                    onChange={(e) => setFormData({ ...formData, scopeId: e.target.value })}
                    placeholder="Enter ID..."
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                  />
                </div>
              )}
            </div>

            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
              >
                {mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
