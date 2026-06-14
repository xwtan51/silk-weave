import { useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

interface DoodleCanvasProps {
  strokes: Stroke[];
  activeColor: string;
  brushSize: number;
  eraser: boolean;
  onAddStroke: (stroke: Stroke) => void;
}

const BRUSH_SIZES = [2, 4, 6, 10];

export default function DoodleCanvas({
  strokes, activeColor, brushSize, eraser, onAddStroke,
}: DoodleCanvasProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const currentPoints = useRef<{ x: number; y: number }[]>([]);

  const syncSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
    return rect;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = syncSize();
    if (!rect) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, rect.width, rect.height);
    for (const stroke of strokes) {
      drawStroke(ctx, stroke.points, stroke.color, rect.width, rect.height, stroke.width);
    }
  }, [strokes, syncSize]);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const cx = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const cy = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
    return { x: ((cx - rect.left) / rect.width) * 100, y: ((cy - rect.top) / rect.height) * 100 };
  }, []);

  const toCanvas = useCallback((pct: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: (pct.x / 100) * rect.width, y: (pct.y / 100) * rect.height };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    syncSize();
    isDrawing.current = true;
    currentPoints.current = [getPos(e as React.MouseEvent)];
  }, [getPos, syncSize]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e as React.MouseEvent);
    currentPoints.current.push(pos);
    const prev = currentPoints.current[currentPoints.current.length - 2];
    if (!prev) return;
    const cp = toCanvas(pos);
    const pp = toCanvas(prev);
    if (eraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = activeColor;
    }
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pp.x, pp.y);
    ctx.lineTo(cp.x, cp.y);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }, [activeColor, brushSize, eraser, getPos, toCanvas]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (currentPoints.current.length > 0 && !eraser) {
      onAddStroke({ points: [...currentPoints.current], color: activeColor, width: brushSize });
    }
    currentPoints.current = [];
  }, [activeColor, brushSize, eraser, onAddStroke]);

  return (
    <div className="bg-white rounded-2xl border border-charcoal/5 shadow-sm overflow-hidden">
      <canvas ref={canvasRef} id="doodle-canvas" className="w-full h-[260px] block"
        onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
        onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
        style={{ cursor: 'crosshair', touchAction: 'none' }} />
      <p className="text-center text-[10px] text-charcoal/30 pb-2">{t('create.doodleHint')}</p>
    </div>
  );
}

export function BrushSizeSelector({ size, onChange }: { size: number; onChange: (s: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {BRUSH_SIZES.map((s) => (
        <button key={s} onClick={() => onChange(s)}
          className={`rounded-full transition-all flex items-center justify-center ${s === size ? 'ring-2 ring-jade ring-offset-2 ring-offset-paper' : ''}`}>
          <span className="block rounded-full bg-charcoal/60" style={{ width: s + 4, height: s + 4 }} />
        </button>
      ))}
    </div>
  );
}

function drawStroke(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[], color: string, w: number, h: number, lw: number) {
  if (points.length < 2) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo((points[0].x / 100) * w, (points[0].y / 100) * h);
  for (let i = 1; i < points.length; i++) ctx.lineTo((points[i].x / 100) * w, (points[i].y / 100) * h);
  ctx.stroke();
}
