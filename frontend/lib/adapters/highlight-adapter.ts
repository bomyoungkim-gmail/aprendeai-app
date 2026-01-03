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
    const commentText = highlight.commentText || (highlight as any).comment_text;
    const pageNumber = highlight.pageNumber || (highlight as any).page_number;
    const tags = highlight.tagsJson || (highlight as any).tags_json || [];
    
    // Infer color from tags (Pedagogical Palette)
    // Evidence: yellow, Vocab: blue, Main Idea: green, Doubt: red
    let effectiveColorKey = highlight.colorKey || 'yellow';
    const lowerTags = tags.map((t: string) => t.toLowerCase());

    if (lowerTags.some((t: string) => ['doubt', 'question', 'duvida'].includes(t))) {
      effectiveColorKey = 'red';
    } else if (lowerTags.some((t: string) => ['main-idea', 'star', 'important', 'ideia-central'].includes(t))) {
      effectiveColorKey = 'green';
    } else if (lowerTags.some((t: string) => ['vocab', 'note', 'vocabulary', 'vocabulario'].includes(t))) {
      effectiveColorKey = 'blue';
    }

    // Robust access to anchor data
    const anchorJson = highlight.anchorJson || (highlight as any).anchor_json;
    
    // Validate anchor presence
    if (!anchorJson) return null;

    const pageIndex = (pageNumber ?? 1) - 1; // Backend uses 1-indexed pages

    // Handle PDF_TEXT type - Ultra Permissive check to handle missing targetType/malformed data
    // We check if it LOOKS like a PDF text anchor (has position or boundingRect)
    const anyAnchor = anchorJson as any;
    
    // Check for ANY evidence of position data
    const hasPosition = anyAnchor.position && (
      anyAnchor.position.boundingRect || 
      anyAnchor.position.rects || 
      (anyAnchor.position.x1 !== undefined) // Direct coordinates support
    );
    
    // Also support flat anchor format (legacy/migration)
    const hasFlatPosition = anyAnchor.boundingRect || anyAnchor.rects;

    const isPDFAnchor = 
      (anchorJson.type === 'PDF_TEXT') ||
      hasPosition ||
      hasFlatPosition;

    if (isPDFAnchor) {
       // Normalize position data access (support both nested and flat structures)
       const positionSource = anyAnchor.position || anyAnchor;
       
       const boundingRect = positionSource.boundingRect || { x1: 0, y1: 0, x2: 0, y2: 0, width: 0, height: 0 };
       const rects = Array.isArray(positionSource.rects) ? positionSource.rects : [];
       const quote = anyAnchor.quote || '';

       return {
        id: highlight.id,
        content: {
          text: quote,
        },
        position: {
          boundingRect: {
            x1: boundingRect.x1 || 0,
            y1: boundingRect.y1 || 0,
            x2: boundingRect.x2 || 0,
            y2: boundingRect.y2 || 0,
            width: boundingRect.width || 0,
            height: boundingRect.height || 0,
            pageIndex,
          },
          rects: rects.map((r: any) => ({
             x1: r.x1 || 0,
             y1: r.y1 || 0,
             x2: r.x2 || 0,
             y2: r.y2 || 0,
             width: r.width || 0,
             height: r.height || 0,
             pageIndex: typeof r.pageNumber === 'number' ? Math.max(0, r.pageNumber - 1) : pageIndex, 
          })),
          pageIndex,
        },
        comment: {
          emoji: getEmojiForColor(effectiveColorKey),
          message: commentText || '',
        },
        // Reconstruct highlightAreas from position.rects for multi-line support
        highlightAreas: rects.length > 0
          ? rects.map((rect: any) => ({
              height: rect.height || 0,
              left: rect.x1 || 0,
              pageIndex: typeof rect.pageNumber === 'number' ? Math.max(0, rect.pageNumber - 1) : pageIndex,
              top: rect.y1 || 0,
              width: rect.width || 0,
            }))
          : [
              // Fallback to single area from boundingRect
              {
                height: boundingRect.height || 0,
                left: boundingRect.x1 || 0,
                pageIndex,
                top: boundingRect.y1 || 0,
                width: boundingRect.width || 0,
              },
            ],
        colorKey: effectiveColorKey, // Include the inferred color key
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
  type: string = 'EVIDENCE',
  colorKey: string = 'yellow',
  tags: string[] = []
): Omit<import('@/lib/types/cornell').CreateHighlightDto, 'kind' | 'target_type'> & { kind: 'TEXT'; target_type: 'PDF' } {
  const pageIndex = highlight.position?.pageIndex ?? 0;
  const boundingRect = highlight.position?.boundingRect || highlight.highlightAreas?.[0];

  return {
    type,
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
        rects: highlight.position?.rects?.map(r => ({
          x1: r.x1,
          y1: r.y1,
          x2: r.x2,
          y2: r.y2,
          width: r.width,
          height: r.height,
          pageNumber: typeof r.pageIndex === 'number' ? r.pageIndex + 1 : pageIndex + 1,
        })) || [],
        pageNumber: pageIndex + 1,
      },
      quote: highlight.content?.text || '',
    },
    color_key: colorKey,
    comment_text: highlight.comment?.message || undefined,
    tags_json: tags,
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
