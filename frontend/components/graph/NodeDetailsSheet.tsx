'use client';

import React, { useState } from 'react';
import { X, TrendingUp, AlertCircle, CheckCircle, Circle, Loader2, FileText, Plus } from 'lucide-react';
import type { GraphNode } from '@/hooks/graph/use-learner-graph';
import { useNodeNotes } from '@/hooks/pkm/use-node-notes';
import { toast } from 'sonner';
import { PolicyAwareFeature } from '@/components/shared/PolicyAwareFeature';
import type { DecisionPolicyV1 } from '@/types/session';

interface NodeDetailsSheetProps {
  node: GraphNode | null;
  onClose: () => void;
  policy?: DecisionPolicyV1;
  userRole?: 'LEARNER' | 'EDUCATOR' | 'ADMIN' | 'PARENT';
}

const STATUS_ICONS = {
  MASTERED: CheckCircle,
  DOUBT: AlertCircle,
  VISITED: Circle,
  UNVISITED: Circle,
};

const STATUS_COLORS = {
  MASTERED: 'text-green-600 bg-green-50 border-green-200',
  DOUBT: 'text-red-600 bg-red-50 border-red-200',
  VISITED: 'text-blue-600 bg-blue-50 border-blue-200',
  UNVISITED: 'text-gray-600 bg-gray-50 border-gray-200',
};

export function NodeDetailsSheet({ node, onClose, policy, userRole }: NodeDetailsSheetProps) {
  const { notes, isLoading, createNote } = useNodeNotes(node?.id);
  const [isCreating, setIsCreating] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteBody, setNewNoteBody] = useState('');

  if (!node) return null;

  const StatusIcon = STATUS_ICONS[node.status];

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle || !newNoteBody) return;

    try {
      await createNote.mutateAsync({
        title: newNoteTitle,
        bodyMd: newNoteBody,
        topicNodeId: node.id,
      });
      setIsCreating(false);
      setNewNoteTitle('');
      setNewNoteBody('');
      toast.success('Nota criada com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar nota');
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {node.label}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${STATUS_COLORS[node.status]}`}>
                <StatusIcon className="h-3 w-3" />
                {node.status === 'MASTERED' && 'Dominado'}
                {node.status === 'DOUBT' && 'Dúvida'}
                {node.status === 'VISITED' && 'Visitado'}
                {node.status === 'UNVISITED' && 'Não visitado'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Confiança: {Math.round(node.confidence * 100)}%
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Metadata */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Informações
            </h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Fonte</dt>
                <dd className="text-gray-900 dark:text-white font-medium">
                  {node.source === 'DETERMINISTIC' && 'Estrutura do Conteúdo'}
                  {node.source === 'USER' && 'Criado por Você'}
                  {node.source === 'LLM' && 'Sugerido por IA'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Criado em</dt>
                <dd className="text-gray-900 dark:text-white">
                  {new Date(node.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </dd>
              </div>
              {node.annotationCount !== undefined && node.annotationCount > 0 && (
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Anotações</dt>
                  <dd className="text-gray-900 dark:text-white">
                    {node.annotationCount} {node.annotationCount === 1 ? 'nota' : 'notas'}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* History */}
          {node.history && node.history.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Histórico de Progresso
              </h3>
              <div className="space-y-2">
                {node.history.map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded"
                  >
                    <span className="text-gray-600 dark:text-gray-400">
                      {new Date(entry.timestamp).toLocaleDateString('pt-BR')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded ${STATUS_COLORS[entry.status]}`}>
                        {entry.status}
                      </span>
                      <span className="text-gray-500">
                        {Math.round(entry.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Context */}
          {node.navigationContext && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Localização
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {node.navigationContext.pageNumber && (
                  <p>Página {node.navigationContext.pageNumber}</p>
                )}
                {node.navigationContext.quote && (
                  <p className="mt-2 italic text-xs">
                    "{node.navigationContext.quote.substring(0, 100)}..."
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Collaborative Notes */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Anotações Colaborativas
              </h3>
              <PolicyAwareFeature
                featureGate="pkm"
                featureName="Notas PKM"
                policy={policy}
                userRole={userRole}
                renderDisabled={() => (
                  <span className="text-xs text-gray-400 italic">PKM desabilitado</span>
                )}
              >
                <button
                  onClick={() => setIsCreating(true)}
                  className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Plus className="h-3 w-3" />
                  Nova Nota
                </button>
              </PolicyAwareFeature>
            </div>

            <PolicyAwareFeature
              featureGate="pkm"
              policy={policy}
              userRole={userRole}
              renderDisabled={() => null}
            >
              {isCreating && (
                <form onSubmit={handleCreateNote} className="mb-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg space-y-2">
                <input
                  type="text"
                  placeholder="Título"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="w-full text-sm rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                  autoFocus
                />
                <textarea
                  placeholder="Escreva sua nota..."
                  value={newNoteBody}
                  onChange={(e) => setNewNoteBody(e.target.value)}
                  className="w-full text-sm rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 min-h-[60px]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createNote.isPending || !newNoteTitle || !newNoteBody}
                    className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createNote.isPending ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
                </form>
              )}
            </PolicyAwareFeature>

            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : notes && notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                      {note.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
                      {note.bodyMd}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                      <span>{new Date(note.createdAt).toLocaleDateString('pt-BR')}</span>
                      <span className="capitalize">{note.status.toLowerCase()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !isCreating && (
                <p className="text-xs text-center text-gray-500 py-4 italic">
                  Nenhuma anotação encontrada para este tópico.
                </p>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}
