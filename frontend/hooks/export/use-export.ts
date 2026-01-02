/**
 * Export Hook for TECHNICAL Mode
 * 
 * Orchestration layer - manages React state and side effects
 * Following MelhoresPraticas.txt: hooks/domain for orchestration
 * 
 * G3.3: Export to PKM tools
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  exportContent, 
  ExportFormat, 
  ExportOptions,
  ExportResult 
} from '@/lib/export/export-formats';
import { Content } from '@/lib/types/cornell';
import { Annotation } from '@/hooks/content/use-annotations';
import { useTelemetry } from '../telemetry/use-telemetry';

interface UseExportProps {
  content: Content;
  annotations: Annotation[];
}

export function useExport({ content, annotations }: UseExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { track } = useTelemetry(content.id);

  const exportMutation = useMutation({
    mutationFn: async (options: ExportOptions) => {
      setIsExporting(true);
      
      try {
        // Domain logic (pure function)
        const result: ExportResult = exportContent(content, annotations, options);
        
        // Trigger download
        downloadFile(result);
        
        // Track telemetry
        track('CONTENT_EXPORTED', {
          format: options.format,
          includeAnnotations: options.includeAnnotations,
          annotationCount: annotations.length
        });
        
        return result;
      } finally {
        setIsExporting(false);
      }
    },
    onSuccess: (result) => {
      toast.success(`Exportado como ${result.filename}`);
    },
    onError: (error) => {
      toast.error('Erro ao exportar conteúdo');
      console.error('Export error:', error);
    }
  });

  const exportToMarkdown = () => {
    exportMutation.mutate({
      format: ExportFormat.MARKDOWN,
      includeAnnotations: true,
      includeHighlights: true,
      includeNotes: true
    });
  };

  const exportToObsidian = () => {
    exportMutation.mutate({
      format: ExportFormat.OBSIDIAN,
      includeAnnotations: true,
      includeHighlights: true,
      includeNotes: true
    });
  };

  const exportToJSON = () => {
    exportMutation.mutate({
      format: ExportFormat.JSON,
      includeAnnotations: true,
      includeHighlights: true,
      includeNotes: true
    });
  };

  return {
    exportToMarkdown,
    exportToObsidian,
    exportToJSON,
    isExporting
  };
}

/**
 * Utility: Trigger browser download
 */
function downloadFile(result: ExportResult) {
  const blob = new Blob([result.content], { type: result.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
