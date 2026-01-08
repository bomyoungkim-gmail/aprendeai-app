/**
 * IMRaD Filter Hook
 * 
 * Hook for filtering annotations by IMRaD section
 */

import { useMemo, useState } from 'react';
import { IMRaDSection, ScientificAnnotation } from '@/types/scientific';

export function useIMRaDFilter(annotations: ScientificAnnotation[]) {
  const [activeSection, setActiveSection] = useState<IMRaDSection | null>(null);

  // Filter annotations by active section
  const filteredAnnotations = useMemo(() => {
    if (!activeSection) return annotations;
    return annotations.filter(a => a.section === activeSection);
  }, [annotations, activeSection]);

  // Calculate annotation counts per section
  const sectionCounts = useMemo(() => {
    const counts: Record<IMRaDSection, number> = {
      Abstract: 0,
      Introduction: 0,
      Methods: 0,
      Results: 0,
      Discussion: 0,
    };

    annotations.forEach(annotation => {
      counts[annotation.section] = (counts[annotation.section] || 0) + 1;
    });

    return counts;
  }, [annotations]);

  // Total annotations count
  const totalCount = annotations.length;

  return {
    activeSection,
    setActiveSection,
    filteredAnnotations,
    sectionCounts,
    totalCount,
  };
}
