/**
 * Section-based Annotations Filter Component
 * 
 * Following MelhoresPraticas.txt:
 * - UI component apenas
 * - Props para dados
 * - Sem lógica de negócio
 * 
 * G5.4: Filters annotations by IMRaD section
 */

import React from 'react';
import { Filter } from 'lucide-react';
import { Section } from '@/lib/content/section-detector';

interface SectionAnnotationsFilterProps {
  sections: Section[];
  selectedSection: string | null;
  annotationCounts: Record<string, number>;
  onSectionSelect: (sectionId: string | null) => void;
}

export function SectionAnnotationsFilter({
  sections,
  selectedSection,
  annotationCounts,
  onSectionSelect
}: SectionAnnotationsFilterProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Filtrar por Seção
        </h3>
      </div>

      <div className="space-y-1">
        {/* All annotations */}
        <button
          onClick={() => onSectionSelect(null)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedSection === null
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span>Todas</span>
            <span className="text-xs">
              {Object.values(annotationCounts).reduce((a, b) => a + b, 0)}
            </span>
          </div>
        </button>

        {/* Section filters */}
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionSelect(section.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedSection === section.id
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{section.title}</span>
              <span className="text-xs">
                {annotationCounts[section.id] || 0}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
