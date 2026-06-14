import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import CloudPattern from '../svgs/CloudPattern';
import RuyiPattern from '../svgs/RuyiPattern';
import DragonPattern from '../svgs/DragonPattern';
import HuiwenPattern from '../svgs/HuiwenPattern';
import { patterns } from '../../data/patterns';
import type { Pattern } from '../../types';

const SVG_MAP: Record<Pattern['svgId'], React.ComponentType<any>> = {
  cloud: CloudPattern, dragon: DragonPattern, huiwen: HuiwenPattern, ruyi: RuyiPattern, custom: () => null,
};
const BUILT_IN = patterns.filter((p) => ['cloud','dragon','huiwen','ruyi'].includes(p.svgId));

export default function FeaturedPattern() {
  const [index, setIndex] = useState(0);
  const { t } = useTranslation();
  useEffect(() => { const t = setInterval(() => setIndex((i) => (i + 1) % BUILT_IN.length), 3500); return () => clearInterval(t); }, []);
  const p = BUILT_IN[index];
  const Svg = SVG_MAP[p.svgId];
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-56 h-56 animate-[float_6s_ease-in-out_infinite]"><Svg variant="color" /></div>
      <p className="text-sm font-medium text-charcoal">{t(`pattern.${p.svgId}.name`)}</p>
      <div className="flex gap-1.5">{BUILT_IN.map((_, i) => <button key={i} onClick={() => setIndex(i)} className={`w-2 h-2 rounded-full transition-all ${i === index ? 'bg-jade w-5' : 'bg-charcoal/20 hover:bg-charcoal/40'}`} />)}</div>
    </div>
  );
}
