import React from 'react';
import { ContentMode, ContentModeSource } from '@/lib/types/content-mode';
import { MODE_CONFIGS } from '@/lib/config/mode-config';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface ContentModeSelectorProps {
  currentMode: ContentMode | null;
  inferredMode?: ContentMode | null;
  modeSource?: ContentModeSource;
  onModeSelect: (mode: ContentMode, source: ContentModeSource) => void;
  onClose: () => void;
  isOpen: boolean;
  contentId: string;
}

export function ContentModeSelector({
  currentMode,
  inferredMode,
  modeSource,
  onModeSelect,
  onClose,
  isOpen,
  contentId,
}: ContentModeSelectorProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mode-selector-title"
        data-testid="mode-selector-modal"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 id="mode-selector-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Selecionar Modo de Conteúdo
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            O modo define como a IA analisa este conteúdo e adapta a interface para melhor aprendizado.
          </p>

          <div className="grid grid-cols-1 gap-2">
            {(Object.keys(MODE_CONFIGS) as ContentMode[]).map((modeKey) => {
              const config = MODE_CONFIGS[modeKey];
              const isSelected = currentMode === modeKey;
              const isRecommended = !currentMode && inferredMode === modeKey;

              return (
                <button
                  key={modeKey}
                  data-testid={`mode-option-${modeKey}`}
                  onClick={() => {
                    onModeSelect(modeKey, 'USER');
                    onClose();
                  }}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border text-left transition-all hover:bg-gray-50 dark:hover:bg-gray-750",
                    isSelected 
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 ring-1 ring-blue-500" 
                      : "border-gray-200 dark:border-gray-700",
                    isRecommended && !isSelected && "border-yellow-400 ring-1 ring-yellow-400 bg-yellow-50/30"
                  )}
                >
                  <div 
                    className="mt-1 p-1.5 rounded-md text-white shadow-sm"
                    style={{ backgroundColor: config.themeColor }}
                  >
                    <div className="w-4 h-4 bg-white/20 rounded-sm" /> 
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {config.label}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-blue-500" />}
                      {isRecommended && !isSelected && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded">
                          Sugerido
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {config.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
