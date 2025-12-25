/**
 * Highlight Adapter
 * Converts between @react-pdf-viewer highlight format and backend Highlight model
 */

export interface BackendHighlight {
  id: string;
  contentId: string;
  userId: string;
  kind: 'HIGHLIGHT' | 'UNDERLINE' | 'STRIKETHROUGH';
  targetType: 'PDF_TEXT' | 'PDF_RECT';
  pageNumber: number | null;
  anchorJson: {
    startOffset: number;
    endOffset: number;
    boundingRect?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    pageIndex?: number;
    text?: string;
  };
  colorKey: string;
  commentText: string | null;
  tagsJson: string[];
  createdAt: string;
  updatedAt: string;
}

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
}

/**
 * Convert backend highlight to @react-pdf-viewer format
 */
export function backendToReactPDF(highlight: BackendHighlight): ReactPDFHighlight | null {
  try {
    const { anchorJson, colorKey, commentText, pageNumber } = highlight;
    const pageIndex = pageNumber !== null ? pageNumber - 1 : 0; // Backend uses 1-indexed pages

    // Extract bounding rect from anchorJson
    const boundingRect = anchorJson.boundingRect || {
      x: 0,
      y: 0,
      width: 100,
      height: 20,
    };

    return {
      id: highlight.id,
      content: {
        text: anchorJson.text || '',
      },
      position: {
        boundingRect: {
          x1: boundingRect.x,
          y1: boundingRect.y,
          x2: boundingRect.x + boundingRect.width,
          y2: boundingRect.y + boundingRect.height,
          width: boundingRect.width,
          height: boundingRect.height,
          pageIndex,
        },
        rects: [
          {
            x1: boundingRect.x,
            y1: boundingRect.y,
            x2: boundingRect.x + boundingRect.width,
            y2: boundingRect.y + boundingRect.height,
            width: boundingRect.width,
            height: boundingRect.height,
            pageIndex,
          },
        ],
        pageIndex,
      },
      comment: {
        emoji: getEmojiForColor(colorKey),
        message: commentText || '',
      },
      highlightAreas: [
        {
          height: boundingRect.height,
          left: boundingRect.x,
          pageIndex,
          top: boundingRect.y,
          width: boundingRect.width,
        },
      ],
    };
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
): Omit<BackendHighlight, 'id' | 'createdAt' | 'updatedAt'> {
  const pageIndex = highlight.position?.pageIndex ?? 0;
  const boundingRect = highlight.position?.boundingRect || highlight.highlightAreas?.[0];

  return {
    contentId,
    userId,
    kind: 'HIGHLIGHT',
    targetType: 'PDF_TEXT',
    pageNumber: pageIndex + 1, // Backend uses 1-indexed pages
    anchorJson: {
      startOffset: 0, // Will be calculated if needed
      endOffset: highlight.content?.text?.length || 0,
      boundingRect: boundingRect
        ? {
            x: ('left' in boundingRect ? boundingRect.left : 'x1' in boundingRect ? boundingRect.x1 : 0),
            y: ('top' in boundingRect ? boundingRect.top : 'y1' in boundingRect ? boundingRect.y1 : 0),
            width: boundingRect.width || 0,
            height: boundingRect.height || 0,
          }
        : undefined,
      pageIndex,
      text: highlight.content?.text || '',
    },
    colorKey,
    commentText: highlight.comment?.message || null,
    tagsJson: [],
  };
}

/**
 * Get emoji representation for color key
 */
function getEmojiForColor(colorKey: string): string {
  const emojiMap: Record<string, string> = {
    yellow: '💛',
    green: '💚',
    blue: '💙',
    red: '❤️',
    purple: '💜',
    orange: '🧡',
  };
  return emojiMap[colorKey] || '💡';
}

/**
 * Get CSS color for highlight color key
 */
export function getColorForKey(colorKey: string): string {
  const colorMap: Record<string, string> = {
    yellow: 'rgba(255, 235, 59, 0.3)',
    green: 'rgba(76, 175, 80, 0.3)',
    blue: 'rgba(33, 150, 243, 0.3)',
    red: 'rgba(244, 67, 54, 0.3)',
    purple: 'rgba(156, 39, 176, 0.3)',
    orange: 'rgba(255, 152, 0, 0.3)',
  };
  return colorMap[colorKey] || colorMap.yellow;
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
      // Convert to BackendHighlight if needed
      const backendHighlight: BackendHighlight = h.kind === 'TEXT' || h.kind === 'AREA' 
        ? {
            ...h,
            kind: 'HIGHLIGHT' as const,
            targetType: h.targetType === 'PDF' ? 'PDF_TEXT' as const : 'PDF_RECT' as const,
            pageNumber: h.pageNumber ?? null,
            commentText: h.commentText ?? null,
          }
        : h;
      return backendToReactPDF(backendHighlight);
    })
    .filter((h): h is ReactPDFHighlight => h !== null);
}
