import type { Highlight as BackendHighlight } from '@/lib/types/cornell';
import { getColorForKey, getEmojiForColor } from '@/lib/constants/colors';

export interface ReactPDFHighlight {
  id: string;
  content: {
    text: string;
  };
  position: {
    boundingRect: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      width: number;
      height: number;
      pageIndex: number;
    };
    rects: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      width: number;
      height: number;
      pageIndex: number;
    }>;
    pageIndex: number;
  };
  comment: {
    emoji: string;
    message: string;
  };
  highlightAreas: Array<{
    height: number;
    left: number;
    pageIndex: number;
    top: number;
    width: number;
  }>;
  colorKey: string; // Added to track the color of each highlight
}

/**
 * Convert backend highlight to @react-pdf-viewer format
 */
export function backendToReactPDF(highlight: BackendHighlight): ReactPDFHighlight | null {
  try {
    const { anchorJson, colorKey, commentText, pageNumber } = highlight;
    const pageIndex = (pageNumber ?? 1) - 1; // Backend uses 1-indexed pages

    // Handle PDF_TEXT type
    if (highlight.targetType === 'PDF' && anchorJson.type === 'PDF_TEXT') {
       const { position, quote } = anchorJson;
       const boundingRect = position.boundingRect;
       
       return {
        id: highlight.id,
        content: {
          text: quote || '',
        },
        position: {
          boundingRect: {
            x1: boundingRect.x1,
            y1: boundingRect.y1,
            x2: boundingRect.x2,
            y2: boundingRect.y2,
            width: boundingRect.width,
            height: boundingRect.height,
            pageIndex,
          },
          rects: position.rects.map(r => ({
             x1: r.x1,
             y1: r.y1,
             x2: r.x2,
             y2: r.y2,
             width: r.width,
             height: r.height,
             pageIndex: r.pageNumber ? r.pageNumber - 1 : pageIndex, 
          })),
          pageIndex,
        },
        comment: {
          emoji: getEmojiForColor(colorKey),
          message: commentText || '',
        },
        // Reconstruct highlightAreas from position.rects for multi-line support
        highlightAreas: position.rects && position.rects.length > 0
          ? position.rects.map(rect => ({
              height: rect.height,
              left: rect.x1,
              pageIndex: rect.pageNumber ? rect.pageNumber - 1 : pageIndex,
              top: rect.y1,
              width: rect.width,
            }))
          : [
              // Fallback to single area from boundingRect
              {
                height: boundingRect.height,
                left: boundingRect.x1,
                pageIndex,
                top: boundingRect.y1,
                width: boundingRect.width,
              },
            ],
        colorKey: colorKey, // Include the color key
      };
    }
    
    // TODO: Handle other types (PDF_AREA, IMAGE, etc.) if needed
    return null;

  } catch (error) {
    console.error('Failed to convert backend highlight to ReactPDF format:', error);
    return null;
  }
}

/**
 * Convert @react-pdf-viewer highlight to backend format
 */
export function reactPDFToBackend(
  highlight: Partial<ReactPDFHighlight>,
  contentId: string,
  userId: string,
  colorKey: string = 'yellow'
): Omit<import('@/lib/types/cornell').CreateHighlightDto, 'kind' | 'target_type'> & { kind: 'TEXT'; target_type: 'PDF' } {
  const pageIndex = highlight.position?.pageIndex ?? 0;
  const boundingRect = highlight.position?.boundingRect || highlight.highlightAreas?.[0];

  return {
    kind: 'TEXT' as const,
    target_type: 'PDF' as const,
    page_number: pageIndex + 1,
    anchor_json: {
      type: 'PDF_TEXT',
      position: {
        boundingRect: boundingRect
        ? {
            x1: ('left' in boundingRect ? boundingRect.left : 'x1' in boundingRect ? boundingRect.x1 : 0),
            y1: ('top' in boundingRect ? boundingRect.top : 'y1' in boundingRect ? boundingRect.y1 : 0),
            x2: ('left' in boundingRect ? boundingRect.left + boundingRect.width : 'x2' in boundingRect ? boundingRect.x2 : 0),
            y2: ('top' in boundingRect ? boundingRect.top + boundingRect.height : 'y2' in boundingRect ? boundingRect.y2 : 0),
            width: boundingRect.width || 0,
            height: boundingRect.height || 0,
          }
        : { x1: 0, y1: 0, x2: 0, y2: 0, width: 0, height: 0 },
        // CRITICAL FIX: Save actual rects for multi-line support
        rects: highlight.position?.rects || [],
        pageNumber: pageIndex + 1,
      },
      quote: highlight.content?.text || '',
    },
    color_key: colorKey,
    comment_text: highlight.comment?.message || undefined,
    tags_json: [],
  };
}

/**
 * Batch convert backend highlights to ReactPDF format
 * Accepts both BackendHighlight and Cornell Highlight types
 */
export function convertHighlightsToReactPDF(
  highlights: Array<BackendHighlight | any>
): ReactPDFHighlight[] {
  return highlights
    .map((h) => {
      // Direct pass-through, assuming data is in correct BackendHighlight format
      return backendToReactPDF(h as BackendHighlight);
    })
    .filter((h): h is ReactPDFHighlight => h !== null);
}
