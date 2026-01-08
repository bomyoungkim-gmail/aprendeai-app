"use client";

/**
 * IMRaD Filter Component
 * 
 * Displays filters for IMRaD sections with annotation counts
 */

import React from 'react';
import { IMRaDSection } from '@/types/scientific';
import { IMRAD_SECTIONS } from '@/lib/scientific/imrad-utils';

interface IMRaDFilterProps {
  activeSection: IMRaDSection | null;
  onSectionChange: (section: IMRaDSection | null) => void;
  sectionCounts: Record<IMRaDSection, number>;
  totalCount: number;
}

export function IMRaDFilter({
  activeSection,
  onSectionChange,
  sectionCounts,
  totalCount,
}: IMRaDFilterProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Filter by Section
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {totalCount} annotations
        </span>
      </div>

      <div className="space-y-2">
        {/* All sections button */}
        <button
          onClick={() => onSectionChange(null)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSection === null
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              : 'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
        >
          <span>All Sections</span>
          <span className="text-xs font-semibold">{totalCount}</span>
        </button>

        {/* Individual section buttons */}
        {IMRAD_SECTIONS.map((section) => (
          <button
            key={section.name}
            data-testid={`imrad-filter-${section.name.toLowerCase()}`}
            onClick={() => onSectionChange(section.name)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === section.name
                ? section.color
                : 'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
            title={section.description}
          >
            <span>{section.label}</span>
            <span className="text-xs font-semibold">
              {sectionCounts[section.name] || 0}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
