import { useTranslation } from 'react-i18next';
import { themes } from '../../data/colors';

export default function PalettePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-full p-5 pb-8 space-y-5">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-charcoal">{t('palette.title')}</h2>
        <p className="text-xs text-charcoal/40 mt-1 leading-relaxed">{t('palette.description')}</p>
      </div>

      {themes.map((theme) => (
        <div key={theme.id} className="bg-white rounded-2xl p-4 border border-charcoal/5 shadow-sm">
          <h3 className="font-semibold text-sm text-charcoal mb-0.5">{t(`palette.${theme.id}.name`)}</h3>
          <p className="text-[11px] text-charcoal/40 mb-3 leading-relaxed">{t(`palette.${theme.id}.desc`)}</p>
          <div className="space-y-2.5">
            {theme.colors.map((c, ci) => (
              <div key={c.hex} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg shadow-sm shrink-0 mt-0.5" style={{ backgroundColor: c.hex }} />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-charcoal">{t(`palette.${theme.id}.colors.${ci}.name`)}</span>
                    <span className="text-[10px] text-charcoal/30 font-mono">{c.hex}</span>
                  </div>
                  <p className="text-[11px] text-charcoal/50 leading-relaxed mt-0.5">{t(`palette.${theme.id}.colors.${ci}.desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
