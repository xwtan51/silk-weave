import { useTranslation } from 'react-i18next';
import type { Pattern } from '../../types';

interface PatternSelectorProps {
  patterns: Pattern[];
  selectedSvgId: Pattern['svgId'];
  onChange: (svgId: Pattern['svgId']) => void;
}

export default function PatternSelector({ patterns, selectedSvgId, onChange }: PatternSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2">
      {patterns.map((p) => (
        <button key={p.svgId} onClick={() => onChange(p.svgId)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
            selectedSvgId === p.svgId ? 'bg-jade text-white' : 'bg-white text-charcoal/50 border border-charcoal/10 hover:border-jade/30'
          }`}>
          {t(`pattern.${p.svgId}.name`)}
        </button>
      ))}
    </div>
  );
}
