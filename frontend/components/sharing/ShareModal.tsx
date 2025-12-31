'use client';

import { useState } from 'react';
import { X, Users, Home, Globe, Share2, Check } from 'lucide-react';
import { useMyClassrooms } from '@/hooks/content/use-classrooms';
import { useFamilies } from '@/hooks/social/use-family';
import { useShareContent } from '@/hooks/social/use-threads';
import { ShareContextType, SharePermission } from '@/lib/types/sharing';
import { toast } from 'sonner';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  title: string;
}

export function ShareModal({ isOpen, onClose, contentId, title }: ShareModalProps) {
  const [selectedContext, setSelectedContext] = useState<{ type: ShareContextType, id: string } | null>(null);
  const [permission, setPermission] = useState<SharePermission>(SharePermission.VIEW);
  
  const { data: classrooms, isLoading: classroomsLoading } = useMyClassrooms();
  const { data: families, isLoading: familiesLoading } = useFamilies();
  const shareContent = useShareContent(contentId);

  if (!isOpen) return null;

  const handleShare = async () => {
    if (!selectedContext) {
      toast.error('Selecione uma turma ou família para compartilhar.');
      return;
    }

    try {
      await shareContent.mutateAsync({
        contextType: selectedContext.type as any, // Cast to any to avoid enum/string mismatch if any
        contextId: selectedContext.id,
        permission: permission as any
      });
      toast.success('Conteúdo compartilhado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Erro ao compartilhar conteúdo.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <Share2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Compartilhar</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[250px]">{title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Target Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Para onde compartilhar?</label>
            <div className="grid grid-cols-1 gap-3 pr-1">
              
              {/* Classrooms */}
              {classrooms && classrooms.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                    <Users className="w-3 h-3" /> Turmas
                  </h3>
                  <div className="grid gap-2">
                    {classrooms.map(cls => (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => setSelectedContext({ type: ShareContextType.CLASSROOM, id: cls.id })}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all group ${
                          selectedContext?.id === cls.id 
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                            : 'border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 bg-gray-50 dark:bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${
                            selectedContext?.id === cls.id ? 'bg-indigo-600 text-white' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                          }`}>
                            {cls.name.charAt(0)}
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-bold text-gray-900 dark:text-white transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                              {cls.name}
                            </div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">
                              {cls.gradeLevel || 'Sem nível'}
                            </div>
                          </div>
                        </div>
                        {selectedContext?.id === cls.id && <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Families */}
              {families && families.length > 0 && (
                <div className="space-y-2 mt-2">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                    <Home className="w-3 h-3" /> Famílias
                  </h3>
                  <div className="grid gap-2">
                    {families.map(fam => (
                      <button
                        key={fam.id}
                        type="button"
                        onClick={() => setSelectedContext({ type: ShareContextType.FAMILY, id: fam.id })}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all group ${
                          selectedContext?.id === fam.id 
                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' 
                            : 'border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800 bg-gray-50 dark:bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${
                            selectedContext?.id === fam.id ? 'bg-emerald-600 text-white' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {fam.name?.charAt(0) || 'F'}
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-bold text-gray-900 dark:text-white transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                              {fam.name || 'Minha Família'}
                            </div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">
                              Privado • Pessoal
                            </div>
                          </div>
                        </div>
                        {selectedContext?.id === fam.id && <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(classroomsLoading || familiesLoading) && (
                <div className="p-12 flex flex-col items-center justify-center text-gray-400 gap-3">
                   <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-xs font-medium">Carregando locais...</p>
                </div>
              )}

              {!classroomsLoading && !familiesLoading && (!classrooms?.length && !families?.length) && (
                <div className="p-12 text-center text-gray-400 bg-gray-50 dark:bg-gray-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Você não participa de nenhuma Turma ou Família ainda.</p>
                </div>
              )}
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Nível de Acesso</label>
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl">
               <button 
                 type="button"
                 onClick={() => setPermission(SharePermission.VIEW)}
                 className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                   permission === SharePermission.VIEW ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                 }`}
               >
                 <Globe className="w-3.5 h-3.5" /> Apenas Ver
               </button>
               <button 
                 type="button"
                 onClick={() => setPermission(SharePermission.COMMENT)}
                 className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                   permission === SharePermission.COMMENT ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                 }`}
               >
                 <Users className="w-3.5 h-3.5" /> Comentar
               </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3 flex-shrink-0">
           <button 
             type="button"
             onClick={onClose}
             className="flex-1 py-3 px-4 rounded-2xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
           >
             Cancelar
           </button>
           <button 
             type="button"
             disabled={!selectedContext || shareContent.isPending}
             onClick={handleShare}
             className="flex-[1.5] py-3 px-4 rounded-2xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
           >
             {shareContent.isPending ? (
               <>
                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                 Compartilhando...
               </>
             ) : (
               'Confirmar Compartilhamento'
             )}
           </button>
        </div>
      </div>
    </div>
  );
}
