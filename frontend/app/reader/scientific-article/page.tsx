"use client";

/**
 * Scientific Article Reader - Demo Page
 * 
 * Demonstrates SCIENTIFIC mode with:
 * - Glossary terms (clickable)
 * - IMRaD filters
 * - Scientific annotations
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { GlossaryPopover } from '@/components/scientific/GlossaryPopover';
import { GlossaryTerm } from '@/components/scientific/GlossaryTerm';
import { IMRaDFilter } from '@/components/scientific/IMRaDFilter';
import { useGlossary } from '@/hooks/use-glossary';
import { useIMRaDFilter } from '@/hooks/use-imrad-filter';
import { ScientificAnnotation, IMRaDSection } from '@/types/scientific';

// Mock scientific article content
const ARTICLE_CONTENT = {
  title: 'Cellular Respiration and Energy Production',
  abstract: 'This study examines the role of mitochondria in cellular energy production through aerobic respiration.',
  introduction: 'Cellular respiration is a fundamental process in biology. The mitochondria serve as the powerhouse of the cell, converting nutrients into ATP through a series of biochemical reactions.',
  methods: 'We used fluorescence microscopy to observe mitochondria in living cells. Enzyme activity was measured using spectrophotometry.',
  results: 'Our results show that mitochondria density correlates with cellular energy demands. Cells with higher metabolic rates contain more mitochondria.',
  discussion: 'These findings support the hypothesis that mitochondria play a central role in energy metabolism. The process of photosynthesis in plants shares some similarities with cellular respiration, though it operates in reverse.',
};

// Mock annotations
const MOCK_ANNOTATIONS: ScientificAnnotation[] = [
  {
    id: '1',
    text: 'Key finding about mitochondria',
    section: 'Abstract',
    position: { start: 0, end: 10 },
    createdAt: new Date(),
  },
  {
    id: '2',
    text: 'Important methodology detail',
    section: 'Methods',
    position: { start: 0, end: 10 },
    createdAt: new Date(),
  },
  {
    id: '3',
    text: 'Significant result',
    section: 'Results',
    position: { start: 0, end: 10 },
    createdAt: new Date(),
  },
  {
    id: '4',
    text: 'Discussion point',
    section: 'Discussion',
    position: { start: 0, end: 10 },
    createdAt: new Date(),
  },
  {
    id: '5',
    text: 'Another result',
    section: 'Results',
    position: { start: 0, end: 10 },
    createdAt: new Date(),
  },
];

export default function ScientificArticlePage() {
  const searchParams = useSearchParams();
  const mode = searchParams?.get('mode');
  const isScientificMode = mode === 'SCIENTIFIC';

  const glossary = useGlossary();
  const imradFilter = useIMRaDFilter(MOCK_ANNOTATIONS);

  // Wrap scientific terms in GlossaryTerm component
  const wrapTerms = (text: string) => {
    if (!isScientificMode) return text;

    const terms = ['mitochondria', 'photosynthesis', 'enzyme'];
    
    // Split text by words while preserving spaces and punctuation
    const words = text.split(/(\s+|[.,;:!?])/);
    
    return words.map((word, index) => {
      const lowerWord = word.toLowerCase().replace(/[.,;:!?]/g, '');
      
      if (terms.includes(lowerWord)) {
        return (
          <GlossaryTerm
            key={`${lowerWord}-${index}`}
            term={lowerWord}
            onClick={glossary.fetchDefinition}
          >
            {word}
          </GlossaryTerm>
        );
      }
      
      return word;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {ARTICLE_CONTENT.title}
              </h1>

              {/* Abstract */}
              <section className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Abstract
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {wrapTerms(ARTICLE_CONTENT.abstract)}
                </p>
              </section>

              {/* Introduction */}
              <section className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Introduction
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {wrapTerms(ARTICLE_CONTENT.introduction)}
                </p>
              </section>

              {/* Methods */}
              <section className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Methods
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {wrapTerms(ARTICLE_CONTENT.methods)}
                </p>
              </section>

              {/* Results */}
              <section className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Results
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {wrapTerms(ARTICLE_CONTENT.results)}
                </p>
              </section>

              {/* Discussion */}
              <section className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Discussion
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {wrapTerms(ARTICLE_CONTENT.discussion)}
                </p>
              </section>
            </article>
          </div>

          {/* Sidebar - IMRaD Filter */}
          {isScientificMode && (
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <IMRaDFilter
                  activeSection={imradFilter.activeSection}
                  onSectionChange={imradFilter.setActiveSection}
                  sectionCounts={imradFilter.sectionCounts}
                  totalCount={imradFilter.totalCount}
                />

                {/* Annotations List */}
                <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Annotations
                  </h3>
                  <div className="space-y-2">
                    {imradFilter.filteredAnnotations.map(annotation => (
                      <div
                        key={annotation.id}
                        className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm"
                      >
                        <p className="text-gray-700 dark:text-gray-300">{annotation.text}</p>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {annotation.section}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Glossary Popover */}
      {isScientificMode && (
        <GlossaryPopover
          term={glossary.selectedTerm}
          definition={glossary.definition}
          isLoading={glossary.isLoading}
          isOpen={glossary.isOpen}
          onClose={glossary.closePopover}
          error={glossary.error}
        />
      )}
    </div>
  );
}
