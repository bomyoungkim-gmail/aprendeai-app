'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/config/api';
import { Loader2, Book, FileText, Trash2, Check } from 'lucide-react';
import Link from 'next/link';
import { cornellApi } from '@/lib/api/cornell';
import { useState } from 'react';

type Content = {
  id: string;
  title: string;
  type: string;
  originalLanguage: string;
  createdAt: string;
};

async function fetchContents() {
  const res = await api.get<Content[]>(API_ENDPOINTS.CONTENTS.MY_CONTENTS);
  // Defensive: ensure we always return an array
  return Array.isArray(res.data) ? res.data : [];
}

export default function LibraryPage() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  
  const { data: contents = [], isLoading, error } = useQuery({
    queryKey: ['contents'],
    queryFn: fetchContents,
  });

  const deleteMutation = useMutation({
    mutationFn: (contentId: string) => cornellApi.deleteContent(contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      setDeleteId(null);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (contentIds: string[]) => cornellApi.bulkDeleteContents(contentIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
    },
  });

  const handleDelete = (e: React.MouseEvent, contentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteId(contentId);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const toggleSelect = (e: React.MouseEvent, contentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(contentId)) {
      newSelected.delete(contentId);
    } else {
      newSelected.add(contentId);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(contents.map(c => c.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const confirmBulkDelete = () => {
    bulkDeleteMutation.mutate(Array.from(selectedIds));
  };

  const allSelected = selectedIds.size === contents.length && contents.length > 0;

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded">
        Erro ao carregar conteúdos. Tente novamente mais tarde.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Biblioteca</h1>
            <Link 
              href="/dashboard/library/upload"
              className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              title="Fazer Upload"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </Link>
          </div>
          {contents.length > 0 && (
            <div className="flex items-center space-x-3">
              <button
                onClick={allSelected ? deselectAll : selectAll}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {allSelected ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
              {selectedIds.size > 0 && (
                <button
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Trash2 size={16} />
                  <span>Excluir ({selectedIds.size})</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {contents.map((content) => {
            const isSelected = selectedIds.has(content.id);
            return (
              <div key={content.id} className="relative">
                <div className={`absolute top-3 left-3 z-10 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                  <button
                    onClick={(e) => toggleSelect(e, content.id)}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-blue-600'
                    }`}
                  >
                    {isSelected && <Check size={14} className="text-white" />}
                  </button>
                </div>
                <Link 
                  href={`/dashboard/library/${content.id}`}
                  className="block group"
                >
                  <div className={`h-full overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow transition-all hover:shadow-md border ${
                    isSelected ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-gray-100 dark:border-gray-700'
                  }`}>
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            {content.type === 'ARXIV' ? <Book size={20} /> : <FileText size={20} />}
                          </div>
                          <div>
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                              {content.type}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDelete(e, content.id)}
                          className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">
                        {content.title}
                      </h3>
                      
                      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                        <span>{new Date(content.createdAt).toLocaleDateString()}</span>
                        <span>{content.originalLanguage}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
          
          {contents.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500">
              Nenhum conteúdo encontrado na biblioteca.
            </div>
          )}
        </div>
      </div>

      {/* Single Delete Confirmation Dialog */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeleteId(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Excluir Conteúdo</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Tem certeza que deseja excluir este conteúdo? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowBulkDeleteConfirm(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Excluir {selectedIds.size} Conteúdos</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Tem certeza que deseja excluir {selectedIds.size} conteúdo(s) selecionado(s)? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
              >
                {bulkDeleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Excluir Todos</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
