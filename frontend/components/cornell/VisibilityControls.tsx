/**
 * Visibility Controls Component
 * 
 * UI for managing Cornell Notes granular sharing settings.
 */

import React from 'react';
import { Lock, Users, Globe, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AnnotationVisibility,
  VisibilityScope,
  ContextType,
  ANNOTATION_VISIBILITY_LABELS,
  VISIBILITY_SCOPE_LABELS,
  CONTEXT_TYPE_LABELS,
} from '@/lib/constants/enums';
import {
  validateVisibilityConfig,
  getVisibilityDescription,
  useVisibilityScopes,
  type VisibilityConfig,
} from '@/hooks/cornell/use-visibility';

export interface VisibilityControlsProps {
  config: VisibilityConfig;
  onChange: (config: Partial<VisibilityConfig>) => void;
  availableContexts?: Array<{
    type: ContextType;
    id: string;
    name: string;
  }>;
  disabled?: boolean;
  className?: string;
}

export function VisibilityControls({
  config,
  onChange,
  availableContexts = [],
  disabled = false,
  className,
}: VisibilityControlsProps) {
  const availableScopes = useVisibilityScopes(config.contextType);
  const validation = validateVisibilityConfig(config);

  const visibilityOptions = [
    {
      value: AnnotationVisibility.PRIVATE,
      label: ANNOTATION_VISIBILITY_LABELS[AnnotationVisibility.PRIVATE],
      icon: Lock,
      description: 'Apenas você pode ver',
    },
    {
      value: AnnotationVisibility.GROUP,
      label: ANNOTATION_VISIBILITY_LABELS[AnnotationVisibility.GROUP],
      icon: Users,
      description: 'Compartilhado com grupo/instituição',
    },
    {
      value: AnnotationVisibility.PUBLIC,
      label: ANNOTATION_VISIBILITY_LABELS[AnnotationVisibility.PUBLIC],
      icon: Globe,
      description: 'Visível para todos',
    },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Visibility Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Visibilidade
        </label>
        <div className="space-y-2">
          {visibilityOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = config.visibility === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onChange({
                    visibility: option.value,
                    // Reset GROUP-specific fields when switching away
                    ...(option.value !== AnnotationVisibility.GROUP
                      ? {
                          scope: undefined,
                          contextType: undefined,
                          contextId: undefined,
                          learnerId: undefined,
                        }
                      : {}),
                  })
                }
                disabled={disabled}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all',
                  'hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                  isSelected
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-white border-gray-200 hover:border-gray-300',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5',
                    isSelected ? 'text-blue-600' : 'text-gray-400'
                  )}
                />
                <div className="flex-1 text-left">
                  <div
                    className={cn(
                      'text-sm font-medium',
                      isSelected ? 'text-blue-900' : 'text-gray-700'
                    )}
                  >
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {option.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* GROUP-specific options */}
      {config.visibility === AnnotationVisibility.GROUP && (
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {/* Context Selector */}
          {availableContexts.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                Contexto
              </label>
              <select
                value={config.contextId || ''}
                onChange={(e) => {
                  const context = availableContexts.find(
                    (c) => c.id === e.target.value
                  );
                  if (context) {
                    onChange({
                      contextType: context.type,
                      contextId: context.id,
                    });
                  }
                }}
                disabled={disabled}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um contexto</option>
                {availableContexts.map((context) => (
                  <option key={context.id} value={context.id}>
                    {CONTEXT_TYPE_LABELS[context.type]}: {context.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Scope Selector */}
          {config.contextType && availableScopes.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                Compartilhar com
              </label>
              <select
                value={config.scope || ''}
                onChange={(e) =>
                  onChange({
                    scope: e.target.value as VisibilityScope,
                  })
                }
                disabled={disabled}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione o alcance</option>
                {availableScopes.map((scope) => (
                  <option key={scope} value={scope}>
                    {VISIBILITY_SCOPE_LABELS[scope]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Learner ID input (for RESPONSIBLES_OF_LEARNER) */}
          {config.scope === VisibilityScope.RESPONSIBLES_OF_LEARNER && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                ID do Aluno
              </label>
              <input
                type="text"
                value={config.learnerId || ''}
                onChange={(e) =>
                  onChange({
                    learnerId: e.target.value,
                  })
                }
                disabled={disabled}
                placeholder="Digite o ID do aluno"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      )}

      {/* Validation Error */}
      {!validation.valid && validation.error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
          <div className="text-xs text-red-700">{validation.error}</div>
        </div>
      )}

      {/* Summary */}
      <div className="text-xs text-gray-600 italic">
        {getVisibilityDescription(config)}
      </div>
    </div>
  );
}
