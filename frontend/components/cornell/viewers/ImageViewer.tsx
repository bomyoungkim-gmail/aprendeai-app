import React, { useState, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect } from 'react-konva';
import useImage from 'use-image';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { Content, Highlight, ViewMode } from '@/lib/types/cornell';

interface ImageViewerProps {
  content: Content;
  mode: ViewMode;
  highlights?: Highlight[];
  onCreateHighlight?: (highlight: any) => Promise<void>;
}

export function ImageViewer({ content, mode, highlights = [], onCreateHighlight }: ImageViewerProps) {
  const [image] = useImage(content.file?.viewUrl || '');
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const stageRef = useRef<any>(null);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    // Clamp scale
    const clampedScale = Math.max(0.5, Math.min(3, newScale));

    setScale(clampedScale);

    // Adjust position to zoom towards pointer
    if (pointer) {
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };
      setPosition(newPos);
    }
  };

  const handleMouseDown = (e: any) => {
    if (mode !== 'study') return;
    
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const relativePos = {
      x: (pos.x - position.x) / scale,
      y: (pos.y - position.y) / scale,
    };

    setIsSelecting(true);
    setSelection({
      x: relativePos.x,
      y: relativePos.y,
      width: 0,
      height: 0,
    });
  };

  const handleMouseMove = (e: any) => {
    if (!isSelecting || !selection) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const relativePos = {
      x: (pos.x - position.x) / scale,
      y: (pos.y - position.y) / scale,
    };

    setSelection({
      ...selection,
      width: relativePos.x - selection.x,
      height: relativePos.y - selection.y,
    });
  };

  const handleMouseUp = async () => {
    if (!isSelecting || !selection) return;
    setIsSelecting(false);

    // Only create highlight if selection is significant
    if (Math.abs(selection.width) > 10 && Math.abs(selection.height) > 10) {
      // Normalize selection (handle negative width/height from drag)
      const normalizedSelection = {
        x: selection.width < 0 ? selection.x + selection.width : selection.x,
        y: selection.height < 0 ? selection.y + selection.height : selection.y,
        w: Math.abs(selection.width),
        h: Math.abs(selection.height),
      };

      try {
        // Call API to create highlight
        await onCreateHighlight?.({
          kind: 'AREA' as const,
          targetType: 'IMAGE' as const,
          anchorJson: {
            type: 'IMAGE_AREA' as const,
            rect: normalizedSelection,
            zoom: scale,
            viewport: image ? { width: image.width, height: image.height } : { width: 0, height: 0 },
          },
          colorKey: 'yellow',
          commentText: '',
          tagsJson: [],
        });
      } catch (error) {
        console.error('Failed to create highlight:', error);
        // TODO: Show error toast
      }
    }

    setSelection(null);
  };

  const handleZoomIn = () => setScale((s) => Math.min(s * 1.2, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s / 1.2, 0.5));
  const handleFitToScreen = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  if (!content.file?.viewUrl) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No image file available</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
        <div className="text-white text-sm">
          {image ? `${image.width} × ${image.height}px` : 'Loading...'}
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
            onClick={handleFitToScreen}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded ml-2"
            title="Fit to screen"
          >
            <Maximize2 className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <Stage
          ref={stageRef}
          width={window.innerWidth}
          height={window.innerHeight - 64}
          scaleX={scale}
          scaleY={scale}
          x={position.x}
          y={position.y}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          draggable={!isSelecting}
        >
          <Layer>
            {image && <KonvaImage image={image} />}

            {/* Existing highlights */}
            {highlights
              ?.filter((h) => h.targetType === 'IMAGE')
              .map((h) => {
                const anchor = h.anchorJson as any;
                return (
                  <Rect
                    key={h.id}
                    x={anchor.rect?.x || 0}
                    y={anchor.rect?.y || 0}
                    width={anchor.rect?.w || 0}
                    height={anchor.rect?.h || 0}
                    stroke="#fdd835"
                    strokeWidth={2 / scale}
                    dash={[5 / scale, 5 / scale]}
                    listening={false}
                  />
                );
              })}

            {/* Current selection */}
            {isSelecting && selection && (
              <Rect
                x={selection.x}
                y={selection.y}
                width={selection.width}
                height={selection.height}
                stroke="#42a5f5"
                strokeWidth={2 / scale}
                dash={[5 / scale, 5 / scale]}
                listening={false}
              />
            )}
          </Layer>
        </Stage>
      </div>

      {/* Mode Indicator */}
      {mode === 'study' && (
        <div className="absolute top-20 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium">
          Study Mode - Click and drag to highlight
        </div>
      )}
    </div>
  );
}
