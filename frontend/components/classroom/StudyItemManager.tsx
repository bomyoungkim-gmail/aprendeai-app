import React, { useState } from 'react';
import { useContents } from '@/hooks/use-content';
import { useCreateWeeklyPlan } from '@/hooks/content/use-weekly-plan';
import { Book, Check, Search, Calendar, Loader2 } from 'lucide-react';

interface StudyItemManagerProps {
  classroomId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const StudyItemManager: React.FC<StudyItemManagerProps> = ({
  classroomId,
  isOpen,
  onClose,
}) => {
  const { data: library = [], isLoading: libraryLoading } = useContents();
  const createPlanMutation = useCreateWeeklyPlan(classroomId);
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [weekStart, setWeekStart] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const filteredLibrary = library.filter((item: any) => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) return;
    
    try {
      await createPlanMutation.mutateAsync({
        weekStart: new Date(weekStart).toISOString(),
        items: selectedIds,
      });
      setSelectedIds([]);
      onClose();
    } catch (err) {
      console.error('Failed to create weekly plan:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Agendar Tarefas</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Selecione os conteúdos para estudo semanal</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <Search className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Semana de Início</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Buscar na Biblioteca</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filtrar por título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
          {libraryLoading ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="text-sm">Carregando biblioteca...</p>
            </div>
          ) : filteredLibrary.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Book className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Nenhum conteúdo encontrado.</p>
            </div>
          ) : (
            filteredLibrary.map((item: any) => (
              <div
                key={item.id}
                onClick={() => toggleSelection(item.id)}
                className={`flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedIds.includes(item.id)
                    ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800'
                    : 'bg-white border-gray-100 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
              >
                <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                  selectedIds.includes(item.id)
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700'
                }`}>
                  {selectedIds.includes(item.id) && <Check className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.title}</h4>
                  <p className="text-[10px] text-gray-500 uppercase font-medium">{item.contentType}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {selectedIds.length} selecionados
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedIds.length === 0 || createPlanMutation.isPending}
              className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 flex items-center gap-2"
            >
              {createPlanMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmar Agenda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
