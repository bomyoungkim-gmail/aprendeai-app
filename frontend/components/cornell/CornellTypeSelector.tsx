/**
 * Cornell Type Selector Component
 * 
 * Radio button selector for Cornell Notes annotation types.
 * Auto-assigns colors based on type.
 */

import React from 'react';
import { MessageSquare, HelpCircle, Star, Highlighter } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CornellType } from '@/lib/cornell/type-color-map';
import { getColorForCornellType } from '@/lib/cornell/type-color-map';

const CORNELL_TYPES = [
  {
    value: 'NOTE' as const,
    label: 'Nota',
    description: 'Anotações detalhadas',
    icon: MessageSquare,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
  },
  {
    value: 'QUESTION' as const,
    label: 'Questão',
    description: 'Dúvidas ou perguntas',
    icon: HelpCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
  },
  {
    value: 'STAR' as const,
    label: 'Importante',
    description: 'Conceitos-chave',
    icon: Star,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
  },
  {
    value: 'HIGHLIGHT' as const,
    label: 'Destaque',
    description: 'Destaque geral',
    icon: Highlighter,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
  },
] as const;

export interface CornellTypeSelectorProps {
  value: Exclude<CornellType, 'SUMMARY' | 'AI_RESPONSE'>;
  onChange: (type: Exclude<CornellType, 'SUMMARY' | 'AI_RESPONSE'>) => void;
  disabled?: boolean;
  className?: string;
}

export function CornellTypeSelector({
  value,
  onChange,
  disabled = false,
  className,
}: CornellTypeSelectorProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-gray-700">
        Tipo de Anotação
      </label>
      <div className="grid grid-cols-2 gap-2">
        {CORNELL_TYPES.map((type) => {
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
                      `ring-${type.color.split('-')[1]}-400`,
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
  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      {CORNELL_TYPES.map((type) => {
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
