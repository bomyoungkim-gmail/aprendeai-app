import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ScaffoldingLevelIndicatorProps {
  level: number; // 0-3
  trend?: 'up' | 'down' | 'stable';
  lastChanged?: Date;
  className?: string;
}

const LEVEL_CONFIG = {
  0: {
    label: 'L0',
    variant: 'secondary' as const,
    color: 'text-gray-600',
    description: 'Suporte Mínimo',
    details: 'Você está no nível de autonomia máxima. O sistema intervém apenas quando solicitado.',
  },
  1: {
    label: 'L1',
    variant: 'default' as const,
    color: 'text-blue-600',
    description: 'Suporte Baixo',
    details: 'Respostas diretas com sugestões de aprofundamento quando necessário.',
  },
  2: {
    label: 'L2',
    variant: 'default' as const,
    color: 'text-green-600',
    description: 'Suporte Moderado',
    details: 'Respostas detalhadas com verificação de compreensão.',
  },
  3: {
    label: 'L3',
    variant: 'default' as const,
    color: 'text-purple-600',
    description: 'Suporte Máximo',
    details: 'Explicações passo a passo com exemplos práticos e verificação contínua.',
  },
};

export function ScaffoldingLevelIndicator({
  level,
  trend,
  lastChanged,
  className = '',
}: ScaffoldingLevelIndicatorProps) {
  // Clamp level to 0-3
  const clampedLevel = Math.max(0, Math.min(3, level)) as 0 | 1 | 2 | 3;
  const config = LEVEL_CONFIG[clampedLevel];

  const getTrendIcon = () => {
    if (!trend || trend === 'stable') return <Minus className="h-3 w-3 ml-1" />;
    if (trend === 'up') return <TrendingUp className="h-3 w-3 ml-1 text-green-500" />;
    return <TrendingDown className="h-3 w-3 ml-1 text-blue-500" />;
  };

  const getLastChangedText = () => {
    if (!lastChanged) return '';
    const now = new Date();
    const diff = now.getTime() - lastChanged.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Alterado há ${days}d`;
    if (hours > 0) return `Alterado há ${hours}h`;
    if (minutes > 0) return `Alterado há ${minutes}min`;
    return 'Alterado agora';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1 ${className}`}>
            <Badge variant={config.variant} className={`${config.color} font-medium`}>
              {config.label}
            </Badge>
            {getTrendIcon()}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <div>
              <p className="font-semibold">{config.description}</p>
              <p className="text-sm text-muted-foreground mt-1">{config.details}</p>
            </div>
            {lastChanged && (
              <p className="text-xs text-muted-foreground border-t pt-2">
                {getLastChangedText()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
