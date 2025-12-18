'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Key, Plus, Eye, EyeOff, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';

interface Secret {
  id: string;
  key: string;
  name: string;
  provider?: string;
  environment?: string;
  maskedValue?: string;
  lastRotatedAt?: string;
  createdAt: string;
}

export default function SecretsPage() {
  const [providerFilter, setProviderFilter] = useState('');
  const [envFilter, setEnvFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const queryClient = useQueryClient();

  const { data: secrets, isLoading } = useQuery({
    queryKey: ['secrets', providerFilter, envFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (providerFilter) params.append('provider', providerFilter);
      if (envFilter) params.append('environment', envFilter);

      const response = await api.get(`/admin/secrets?${params.toString()}`);
      return response.data;
    },
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Key className="h-7 w-7 text-indigo-600" />
            Encrypted Secrets
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage encrypted API keys, tokens, and sensitive configuration. All values are encrypted with AES-256-GCM.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Secret
          </button>
        </div>
      </div>

      {/* Alert */}
      <div className="mt-6 rounded-md bg-yellow-50 p-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">ADMIN Only</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>All secret views are logged. Never share plaintext values outside secure channels.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Provider</label>
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All Providers</option>
            <option value="openai">OpenAI</option>
            <option value="kci">KCI (Korean Papers)</option>
            <option value="aws">AWS</option>
            <option value="sentry">Sentry</option>
          </select>
        </div>

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
                        Key
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Name
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Provider
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Environment
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Last Rotated
                      </th>
                      <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {secrets?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-sm text-gray-500">
                          No secrets found. Click "Add Secret" to create one.
                        </td>
                      </tr>
                    ) : (
                      secrets?.map((secret: Secret) => (
                        <tr key={secret.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-mono font-medium text-gray-900 sm:pl-6">
                            {secret.key}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {secret.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {secret.provider ? (
                              <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">
                                {secret.provider}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {secret.environment ? (
                              <span
                                className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                  secret.environment === 'PROD'
                                    ? 'bg-red-100 text-red-800'
                                    : secret.environment === 'STAGING'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {secret.environment}
                              </span>
                            ) : (
                              <span className="text-gray-400">ALL</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {secret.lastRotatedAt
                              ? new Date(secret.lastRotatedAt).toLocaleDateString()
                              : 'Never'}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                            <button
                              onClick={() => {
                                setSelectedSecret(secret);
                                setShowViewModal(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="View / Edit"
                            >
                              <Eye className="h-5 w-5 inline" />
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
        <CreateSecretModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['secrets'] });
            setShowCreateModal(false);
          }}
        />
      )}

      {/* View/Edit Modal */}
      {showViewModal && selectedSecret && (
        <ViewSecretModal
          secret={selectedSecret}
          onClose={() => {
            setShowViewModal(false);
            setSelectedSecret(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['secrets'] });
            setShowViewModal(false);
            setSelectedSecret(null);
          }}
        />
      )}
    </div>
  );
}

// Create Secret Modal
function CreateSecretModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    value: '',
    provider: '',
    environment: '',
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/admin/secrets', data);
      return response.data;
    },
    onSuccess,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <form onSubmit={handleSubmit}>
            <div>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
                <Key className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Create Encrypted Secret</h3>
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
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="openai_api_key"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                />
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
                  placeholder="OpenAI API Key"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Secret Value <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="sk-..."
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                />
                <p className="mt-1 text-xs text-gray-500">Will be encrypted with AES-256-GCM</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Provider</label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="">None</option>
                  <option value="openai">OpenAI</option>
                  <option value="kci">KCI</option>
                  <option value="aws">AWS</option>
                  <option value="sentry">Sentry</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Environment</label>
                <select
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="">All</option>
                  <option value="DEV">Development</option>
                  <option value="STAGING">Staging</option>
                  <option value="PROD">Production</option>
                </select>
              </div>
            </div>

            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Secret'}
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

// View/Edit Secret Modal
function ViewSecretModal({
  secret,
  onClose,
  onSuccess,
}: {
  secret: Secret;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [showValue, setShowValue] = useState(false);
  const [decryptedValue, setDecryptedValue] = useState('');
  const [rotateReason, setRotateReason] = useState('');
  const [newValue, setNewValue] = useState('');

  const { data: secretDetail } = useQuery({
    queryKey: ['secret', secret.id, showValue],
    queryFn: async () => {
      if (!showValue) return null;
      const response = await api.get(`/admin/secrets/${secret.id}`);
      setDecryptedValue(response.data.value);
      return response.data;
    },
    enabled: showValue,
  });

  const rotateMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/admin/secrets/${secret.id}`, {
        value: newValue,
        reason: rotateReason,
      });
    },
    onSuccess,
  });

  const deleteMutation = useMutation({
    mutationFn: async (reason: string) => {
      await api.delete(`/admin/secrets/${secret.id}`, {
        data: { reason },
      });
    },
    onSuccess,
  });

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Secret: {secret.name}</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Key</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{secret.key}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Provider</label>
                  <p className="mt-1 text-sm text-gray-900">{secret.provider || 'None'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Environment</label>
                  <p className="mt-1 text-sm text-gray-900">{secret.environment || 'All'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Rotated</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {secret.lastRotatedAt
                      ? new Date(secret.lastRotatedAt).toLocaleString()
                      : 'Never'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secret Value</label>
                {!showValue ? (
                  <button
                    onClick={() => setShowValue(true)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Reveal (will be audited)
                  </button>
                ) : (
                  <div className="relative">
                    <textarea
                      readOnly
                      value={decryptedValue}
                      rows={3}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono bg-gray-50"
                    />
                    <button
                      onClick={() => {
                        setShowValue(false);
                        setDecryptedValue('');
                      }}
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                    >
                      <EyeOff className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rotate Secret
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Value</label>
                    <textarea
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      rows={2}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                      placeholder="Enter new secret value..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Reason for Rotation
                    </label>
                    <input
                      type="text"
                      value={rotateReason}
                      onChange={(e) => setRotateReason(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="e.g., Key leaked, scheduled rotation..."
                    />
                  </div>

                  <button
                    onClick={() => rotateMutation.mutate()}
                    disabled={!newValue || !rotateReason || rotateMutation.isPending}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                  >
                    {rotateMutation.isPending ? 'Rotating...' : 'Rotate Secret'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => {
                const reason = prompt('Reason for deletion (required):');
                if (reason) deleteMutation.mutate(reason);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Secret
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
