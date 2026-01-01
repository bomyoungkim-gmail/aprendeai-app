import React from 'react';
import { Brain, Book, FileText, Globe, Newspaper, FlaskConical, HelpCircle } from 'lucide-react';
import { ContentMode } from '@prisma/client';
import { MODE_CONFIGS } from '@/lib/config/mode-config';
import { cn } from '@/lib/utils';

export interface ContentModeIndicatorProps {
  mode: ContentMode | null;
  source: string | null | undefined;
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
  inferredMode?: ContentMode | null;
}

const MODE_ICONS: Record<ContentMode, React.ElementType> = {
  [ContentMode.DIDACTIC]: Brain,
  [ContentMode.NARRATIVE]: Book,
  [ContentMode.TECHNICAL]: FileText,
  [ContentMode.LANGUAGE]: Globe,
  [ContentMode.NEWS]: Newspaper,
  [ContentMode.SCIENTIFIC]: FlaskConical,
};

export function ContentModeIndicator({
  mode,
  source,
  isLoading,
  onClick,
  className,
  inferredMode,
}: ContentModeIndicatorProps) {
  const displayMode = mode || inferredMode;
  const config = displayMode ? MODE_CONFIGS[displayMode] : null;
  const Icon = displayMode ? MODE_ICONS[displayMode] : HelpCircle;
  
  if (isLoading) {
    return (
      <div className={cn("animate-pulse h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-full", className)} />
    );
  }

  // Se não houver modo nem inferido, não mostra nada (ou mostra estado indefinido)
  if (!displayMode || !config) return null;

  const isUserSet = source === 'USER';
  const isInferred = !mode && !!inferredMode;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border",
        "hover:shadow-md hover:scale-105 active:scale-95",
        isInferred ? "border-dashed" : "border-solid",
        className
      )}
      style={{
        backgroundColor: `${config.themeColor}15`, // 10% opacity
        borderColor: `${config.themeColor}40`,     // 25% opacity
        color: config.themeColor,
      }}
      title={isInferred ? `Modo Inferido: ${config.label}. Clique para confirmar.` : `Modo: ${config.label}`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-xs font-semibold whitespace-nowrap">
        {config.label}
      </span>
      {isInferred && (
        <span className="flex h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" title="Sugerido por IA" />
      )}
    </button>
  );
}
