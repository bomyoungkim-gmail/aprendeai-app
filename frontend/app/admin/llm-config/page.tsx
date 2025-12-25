'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Toast, useToast } from '@/components/ui/Toast';
import { Loader2, Save, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LLMConfig {
  id: string;
  key: string;
  value: string;
  category: string;
  description?: string;
  metadata?: {
    alternatives?: string[];
    costTier?: string;
  };
}

interface EditingConfig {
  id: string;
  value: string;
}

export default function LLMConfigPage() {
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<EditingConfig | null>(null);

  // Fetch LLM configs
  const { data: configs, isLoading, error } = useQuery<LLMConfig[]>({
    queryKey: ['admin', 'llm-configs'],
    queryFn: async () => {
      const res = await api.get<LLMConfig[]>('/admin/config', {
        params: { category: 'llm' },
      });
      return res.data;
    },
  });

  // Update config mutation
  const updateMutation = useMutation({
    mutationFn: async (data: EditingConfig) => {
      return api.put(`/admin/config/${data.id}`, {
        value: data.value,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'llm-configs'] });
      success('Modelo atualizado com sucesso!');
      setEditing(null);
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Erro ao atualizar modelo');
    },
  });

  // Clear cache mutation
  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      return api.post('/admin/config/llm/cache/clear');
    },
    onSuccess: () => {
      success('Cache limpo! Novas configurações aplicarão imediatamente.');
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Erro ao limpar cache');
    },
  });

  const handleEdit = (config: LLMConfig) => {
    setEditing({ id: config.id, value: config.value });
  };

  const handleSave = () => {
    if (editing) {
      updateMutation.mutate(editing);
    }
  };

  const handleCancel = () => {
    setEditing(null);
  };

  const getProviderName = (key: string) => {
    if (key.includes('openai')) return '🤖 OpenAI';
    if (key.includes('gemini')) return '✨ Google Gemini';
    if (key.includes('anthropic')) return '🧠 Anthropic Claude';
    return key;
  };

  const getCostBadge = (tier?: string) => {
    const badges = {
      free: 'bg-green-100 text-green-800 border-green-300',
      balanced: 'bg-blue-100 text-blue-800 border-blue-300',
      premium: 'bg-purple-100 text-purple-800 border-purple-300',
    };
    const colors = tier ? badges[tier as keyof typeof badges] : 'bg-gray-100 text-gray-800 border-gray-300';
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${colors}`}>
        {tier || 'unknown'}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar configurações</h2>
          <p className="text-gray-600">Verifique se você tem permissão de administrador.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <Toast />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🔧 Configuração de Modelos LLM</h1>
            <p className="text-gray-600">
              Configure os modelos de IA usados pela aplicação. Mudanças aplicam automaticamente em até 5 minutos.
            </p>
          </div>
          <button
            onClick={() => clearCacheMutation.mutate()}
            disabled={clearCacheMutation.isPending}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {clearCacheMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Limpar Cache
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Como funciona:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>O sistema tenta os providers na ordem: Gemini → Anthropic → OpenAI</li>
                <li>Se um provider falhar (quota/erro), tenta o próximo automaticamente</li>
                <li>Configurações têm cache de 5 minutos para performance</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Config Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modelo Atual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Custo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {configs?.map((config) => {
                const isEditing = editing?.id === config.id;
                
                return (
                  <tr key={config.id} className={isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {getProviderName(config.key)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editing.value}
                            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="ex: gpt-4-turbo"
                          />
                        </div>
                      ) : (
                        <div>
                          <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                            {config.value}
                          </span>
                          {config.metadata?.alternatives && (
                            <div className="mt-1 text-xs text-gray-500">
                              Alternativas: {config.metadata.alternatives.join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getCostBadge(config.metadata?.costTier)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updateMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-1" />
                                Salvar
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleCancel}
                            disabled={updateMutation.isPending}
                            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(config)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-gray-700">
              <p className="font-semibold mb-1">Modelos Recomendados:</p>
              <ul className="space-y-1">
                <li><strong>OpenAI:</strong> gpt-4, gpt-4-turbo, gpt-3.5-turbo</li>
                <li><strong>Gemini:</strong> gemini-1.5-flash, gemini-1.5-pro</li>
                <li><strong>Anthropic:</strong> claude-3-sonnet-20240229, claude-3-opus-20240229</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
