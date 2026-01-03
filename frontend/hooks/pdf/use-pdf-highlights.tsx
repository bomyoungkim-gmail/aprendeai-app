import React, { useMemo, useCallback } from 'react';
import type { RenderHighlightsProps } from '@react-pdf-viewer/highlight';
import type { Highlight as BackendHighlight } from '@/lib/types/cornell';
import {
  convertHighlightsToReactPDF,
  reactPDFToBackend,
  type ReactPDFHighlight,
} from '@/lib/adapters/highlight-adapter';
import { getColorForKey } from '@/lib/constants/colors';
import { logger } from '@/lib/utils/logger';
import { CORNELL_CONFIG } from '@/lib/cornell/unified-config';

/**
 * usePDFHighlights - Hook para gerenciar highlights no PDF
 * 
 * Responsabilidades:
 * - Converter highlights backend ↔ ReactPDF
 * - Renderizar highlights
 * - Criar novos highlights
 * - Gerenciar multi-line selections
 * 
 * @param highlights - Highlights do backend
 * @param onCreateHighlight - Callback para criar highlight
 * @param selectedColor - Cor selecionada
 * @param contentId - ID do conteúdo
 * @returns Highlights e funções de gerenciamento
 */
export function usePDFHighlights(
  highlights: BackendHighlight[] = [],
  onCreateHighlight: ((highlight: any) => Promise<void>) | undefined,
  selectedColor: string,
  contentId: string
) {
  // Convert backend highlights to ReactPDF format
  const reactPDFHighlights = useMemo(
    () => convertHighlightsToReactPDF(highlights),
    [highlights]
  );

  // Render highlights on page
  const renderHighlights = useCallback((props: RenderHighlightsProps) => {
    return (
      <div>
        {reactPDFHighlights
          .filter((h) => h.position.pageIndex === props.pageIndex)
          .map((highlight) => (
            <React.Fragment key={highlight.id}>
              {highlight.highlightAreas
                .filter((area) => area.pageIndex === props.pageIndex)
                .map((area, idx) => (
                  <div
                    key={idx}
                    className="highlight-area"
                    style={{
                      background: getColorForKey(highlight.colorKey),
                      opacity: 0.7,
                      position: 'absolute',
                      left: `${area.left}%`,
                      top: `${area.top}%`,
                      width: `${area.width}%`,
                      height: `${area.height}%`,
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                    }}
                    title={highlight.content.text}
                    onClick={() => {
                      if (highlight.comment?.message) {
                        alert(highlight.comment.message);
                      }
                    }}
                  />
                ))}
            </React.Fragment>
          ))}
      </div>
    );
  }, [reactPDFHighlights]);

  // Transform and create highlight
  const handleHighlightCreation = useCallback(async (area: any, typeKey: string = 'HIGHLIGHT') => {
    if (!onCreateHighlight) return;

    // Get config for the pedagogical type
    const config = CORNELL_CONFIG[typeKey] || CORNELL_CONFIG.HIGHLIGHT;
    const tags = config.tags || [];
    const colorKey = typeKey === 'HIGHLIGHT' ? selectedColor : config.color;

    // Handle RenderHighlightTargetProps structure vs direct object
    const region = area.selectionRegion || area;
    const text = area.selectedText || '';
    const pageIndex = region.pageIndex || 0;

    try {
      // Use highlightAreas array for multi-line selections
      let highlightAreas = area.highlightAreas || [
        {
          left: region.left,
          top: region.top,
          width: region.width,
          height: region.height,
          pageIndex: pageIndex,
        },
      ];

      // Filter out empty rects (width=0 or height=0)
      highlightAreas = highlightAreas.filter((h: any) => h.width > 0 && h.height > 0);

      // If all areas were filtered out, use fallback
      if (highlightAreas.length === 0) {
        highlightAreas = [
          {
            left: region.left,
            top: region.top,
            width: region.width,
            height: region.height,
            pageIndex: pageIndex,
          },
        ];
      }

      // Also collect all rects for position.rects
      const rects = highlightAreas.map((h: any) => ({
        x1: h.left,
        y1: h.top,
        x2: h.left + h.width,
        y2: h.top + h.height,
        width: h.width,
        height: h.height,
        pageIndex: h.pageIndex || pageIndex,
      }));

      const backendFormat = reactPDFToBackend(
        {
          content: { text: text },
          position: {
            boundingRect: {
              x1: region.left,
              y1: region.top,
              x2: region.left + region.width,
              y2: region.top + region.height,
              width: region.width,
              height: region.height,
              pageIndex: pageIndex,
            },
            rects: rects,
            pageIndex: pageIndex,
          },
          highlightAreas: highlightAreas,
          comment: { emoji: '💛', message: '' },
        },
        contentId,
        '',
        colorKey,
        tags
      );

      await onCreateHighlight(backendFormat);
    } catch (error) {
      logger.error('Failed to create highlight', error, { contentId });
    }
  }, [onCreateHighlight, contentId, selectedColor]);

  return {
    reactPDFHighlights,
    renderHighlights,
    handleHighlightCreation,
  };
}
