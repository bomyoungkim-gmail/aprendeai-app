'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Plus, Edit2, Trash2, CheckCircle, XCircle, Shield } from 'lucide-react';
import api from '@/lib/api';

interface Config {
  id: string;
  key: string;
  value: string;
  type: string;
  category: string;
  environment?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'app' | 'providers'>('app');
  const [envFilter, setEnvFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Config | null>(null);

  const queryClient = useQueryClient();

  const category = activeTab === 'app' ? 'app' : 'provider';

  // Fetch configs
  const { data: configs, isLoading } = useQuery({
    queryKey: ['configs', category, envFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('category', category);
      if (envFilter) params.append('environment', envFilter);

      const response = await api.get(`/admin/config?${params.toString()}`);
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/config/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
    },
  });

  const handleDelete = (config: Config) => {
    if (confirm(`Delete config "${config.key}"?`)) {
      deleteMutation.mutate(config.id);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <Settings className="h-7 w-7 text-indigo-600" />
          Application Settings
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage app configurations and provider integrations
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('app')}
            className={`${
              activeTab === 'app'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            App Settings
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`${
              activeTab === 'providers'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Provider Integrations
          </button>
        </nav>
      </div>

      {/* Filters & Actions */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">Environment:</label>
          <select
            value={envFilter}
            onChange={(e) => setEnvFilter(e.target.value)}
            className="inline-block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All</option>
            <option value="DEV">Development</option>
            <option value="STAGING">Staging</option>
            <option value="PROD">Production</option>
          </select>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Config
        </button>
      </div>

      {/* Config List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {configs?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No configurations found. Click "Add Config" to create one.</p>
            </div>
          ) : (
            configs?.map((config: Config) => (
              <div key={config.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900 font-mono">{config.key}</h3>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          config.environment === 'PROD'
                            ? 'bg-red-100 text-red-800'
                            : config.environment === 'STAGING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : config.environment === 'DEV'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {config.environment || 'ALL'}
                      </span>
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                        {config.type}
                      </span>
                    </div>

                    {config.description && (
                      <p className="text-sm text-gray-600 mb-2">{config.description}</p>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Value:</span>
                      {config.type === 'SECRET_REF' ? (
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {config.value}
                        </span>
                      ) : config.type === 'BOOLEAN' ? (
                        config.value === 'true' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )
                      ) : (
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                          {config.value}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 text-xs text-gray-400">
                      Updated: {new Date(config.updatedAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingConfig(config)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                      title="Edit"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(config)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <ConfigModal
          category={category}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['configs'] });
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Edit Modal */}
      {editingConfig && (
        <ConfigModal
          config={editingConfig}
          category={category}
          onClose={() => setEditingConfig(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['configs'] });
            setEditingConfig(null);
          }}
        />
      )}
    </div>
  );
}

// Config Create/Edit Modal
function ConfigModal({
  config,
  category,
  onClose,
  onSuccess,
}: {
  config?: Config;
  category: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!config;
  const [formData, setFormData] = useState({
    key: config?.key || '',
    value: config?.value || '',
    type: config?.type || 'STRING',
    category: config?.category || category,
    environment: config?.environment || '',
    description: config?.description || '',
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (isEdit) {
        await api.put(`/admin/config/${config.id}`, {
          value: data.value,
          description: data.description,
        });
      } else {
        await api.post('/admin/config', data);
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
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                {isEdit ? 'Edit' : 'Create'} Configuration
              </h3>
            </div>

            <div className="space-y-4">
              {!isEdit && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Key <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.key}
                      onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                      placeholder="openai.api_key"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="STRING">String</option>
                      <option value="NUMBER">Number</option>
                      <option value="BOOLEAN">Boolean</option>
                      <option value="JSON">JSON</option>
                      <option value="SECRET_REF">Secret Reference</option>
                    </select>
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
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder={
                    formData.type === 'SECRET_REF' ? 'Secret ID' : 'Config value'
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                />
                {formData.type === 'SECRET_REF' && (
                  <p className="mt-1 text-xs text-gray-500">
                    Enter the ID of a secret from the Secrets page
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What this config controls..."
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
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
