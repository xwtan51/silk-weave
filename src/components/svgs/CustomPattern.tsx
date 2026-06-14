import type { CustomPath } from '../../types';

interface CustomPatternProps {
  variant?: 'color' | 'outline';
  fillColors?: Record<string, string>;
  onPathClick?: (pathId: string) => void;
  paths: CustomPath[];
  viewBox?: string;
  imageUrl?: string;
}

const PALETTE = ['#FF4C00', '#F0C239', '#D9B611', '#2EDFA3', '#622A1D', '#8DD4E8', '#1685A9', '#F3A694'];

export default function CustomPattern({
  variant = 'color',
  fillColors = {},
  onPathClick,
  paths,
  viewBox = '0 0 1024 1024',
  imageUrl,
}: CustomPatternProps) {
  const isOutline = variant === 'outline';
  const getFill = (id: string, idx: number, baked?: string) =>
    fillColors[id] || (isOutline ? 'transparent' : (baked || PALETTE[idx % PALETTE.length]));

  return (
    <svg viewBox={viewBox} className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {imageUrl ? (
        <image href={imageUrl} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" />
      ) : (
        <g stroke="#1C1C1C" strokeWidth={isOutline ? '1.5' : '0'} strokeLinejoin="round" strokeLinecap="round">
          {paths.map((p, i) => {
            if (p.stroke) {
              return (
                <path key={p.id} id={p.id} data-path-id={p.id} d={p.d}
                  fill="none" stroke={p.stroke} strokeWidth={p.strokeWidth || 2}
                  strokeLinecap="round" strokeLinejoin="round"
                  onClick={() => onPathClick?.(p.id)}
                  style={{ cursor: isOutline ? 'pointer' : 'default' }} />
              );
            }
            return (
              <path key={p.id} id={p.id} data-path-id={p.id} d={p.d}
                fill={getFill(p.id, i, p.fill)}
                onClick={() => onPathClick?.(p.id)}
                style={{ cursor: isOutline ? 'pointer' : 'default' }} />
            );
          })}
        </g>
      )}
    </svg>
  );
}

export { PALETTE as customPalette };
