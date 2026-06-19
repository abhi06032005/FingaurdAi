'use client';

import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Pen, Eraser, Trash2 } from 'lucide-react';

export type DrawingTool = 'pen' | 'eraser';

export interface DrawingCanvasHandle {
  /** Extract 100 normalized Y values from the canvas drawing. Returns null if canvas is empty. */
  extractPattern: () => number[] | null;
  clear: () => void;
}

interface Props {
  width?: number;
  height?: number;
}

const CANVAS_W = 460;
const CANVAS_H = 160;
const LINE_WIDTH = 2.5;
const ERASER_RADIUS = 18;

/**
 * DrawingCanvas — compact freehand drawing canvas with pen/eraser/clear.
 * Exposes extractPattern() via ref for the parent to call on Search click.
 */
const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(function DrawingCanvas(
  _props,
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [tool, setTool] = useState<DrawingTool>('pen');
  const [hasDrawing, setHasDrawing] = useState(false);

  // --- Canvas context helpers ---
  const getCtx = useCallback(
    () => canvasRef.current?.getContext('2d') ?? null,
    [],
  );

  const getPos = useCallback(
    (e: PointerEvent | React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [],
  );

  // --- Initialize canvas with dark grid ---
  const initCanvas = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    // Fill background
    ctx.fillStyle = '#0f1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;

    const cols = 10;
    const rows = 5;
    const cw = canvas.width / cols;
    const rh = canvas.height / rows;

    for (let i = 1; i < cols; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cw, 0);
      ctx.lineTo(i * cw, canvas.height);
      ctx.stroke();
    }
    for (let j = 1; j < rows; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * rh);
      ctx.lineTo(canvas.width, j * rh);
      ctx.stroke();
    }

    // Hint label
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Draw your pattern here', canvas.width / 2, canvas.height / 2);
    ctx.textAlign = 'start';
  }, [getCtx]);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  // --- Drawing ---
  const startDraw = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      isDrawing.current = true;
      const pos = getPos(e);
      lastPos.current = pos;

      const ctx = getCtx();
      if (!ctx) return;

      if (tool === 'eraser') {
        ctx.clearRect(
          pos.x - ERASER_RADIUS,
          pos.y - ERASER_RADIUS,
          ERASER_RADIUS * 2,
          ERASER_RADIUS * 2,
        );
        // Redraw background under erased area
        ctx.fillStyle = '#0f1117';
        ctx.fillRect(
          pos.x - ERASER_RADIUS,
          pos.y - ERASER_RADIUS,
          ERASER_RADIUS * 2,
          ERASER_RADIUS * 2,
        );
      }
    },
    [getCtx, getPos, tool],
  );

  const draw = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current) return;
      const ctx = getCtx();
      if (!ctx) return;

      const pos = getPos(e);

      if (tool === 'pen') {
        ctx.beginPath();
        ctx.lineWidth = LINE_WIDTH;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#f97316'; // warm orange matching app primary
        if (lastPos.current) {
          ctx.moveTo(lastPos.current.x, lastPos.current.y);
        }
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        setHasDrawing(true);
      } else {
        // Eraser: repaint background + grid locally
        const r = ERASER_RADIUS;
        ctx.fillStyle = '#0f1117';
        ctx.fillRect(pos.x - r, pos.y - r, r * 2, r * 2);
      }

      lastPos.current = pos;
    },
    [getCtx, getPos, tool],
  );

  const endDraw = useCallback(() => {
    isDrawing.current = false;
    lastPos.current = null;
  }, []);

  // --- Clear ---
  const clear = useCallback(() => {
    initCanvas();
    setHasDrawing(false);
  }, [initCanvas]);

  // --- Extract pattern ---
  const extractPattern = useCallback((): number[] | null => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return null;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imageData;

    // For each of 100 evenly-spaced X columns, find the lowest Y that has a drawn pixel (non-background)
    const numPoints = 100;
    const colWidth = width / numPoints;
    const yValues: number[] = [];

    for (let i = 0; i < numPoints; i++) {
      const xStart = Math.floor(i * colWidth);
      const xEnd = Math.floor((i + 1) * colWidth);
      let lowestY: number | null = null;

      for (let x = xStart; x < xEnd && x < width; x++) {
        for (let y = 0; y < height; y++) {
          const pixelIdx = (y * width + x) * 4;
          const r = data[pixelIdx];
          const g = data[pixelIdx + 1];
          const b = data[pixelIdx + 2];
          const a = data[pixelIdx + 3];
          // Detect drawn orange pixels (not background #0f1117 ≈ r:15,g:17,b:23)
          if (a > 100 && (r > 100 || g > 100 || b > 100)) {
            if (lowestY === null || y < lowestY) lowestY = y;
          }
        }
      }
      yValues.push(lowestY !== null ? lowestY : -1);
    }

    // Check if anything was drawn (more than 10% columns have data)
    const drawnCols = yValues.filter(v => v >= 0).length;
    if (drawnCols < numPoints * 0.1) return null;

    // Fill gaps by interpolation
    const filled = [...yValues];
    // Forward fill first drawn value from left
    let lastGood = filled.find(v => v >= 0) ?? height / 2;
    for (let i = 0; i < filled.length; i++) {
      if (filled[i] < 0) {
        filled[i] = lastGood;
      } else {
        lastGood = filled[i];
      }
    }

    // Invert Y (canvas Y=0 is top, price Y=0 should mean low)
    const inverted = filled.map(y => height - 1 - y);

    // Min-max normalize to [0, 1]
    const minV = Math.min(...inverted);
    const maxV = Math.max(...inverted);
    const range = maxV - minV;
    if (range === 0) return null;

    return inverted.map(v => (v - minV) / range);
  }, [getCtx]);

  // Expose to parent
  useImperativeHandle(ref, () => ({ extractPattern, clear }), [
    extractPattern,
    clear,
  ]);

  return (
    <div className="flex flex-col gap-2">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5">
        <button
          id="pattern-tool-pen"
          onClick={() => setTool('pen')}
          title="Pen"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 border ${
            tool === 'pen'
              ? 'bg-primary/20 border-primary/50 text-primary'
              : 'bg-transparent border-border text-muted-foreground hover:border-border hover:text-foreground'
          }`}
        >
          <Pen size={12} />
          Pen
        </button>
        <button
          id="pattern-tool-eraser"
          onClick={() => setTool('eraser')}
          title="Eraser"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 border ${
            tool === 'eraser'
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-500'
              : 'bg-transparent border-border text-muted-foreground hover:border-border hover:text-foreground'
          }`}
        >
          <Eraser size={12} />
          Eraser
        </button>
        <div className="flex-1" />
        <button
          id="pattern-tool-clear"
          onClick={clear}
          title="Clear canvas"
          disabled={!hasDrawing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Trash2 size={12} />
          Clear
        </button>
      </div>

      {/* Canvas */}
      <div className="relative rounded-lg overflow-hidden border border-border/60">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          id="pattern-drawing-canvas"
          className="w-full h-auto block touch-none"
          style={{ cursor: tool === 'eraser' ? 'cell' : 'crosshair' }}
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
        />
        {/* Axis labels */}
        <div className="absolute bottom-1 left-1.5 text-[9px] text-white/20 font-mono pointer-events-none">
          Past
        </div>
        <div className="absolute bottom-1 right-1.5 text-[9px] text-white/20 font-mono pointer-events-none">
          Now
        </div>
        <div
          className="absolute left-1 top-1 text-[9px] text-white/20 font-mono pointer-events-none"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          Price ↑
        </div>
      </div>
    </div>
  );
});

export default DrawingCanvas;
