'use client';

import React, { forwardRef } from 'react';
import { Viewer, Worker, SpecialZoomLevel, ScrollMode } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { highlightPlugin, Trigger } from '@react-pdf-viewer/highlight';
import { searchPlugin } from '@react-pdf-viewer/search';
import { thumbnailPlugin } from '@react-pdf-viewer/thumbnail';
import { bookmarkPlugin } from '@react-pdf-viewer/bookmark';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';
import '@react-pdf-viewer/thumbnail/lib/styles/index.css';
import '@react-pdf-viewer/bookmark/lib/styles/index.css';

import type { Content, Highlight as BackendHighlight, ViewMode } from '@/lib/types/cornell';

// Import extracted components
import { 
  PDFSelectionMenu, 
  PDFLoadingState, 
  PDFSidebar, 
  PDFToolbar, 
  PDFStyles 
} from './pdf';

// Import domain hooks
import {
  usePDFDocument,
  usePDFNavigation,
  usePDFUIState,
  usePDFHighlights,
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

  // Domain hooks
  const { pdfUrl, loading, error } = usePDFDocument(fileUrl);
  const uiState = usePDFUIState();
  const navigation = usePDFNavigation(uiState.totalPages);
  const { renderHighlights, handleHighlightCreation } = usePDFHighlights(
    highlights,
    onCreateHighlight,
    selectedColor,
    content.id
  );

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

  // Highlight plugin setup
  const highlightPluginInstance = highlightPlugin({
    renderHighlights,
    trigger: Trigger.TextSelection,
    renderHighlightTarget: (props) => (
      <PDFSelectionMenu 
        props={props} 
        handleHighlightCreation={handleHighlightCreation}
        onSelectionAction={onSelectionAction}
        selectedColor={selectedColor}
      />
    ),
  });

  const { jumpToHighlightArea } = highlightPluginInstance;
  
  // Store jumpToHighlightArea ref for navigation hook
  React.useEffect(() => {
    navigation.jumpToHighlightAreaRef.current = jumpToHighlightArea;
  }, [jumpToHighlightArea, navigation.jumpToHighlightAreaRef]);

  // Plugins instances
  const thumbnailPluginInstance = thumbnailPlugin();
  const { Thumbnails } = thumbnailPluginInstance;

  const bookmarkPluginInstance = bookmarkPlugin();
  const { Bookmarks } = bookmarkPluginInstance;

  const searchPluginInstance = searchPlugin({
    enableShortcuts: true,
    keyword: '',
  });

  // Default layout config with custom toolbar
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: () => [], // Disable default sidebar
    renderToolbar: (Toolbar) => (
      <Toolbar>
        {(slots) => {
          const { Zoom, ZoomIn, ZoomOut } = slots;
          return (
            <PDFToolbar
              activeSidebar={uiState.activeSidebar}
              onToggleSidebar={uiState.toggleSidebar}
              currentPage={navigation.currentPage}
              totalPages={uiState.totalPages}
              ZoomOutComponent={ZoomOut}
              ZoomComponent={Zoom}
              ZoomInComponent={ZoomIn}
            />
          );
        }}
      </Toolbar>
    ),
  });

  // Handle page change
  const handlePageChange = (e: { currentPage: number }) => {
    navigation.handlePageChange(e, onPageChangeProp);
  };

  // Handle document load
  const handleDocumentLoad = (e: { doc: any }) => {
    navigation.handleDocumentLoad(e, uiState.setTotalPages);
  };

  // Show loading/error states
  const loadingState = PDFLoadingState({ loading, error, fileUrl });
  if (loadingState) return loadingState;

  return (
    <div className="h-full w-full relative">
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <div className="h-full w-full bg-white dark:bg-gray-900">
          {pdfUrl && (
            <Viewer
              fileUrl={pdfUrl}
              plugins={[
                defaultLayoutPluginInstance,
                highlightPluginInstance,
                searchPluginInstance,
                thumbnailPluginInstance,
                bookmarkPluginInstance,
              ]}
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
          )}

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
