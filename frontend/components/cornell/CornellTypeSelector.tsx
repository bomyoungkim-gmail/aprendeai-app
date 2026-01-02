import React, { useMemo } from 'react';
import { MessageSquare, HelpCircle, Star, Highlighter, Type, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HighlightType } from '@/lib/cornell/labels';
import { useCornellConfig } from '@/hooks/cornell/use-cornell-config';

const ICON_MAP: Record<string, LucideIcon> = {
  HIGHLIGHT: Highlighter,
  IMPORTANT: Star,
  SYNTHESIS: Type,
  QUESTION: HelpCircle,
  NOTE: MessageSquare,
};

const COLOR_MAP: Record<string, { color: string; bgColor: string; borderColor: string; ringColor: string }> = {
  yellow: { color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300', ringColor: 'ring-yellow-400' },
  red: { color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-300', ringColor: 'ring-red-400' },
  blue: { color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-300', ringColor: 'ring-blue-400' },
  purple: { color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-300', ringColor: 'ring-purple-400' },
  green: { color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-300', ringColor: 'ring-green-400' },
};

export interface CornellTypeSelectorProps {
  value: Exclude<HighlightType, 'AI_RESPONSE'>;
  onChange: (type: Exclude<HighlightType, 'AI_RESPONSE'>) => void;
  disabled?: boolean;
  className?: string;
}

export function CornellTypeSelector({
  value,
  onChange,
  disabled = false,
  className,
}: CornellTypeSelectorProps) {
  const { data: config, isLoading } = useCornellConfig();

  const types = useMemo(() => {
    if (!config?.types) return [];
    return config.types.map(t => ({
      value: t.id as Exclude<HighlightType, 'AI_RESPONSE'>,
      label: t.label,
      description: t.label === 'Destaque' ? 'Destaque geral' : t.label === 'Importante' ? 'Conceitos-chave' : 'Anotação',
      icon: ICON_MAP[t.id] || Highlighter,
      ...COLOR_MAP[t.color || 'yellow']
    }));
  }, [config]);

  if (isLoading) return <div className="h-20 flex items-center justify-center animate-pulse bg-gray-100 rounded-lg" />;

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-gray-700">
        Tipo de Anotação
      </label>
      <div className="grid grid-cols-2 gap-2">
        {types.map((type) => {
          const Icon = type.icon;
          const isSelected = value === type.value;

          return (
            <button
              key={type.value}
              type="button"
              onClick={() => onChange(type.value)}
              disabled={disabled}
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg border-2 transition-all',
                'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2',
                isSelected
                  ? [
                      type.bgColor,
                      type.borderColor,
                      'ring-2',
                      'ring-offset-2',
                      type.ringColor,
                    ]
                  : 'bg-white border-gray-200 hover:border-gray-300',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5',
                  isSelected ? type.color : 'text-gray-400'
                )}
              />
              <div className="flex-1 text-left">
                <div
                  className={cn(
                    'text-sm font-medium',
                    isSelected ? type.color : 'text-gray-700'
                  )}
                >
                  {type.label}
                </div>
                <div className="text-xs text-gray-500">
                  {type.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Compact version for inline use
 */
export function CornellTypeSelectorCompact({
  value,
  onChange,
  disabled = false,
  className,
}: CornellTypeSelectorProps) {
  const { data: config } = useCornellConfig();

  const types = useMemo(() => {
    if (!config?.types) return [];
    return config.types.map(t => ({
      value: t.id as Exclude<HighlightType, 'AI_RESPONSE'>,
      label: t.label,
      icon: ICON_MAP[t.id] || Highlighter,
      ...COLOR_MAP[t.color || 'yellow']
    }));
  }, [config]);

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      {types.map((type) => {
        const Icon = type.icon;
        const isSelected = value === type.value;

        return (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            disabled={disabled}
            title={type.label}
            className={cn(
              'p-2 rounded-md border transition-all',
              'hover:shadow-sm focus:outline-none focus:ring-2',
              isSelected
                ? [type.bgColor, type.borderColor, type.color]
                : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
