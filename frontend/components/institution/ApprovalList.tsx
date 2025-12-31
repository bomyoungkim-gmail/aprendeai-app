'use client';

import React from 'react';
import { usePendingApprovals, useProcessApproval } from '@/hooks/content/use-institution';
import { Check, X, User, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface ApprovalListProps {
  institutionId: string;
}

export function ApprovalList({ institutionId }: ApprovalListProps) {
  const { data: approvals, isLoading, error } = usePendingApprovals(institutionId);
  const processApproval = useProcessApproval(institutionId);

  const handleAction = async (approvalId: string, approve: boolean) => {
    try {
      await processApproval.mutateAsync({
        approvalId,
        dto: { approve }
      });
      toast.success(approve ? 'Professor verificado com sucesso!' : 'Solicitação rejeitada.');
    } catch (err) {
      toast.error('Erro ao processar solicitação.');
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !approvals) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
        Erro ao carregar solicitações pendentes.
      </div>
    );
  }

  if (approvals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
          <User className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tudo em ordem</h3>
        <p className="text-gray-500 text-center max-w-xs mt-1">Nenhuma solicitação de verificação pendente no momento.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/30">
        <h3 className="font-bold text-gray-900 dark:text-white">Professores Aguardando Verificação</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-gray-900/50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Professor</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Solicitado em</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {approvals.map((approval) => (
              <tr key={approval.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900 dark:text-white">{approval.user.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{approval.user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-3 w-3 mr-1.5 opacity-50" />
                    {new Date(approval.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleAction(approval.id, true)}
                      disabled={processApproval.isPending}
                      className="inline-flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleAction(approval.id, false)}
                      disabled={processApproval.isPending}
                      className="inline-flex items-center px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Rejeitar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
