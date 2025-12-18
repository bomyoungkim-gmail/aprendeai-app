import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

import type { Content, Highlight, ViewMode } from '@/lib/types/cornell';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  content: Content;
  mode: ViewMode;
  highlights?: Highlight[];
  onCreateHighlight?: (highlight: any) => Promise<void>;
}

export function PDFViewer({ content, mode, highlights = [], onCreateHighlight }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);

  const fileUrl = content.file?.viewUrl;

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.2, 3.0));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  if (!fileUrl) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No PDF file available</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
        {/* Page Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white text-sm"
          >
            Previous
          </button>
          <span className="text-white text-sm">
            Page {pageNumber} of {numPages}
          </span>
          <button
            onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white text-sm"
          >
            Next
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4 text-white" />
          </button>
          <span className="text-white text-sm w-16 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4 text-white" />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded ml-2"
            title="Rotate"
          >
            <RotateCw className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      {/* PDF Document */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading PDF...</p>
            </div>
          }
          error={
            <div className="text-red-400 text-center">
              <p>Failed to load PDF</p>
              <p className="text-sm mt-2">Please check the file URL</p>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            rotate={rotation}
            renderTextLayer={mode === 'study'}
            renderAnnotationLayer={false}
            className="shadow-2xl"
          />
        </Document>
      </div>

      {/* Mode Indicator */}
      {mode === 'original' && (
        <div className="absolute top-20 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
          Original View
        </div>
      )}
    </div>
  );
}
