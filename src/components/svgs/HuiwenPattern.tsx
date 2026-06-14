interface HuiwenPatternProps {
  variant?: 'color' | 'outline';
  fillColors?: Record<string, string>;
  onPathClick?: (pathId: string) => void;
}

const DEFAULT_COLORS: Record<string, string> = {
  'huiwen-1': '#8DD4E8', // 天青 — 雨过天青
};

export default function HuiwenPattern({
  variant = 'color',
  fillColors = DEFAULT_COLORS,
  onPathClick,
}: HuiwenPatternProps) {
  const isOutline = variant === 'outline';
  const getFill = (id: string) =>
    fillColors[id] || (isOutline ? 'transparent' : (DEFAULT_COLORS[id] || '#e5e5e5'));

  return (
    <svg
      viewBox="0 0 1024 1024"
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        stroke="#1C1C1C"
        strokeWidth={isOutline ? '1.5' : '0'}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path
          id="huiwen-1"
          data-path-id="huiwen-1"
          d="M486.4 988.16H30.72V476.16h378.88V112.64H107.52v220.16h148.48V256H181.76V179.2H332.8v230.4H30.72V35.84h455.68v517.12H107.52v358.4h302.08v-220.16H261.12v66.56h74.24v76.8H184.32v-220.16h302.08v373.76zM998.4 988.16h-455.68v-373.76h302.08v220.16h-151.04v-76.8H768v-66.56h-148.48v220.16h302.08v-358.4h-378.88V35.84h455.68v373.76h-302.08V179.2h151.04v76.8H773.12v76.8h148.48V112.64h-302.08v363.52h378.88v512z"
          fill={getFill('huiwen-1')}
          onClick={() => onPathClick?.('huiwen-1')}
          style={{ cursor: isOutline ? 'pointer' : 'default' }}
        />
      </g>
    </svg>
  );
}

export const huiwenPathIds = ['huiwen-1'];
