'use client';

import React, { forwardRef } from 'react';
import { Viewer, Worker, SpecialZoomLevel, ScrollMode } from '@react-pdf-viewer/core';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';
import '@react-pdf-viewer/thumbnail/lib/styles/index.css';
import '@react-pdf-viewer/bookmark/lib/styles/index.css';

import type { Content, Highlight as BackendHighlight, ViewMode } from '@/lib/types/cornell';

// Import extracted components
import { 
  PDFSidebar, 
  PDFStyles 
} from './pdf';

// Import domain hooks
import {
  usePDFDocument,
  usePDFNavigation,
  usePDFUIState,
  usePDFHighlights,
  usePDFPlugins,
} from '@/hooks/pdf';

interface PDFViewerProps {
  content: Content;
  mode: ViewMode;
  highlights?: BackendHighlight[];
  onCreateHighlight?: (highlight: any) => Promise<void>;
  selectedColor?: string;
  onSelectionAction?: (action: 'note' | 'question' | 'ai' | 'important' | 'triage' | 'annotation', text: string, data?: any) => void;
  onPageChange?: (page: number) => void;
  forwardedRef?: React.Ref<PDFViewerRef>;
}

export interface PDFViewerRef {
  jumpToPage: (page: number) => void;
  jumpToHighlight: (highlightArea: any) => void;
}

export const PDFViewer = forwardRef<PDFViewerRef, PDFViewerProps>(({ 
  content, 
  mode, 
  highlights = [], 
  onCreateHighlight, 
  selectedColor = 'yellow',
  onSelectionAction,
  onPageChange: onPageChangeProp,
  forwardedRef,
}, ref) => {
  const fileUrl = content.file?.viewUrl;

  // CRITICAL: Call ALL hooks UNCONDITIONALLY at the top level
  // This ensures the same number of hooks are called on every render
  const { pdfUrl, loading, error } = usePDFDocument(fileUrl);
  const uiState = usePDFUIState();
  const navigation = usePDFNavigation(uiState.totalPages);
  
  const { renderHighlights, handleHighlightCreation } = usePDFHighlights(
    highlights,
    onCreateHighlight,
    selectedColor,
    content.id
  );

  const { 
    plugins, 
    Thumbnails, 
    Bookmarks, 
  } = usePDFPlugins({
    renderHighlights,
    handleHighlightCreation,
    onSelectionAction,
    selectedColor,
  });

  // Expose methods to parent
  React.useImperativeHandle(forwardedRef || ref, () => ({
    jumpToPage: (page: number) => {
      if (navigation.viewerRef.current) {
        navigation.viewerRef.current.jumpToPage(page - 1); // 0-indexed
      }
    },
    jumpToHighlight: (highlightArea: any) => {
      navigation.jumpToHighlight(highlightArea);
    }
  }));

  // Handlers
  const handlePageChange = (e: { currentPage: number }) => {
    navigation.handlePageChange(e, onPageChangeProp);
  };

  const handleDocumentLoad = (e: { doc: any }) => {
    navigation.handleDocumentLoad(e, uiState.setTotalPages);
  };

  // CONDITIONAL RENDERING (not early returns!)
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDF...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center max-w-md">
          <p className="text-red-600 font-semibold mb-2">Error loading PDF</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // No file state
  if (!fileUrl || !pdfUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <p className="text-gray-500">No PDF file available</p>
      </div>
    );
  }

  // Main render
  return (
    <div className="h-full w-full relative">
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <div className="h-full w-full bg-white dark:bg-gray-900">
          <Viewer
            fileUrl={pdfUrl}
            plugins={plugins}
            defaultScale={SpecialZoomLevel.PageWidth}
            scrollMode={ScrollMode.Vertical}
            onDocumentLoad={handleDocumentLoad}
            onPageChange={handlePageChange}
            ref={(viewerInstance) => {
              if (viewerInstance) {
                navigation.viewerRef.current = viewerInstance;
              }
            }}
            renderError={(error) => (
              <div className="flex items-center justify-center h-full bg-gray-900 p-4">
                <div className="text-red-400 text-center max-w-md">
                  <p className="text-base sm:text-lg font-semibold mb-2">Error rendering PDF</p>
                  <p className="text-xs sm:text-sm text-gray-400">{error.message}</p>
                </div>
              </div>
            )}
          />

          {/* Custom Sidebar Overlay */}
          <PDFSidebar
            activeSidebar={uiState.activeSidebar}
            onClose={uiState.closeSidebar}
            ThumbnailsComponent={Thumbnails}
            BookmarksComponent={Bookmarks}
          />
        </div>
      </Worker>

      {/* Global Styles */}
      <PDFStyles />
    </div>
  );
});

PDFViewer.displayName = 'PDFViewer';
