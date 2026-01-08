'use client';

import React, { useState, useCallback } from 'react';
import { ModernCornellLayout } from '@/components/cornell/ModernCornellLayout';
import type { UnifiedStreamItem, UnifiedStreamItemType } from '@/lib/types/unified-stream';
import type { ViewMode, SaveStatus } from '@/lib/types/cornell';
import { ContentType } from '@/lib/constants/enums';
import { offlineQueue } from '@/lib/cornell/offline-queue';

/**
 * E2E Test Page
 * 
 * Uses REAL ModernCornellLayout with mocked data for stable E2E testing.
 * Tests can interact with actual UI components:
 * - TextSelectionMenu (Evidence, Doubt, etc.)
 * - CornellSidebar
 * - OfflineSync indicators
 */
export default function E2eTestPage() {
  const [mode, setMode] = useState<ViewMode>('study');
  const [streamItems, setStreamItems] = useState<UnifiedStreamItem[]>([]);
  const [summary, setSummary] = useState('');

  const handleModeToggle = useCallback(() => {
    setMode(prev => prev === 'study' ? 'original' : 'study');
  }, []);

  const handleCreateStreamItem = useCallback((
    type: UnifiedStreamItemType,
    text: string,
    context?: unknown
  ) => {
    console.log(`TEST-PAGE: Creating item type=${type} text=${text.substring(0, 20)}...`);

    // CRITICAL: Apply visual highlight to the selected text in the DOM
    const applyVisualHighlight = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      try {
        const range = selection.getRangeAt(0);
        const mark = document.createElement('mark');
        
        // Apply yellow background for evidence type
        if (type === 'evidence') {
          mark.style.backgroundColor = 'rgba(250, 204, 21, 0.3)'; // yellow-400 with opacity
          mark.style.borderRadius = '2px';
          mark.style.padding = '2px 0';
        }
        
        // Wrap the selected content
        mark.appendChild(range.extractContents());
        range.insertNode(mark);
        
        // Clear selection after highlighting
        selection.removeAllRanges();
      } catch (error) {
        console.error('Failed to apply visual highlight:', error);
      }
    };

    // Apply the visual highlight first
    applyVisualHighlight();

    const newItem: UnifiedStreamItem = {
      id: crypto.randomUUID(),
      type,
      content: text,
      createdAt: new Date(),
      // CRITICAL: Add quote at top level for AnnotationCard to display
      ...(type === 'evidence' && {
        quote: text, // Top-level quote for AnnotationCard
        highlight: {
          id: crypto.randomUUID(),
          quote: text,
          color_key: 'yellow',
          page_number: 1,
        }
      }),
    } as any;

    try {
      console.log('TEST-PAGE: Attempting to add to offline queue...');
      // Simulate offline queue addition for E2E testing of indicators
      offlineQueue.add({
        type: 'CREATE',
        contentId: 'e2e-test-content',
        payload: { 
          ...newItem,
          // Ensure payload structure matches what sync expects
          highlightId: (newItem as any).highlight?.id,
          text: text
        }
      });
      console.log(`TEST-PAGE: Item queued successfully. New Queue Length: ${offlineQueue.length}`);
    } catch (error) {
      console.error('TEST-PAGE: Failed to add to offline queue:', error);
    }

    setStreamItems(prev => [newItem, ...prev]);
  }, []);

  const handleStreamItemDelete = useCallback((item: UnifiedStreamItem) => {
    setStreamItems(prev => prev.filter(i => i.id !== item.id));
  }, []);

  const handleStreamItemSaveEdit = useCallback((
    item: UnifiedStreamItem,
    updates: any
  ) => {
    setStreamItems(prev => prev.map(i => 
      i.id === item.id ? { ...i, ...updates } : i
    ));
  }, []);

  // Mock viewer with scientific content
  const viewer = (
    <div className="p-8 max-w-4xl mx-auto prose prose-lg" data-testid="test-content">
      <h1>Test Article for E2E Testing</h1>
      
      <section data-section="introduction">
        <h2>Introduction</h2>
        <p>
          This is an important paragraph for testing offline functionality.
          The mitochondria is the powerhouse of the cell, responsible for 
          energy production through cellular respiration.
        </p>
        <p>
          Understanding cellular biology requires knowledge of DNA and its 
          role in heredity. This is test content for offline annotations.
        </p>
      </section>

      <section data-section="methods">
        <h2>Methods</h2>
        <p>
          We analyzed enzyme activity in various cellular conditions using 
          spectrophotometry and fluorescence microscopy.
        </p>
      </section>

      <section data-section="results">
        <h2>Results</h2>
        <p>
          Our findings demonstrate the critical role of photosynthesis in 
          energy conversion processes across different organisms.
        </p>
      </section>

      <section data-section="discussion">
        <h2>Discussion</h2>
        <p>
          These results align with current understanding of cellular mechanisms
          and provide important insights for future research.
        </p>
      </section>
    </div>
  );

  return (
    <ModernCornellLayout
      title="E2E Test Article"
      mode={mode}
      onModeToggle={handleModeToggle}
      saveStatus={"saved" as any}
      lastSaved={new Date()}
      contentId="e2e-test-content"
      targetType={ContentType.ARTICLE}
      currentPage={1}
      currentTimestamp={0}
      viewer={viewer}
      streamItems={streamItems}
      onStreamItemClick={() => {}}
      onStreamItemEdit={() => {}}
      onStreamItemDelete={handleStreamItemDelete}
      onStreamItemSaveEdit={handleStreamItemSaveEdit}
      summary={summary}
      onSummaryChange={setSummary}
      onCreateStreamItem={handleCreateStreamItem}
      selectedColor="yellow"
      onColorChange={() => {}}
      disableSelectionMenu={false}
      onNavigate={() => {}}
      scrollPercentage={0}
      contentText="Test article content with mitochondria, DNA, enzyme, and photosynthesis terms."
    />
  );
}
