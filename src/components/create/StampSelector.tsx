export interface StampShape {
  id: string;
  label: string;
}

interface StampSelectorProps {
  stamps: StampShape[];
  activeStampId: string;
  onChange: (id: string) => void;
}

export const STAMP_SHAPES: StampShape[] = [
  { id: 'cloud', label: '云' },
  { id: 'swirl', label: '旋' },
  { id: 'ruyi', label: '如意' },
  { id: 'pearl', label: '珠' },
];

export default function StampSelector({
  stamps,
  activeStampId,
  onChange,
}: StampSelectorProps) {
  return (
    <div className="flex items-center gap-1.5 justify-center">
      {stamps.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-medium transition-all ${
            activeStampId === s.id
              ? 'bg-jade text-white shadow-sm'
              : 'bg-white text-charcoal/50 border border-charcoal/10 hover:border-jade/30'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
