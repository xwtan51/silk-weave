import { useState, useRef } from 'react';
import { X, Check, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useTranslation } from 'react-i18next';

function pfield(pattern: Pattern, field: string, t: ReturnType<typeof useTranslation>['t']): string {
  if (pattern.svgId !== 'custom') return t(`pattern.${pattern.svgId}.${field}`);
  return (pattern as any)[field] || '';
}
import CloudPattern, { cloudPathIds } from '../svgs/CloudPattern';
import RuyiPattern, { ruyiPathIds } from '../svgs/RuyiPattern';
import DragonPattern, { dragonPathIds } from '../svgs/DragonPattern';
import HuiwenPattern, { huiwenPathIds } from '../svgs/HuiwenPattern';
import CustomPattern from '../svgs/CustomPattern';
import { themes, type SwatchColor } from '../../data/colors';
import type { Pattern } from '../../types';

const SVG_MAP: Record<string, React.ComponentType<any>> = { cloud: CloudPattern, ruyi: RuyiPattern, dragon: DragonPattern, huiwen: HuiwenPattern, custom: CustomPattern };
const RECOMMENDED_THEME: Record<string, string> = { cloud: 'celadon', dragon: 'imperial', ruyi: 'silk', huiwen: 'celadon', custom: 'imperial' };
const PATH_IDS: Record<string, string[]> = { cloud: cloudPathIds, ruyi: ruyiPathIds, dragon: dragonPathIds, huiwen: huiwenPathIds, custom: [] };

interface DetailModalProps { pattern: Pattern; onClose: () => void; onColorPattern?: (p: Pattern) => void; }

function themeColors(pathIds: string[], palette: SwatchColor[]): Record<string, string> {
  const m: Record<string, string> = {};
  pathIds.forEach((id, i) => { m[id] = palette[i % palette.length].hex; });
  return m;
}

export default function DetailModal({ pattern, onClose, onColorPattern }: DetailModalProps) {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const SvgComponent = SVG_MAP[pattern.svgId];
  const isCustom = pattern.svgId === 'custom';
  const paletteTheme = isCustom ? themes[0] : (themes.find((th) => th.id === RECOMMENDED_THEME[pattern.svgId]) ?? themes[0]);
  const pathIds = isCustom ? (pattern.customPaths ?? []).map((p) => p.id) : PATH_IDS[pattern.svgId];
  const cardColors = isCustom ? {} : themeColors(pathIds, paletteTheme.colors);

  const handleCopy = async (hex: string) => { try { await navigator.clipboard.writeText(hex); } catch { /* */ } setCopiedHex(hex); setTimeout(() => setCopiedHex(null), 1500); };

  const handleSaveCard = async () => {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, { quality: 0.95, pixelRatio: 3, backgroundColor: '#F9F6F0' });
    const name = pfield(pattern, 'name', t);
    const link = document.createElement('a'); link.download = `${name}-palette-card.png`; link.href = dataUrl; link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-paper rounded-t-3xl sm:rounded-3xl max-h-[85vh] w-[92%] max-w-[340px] overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease-out] relative mx-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="sticky top-3 float-right mr-3 z-10 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors"><X size={18} className="text-charcoal" /></button>

        <div className="px-5 pt-4 pb-6 space-y-4">
          {/* Palette card capture */}
          <div ref={cardRef} className="bg-paper rounded-xl p-4 space-y-3">
            <div className="w-full h-40 bg-white rounded-lg flex items-center justify-center p-3">
              {isCustom && pattern.customPaths ? (
                <CustomPattern variant="color" fillColors={{}} paths={pattern.customPaths} viewBox={pattern.customViewBox} />
              ) : (
                <SvgComponent variant="color" fillColors={cardColors} />
              )}
            </div>
            <h2 className="text-lg font-semibold text-charcoal text-center">{pfield(pattern, 'name', t)}</h2>
            <div className="flex flex-wrap gap-1.5 justify-center">
              <Tag label={pfield(pattern, 'dynasty', t)} />
              <Tag label={pfield(pattern, 'meaning', t)} />
              <Tag label={pfield(pattern, 'scene', t)} />
            </div>

            {/* Recommended palette — built-in only */}
            {!isCustom && (
              <div>
                <p className="text-[10px] font-medium text-charcoal/30 text-center mb-2">
                  {t('detail.recommendedPalette')}{t(`palette.${paletteTheme.id}.name`)}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {paletteTheme.colors.map((c, ci) => (
                    <button key={c.hex} onClick={() => handleCopy(c.hex)} className="flex flex-col items-center gap-1 group">
                      <span className="relative w-8 h-8 rounded-lg shadow-sm group-hover:scale-110 active:scale-95 transition-transform" style={{ backgroundColor: c.hex }}>
                        {copiedHex === c.hex && <span className="absolute inset-0 flex items-center justify-center"><Check size={13} className="text-white drop-shadow" /></span>}
                      </span>
                      <span className="text-[9px] text-charcoal/40 group-hover:text-jade transition-colors">{t(`palette.${paletteTheme.id}.colors.${ci}.name`)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Save card */}
          <button onClick={handleSaveCard} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-vermillion text-white text-xs font-medium hover:bg-vermillion/90 active:scale-[0.98] transition-all">
            <Download size={14} />{t('detail.saveCard')}
          </button>

          {/* Story */}
          <div className="space-y-2">
            {splitSentences(pfield(pattern, 'story', t)).map((s, i) => (
              <p key={i} className="text-sm leading-relaxed text-charcoal/70" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: `${0.3 + i * 0.25}s` }}>{s}</p>
            ))}
          </div>

          {/* Source */}
          <p className="text-[11px] text-charcoal/30">{t('detail.source')}: {pfield(pattern, 'source', t)}</p>

          {/* Color This Pattern — built-in only */}
          {!isCustom && onColorPattern && (
            <button onClick={() => onColorPattern(pattern)} className="w-full py-3 rounded-xl bg-jade text-white font-medium text-sm hover:bg-jade/90 active:scale-[0.98] transition-all">
              {t('detail.colorIt')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return <span className="px-2 py-0.5 rounded-full bg-paper border border-charcoal/10 text-[10px] text-charcoal/50">{label}</span>;
}

function splitSentences(text: string): string[] {
  const isChinese = /[一-鿿]/.test(text);
  return text.split(/[.。！!]/).map((s) => s.trim()).filter(Boolean).map((s) => isChinese ? s + '。' : s + '.');
}
