import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react';
import CloudPattern from '../svgs/CloudPattern';
import RuyiPattern from '../svgs/RuyiPattern';
import DragonPattern from '../svgs/DragonPattern';
import HuiwenPattern from '../svgs/HuiwenPattern';
import CustomPattern from '../svgs/CustomPattern';
import type { Pattern } from '../../types';

interface PatternCardProps { pattern: Pattern; onClick: () => void; }

const SVG_MAP = { cloud: CloudPattern, ruyi: RuyiPattern, dragon: DragonPattern, huiwen: HuiwenPattern } as const;

function pfield(pattern: Pattern, field: string, t: ReturnType<typeof useTranslation>['t']): string {
  if (pattern.svgId !== 'custom') return t(`pattern.${pattern.svgId}.${field}`);
  return (pattern as any)[field] || '';
}

export default function PatternCard({ pattern, onClick }: PatternCardProps) {
  const { t } = useTranslation();
  const Svg = SVG_MAP[pattern.svgId as keyof typeof SVG_MAP];
  const isCustom = pattern.svgId === 'custom';

  return (
    <button onClick={onClick} className="bg-white rounded-2xl p-4 shadow-sm border border-charcoal/5 text-left hover:shadow-md hover:border-jade/20 active:scale-[0.98] transition-all relative">
      {isCustom && (
        <span className="absolute top-2 right-2 z-10 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-jade text-white text-[9px] font-medium"><User size={10} />{t('common.my')}</span>
      )}
      <div className="w-full aspect-square rounded-xl bg-paper mb-3 overflow-hidden p-2">
        {isCustom && pattern.customPaths ? <CustomPattern variant="color" paths={pattern.customPaths || []} viewBox={pattern.customViewBox} /> : <Svg variant="color" />}
      </div>
      <h3 className="font-semibold text-sm text-charcoal">{pfield(pattern, 'name', t)}</h3>
      <p className="text-xs text-charcoal/50 mt-0.5">{pfield(pattern, 'meaning', t)}</p>
    </button>
  );
}
