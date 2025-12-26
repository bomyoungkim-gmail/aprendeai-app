'use client';

import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import { FileText, AlertCircle, Loader2 } from 'lucide-react';
import { logger } from '@/lib/utils/logger';
import type { Content, ViewMode } from '@/lib/types/cornell';

interface DocxViewerProps {
  content: Content;
  mode: ViewMode;
}

export function DocxViewer({ content, mode }: DocxViewerProps) {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!content.file?.viewUrl) {
      setError('No file URL available');
      setLoading(false);
      return;
    }

    loadDocx(content.file.viewUrl);
  }, [content.file?.viewUrl]);

  async function loadDocx(url: string) {
    try {
      setLoading(true);
      setError(null);

      // Fetch DOCX file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();

      // Convert to HTML using Mammoth
      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Title'] => h1.title:fresh",
          ],
          convertImage: mammoth.images.imgElement((image) => {
            return image.read("base64").then((imageBuffer) => {
              return {
                src: "data:" + image.contentType + ";base64," + imageBuffer,
              };
            });
          }),
        }
      );

      setHtml(result.value);

      if (result.messages.length > 0) {
        logger.warn('Mammoth conversion warnings', { warnings: result.messages });
      }
    } catch (err) {
      logger.error('DOCX conversion failed', err, { contentId: content.id });
      setError(err instanceof Error ? err.message : 'Failed to load DOCX file');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading document...</p>
          <p className="text-gray-400 text-sm mt-2">Converting DOCX to readable format</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Error Loading Document</h3>
          <p className="text-gray-500 text-sm">{error}</p>
          <button
            onClick={() => loadDocx(content.file!.viewUrl!)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No content to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-white">
      <div className="max-w-4xl mx-auto p-8">
        {/* Mode indicator */}
        {mode === 'study' && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <span className="text-green-700 text-sm font-medium">
              📚 Study Mode - Take notes using the Cornell method
            </span>
          </div>
        )}

        {/* Render converted HTML */}
        <div 
          className="prose prose-lg max-w-none
            prose-headings:font-bold
            prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-6
            prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-5
            prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4
            prose-p:mb-2 prose-p:leading-relaxed
            prose-ul:my-2 prose-ol:my-2
            prose-li:my-1
            prose-img:rounded-lg prose-img:shadow-md
            prose-table:border-collapse prose-table:w-full
            prose-th:border prose-th:p-2 prose-th:bg-gray-100
            prose-td:border prose-td:p-2
          "
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Footer info */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-sm text-gray-500">
          <p>Original file: {content.file?.originalFilename || 'document.docx'}</p>
          <p className="mt-1">Converted from Microsoft Word format</p>
        </div>
      </div>
    </div>
  );
}
