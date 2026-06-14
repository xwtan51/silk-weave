import { useTranslation } from 'react-i18next';
import type { Theme } from '../../data/colors';

interface ThemeSelectorProps { themes: Theme[]; activeId: string; onChange: (id: string) => void; }

export default function ThemeSelector({ themes, activeId, onChange }: ThemeSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex justify-center gap-1.5 flex-wrap">
      {themes.map((theme) => (
        <button key={theme.id} onClick={() => onChange(theme.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
            theme.id === activeId ? 'bg-jade text-white shadow-sm' : 'bg-white text-charcoal/50 border border-charcoal/10 hover:border-jade/30'
          }`}>
          <span className="w-3 h-3 rounded-full shrink-0 border border-white/50" style={{ backgroundColor: theme.colors[0].hex }} />
          {theme.id.startsWith('ai-') ? theme.name : t(`palette.${theme.id}.name`)}
        </button>
      ))}
    </div>
  );
}
