import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useCreateClassroom } from '@/hooks/content/use-classrooms';
import { useAuthStore } from '@/stores/auth-store';

interface CreateClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  institutionId?: string;
}

export const CreateClassroomModal: React.FC<CreateClassroomModalProps> = ({ 
  isOpen, 
  onClose,
  institutionId 
}) => {
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const user = useAuthStore((state) => state.user);
  const createMutation = useCreateClassroom();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;

    try {
      await createMutation.mutateAsync({
        name,
        gradeLevel,
        ownerEducatorUserId: user.id,
        institutionId: institutionId || user.activeInstitutionId
      });
      setName('');
      setGradeLevel('');
      onClose();
    } catch (err) {
      console.error('Failed to create classroom:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Criar Nova Turma
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome da Turma
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: 3º Ano B - Matemática"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Série / Nível (Opcional)
            </label>
            <input
              type="text"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              placeholder="Ex: Fundamental II"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || createMutation.isPending}
              className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Criar Turma'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
