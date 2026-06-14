import { useState } from 'react';
import { Globe, Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage, type Lang } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

const LANG_OPTIONS: { key: Lang; label: string }[] = [
  { key: 'zh', label: '简体中文' },
  { key: 'zh-TW', label: '繁體中文' },
  { key: 'en', label: 'English' },
  { key: 'ja', label: '日本語' },
  { key: 'ko', label: '한국어' },
  { key: 'fr', label: 'Français' },
  { key: 'es', label: 'Español' },
  { key: 'ru', label: 'Русский' },
  { key: 'ar', label: 'العربية' },
];

function DarkToggle() {
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} aria-label={t('common.themeToggle')} className="p-1.5 rounded-full hover:bg-charcoal/5 transition-colors">
      {theme === 'dark' ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} className="text-charcoal/50" />}
    </button>
  );
}

export default function HeaderBar() {
  const { t } = useTranslation();
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <header className="pt-10 pb-3 px-5 flex items-center justify-between border-b border-black/5 bg-paper shrink-0 relative">
      <h1 className="text-lg font-semibold tracking-wide text-charcoal">
        {t('app.title')}
      </h1>
      <div className="flex items-center gap-1">
        <DarkToggle />
        <button
          onClick={() => setOpen(!open)}
          aria-label={t('common.languageSelect')}
          className="p-1.5 rounded-full hover:bg-charcoal/5 transition-colors"
        >
          <Globe size={18} className="text-charcoal/60" />
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
          <div className="absolute top-12 right-3 z-[100] bg-white rounded-xl shadow-xl border border-charcoal/10 py-1.5 w-36 animate-[slideDown_0.15s_ease-out]">
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => { setLang(opt.key); setOpen(false); }}
                className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                  lang === opt.key ? 'text-jade font-semibold bg-jade/5' : 'text-charcoal/60 hover:bg-charcoal/3'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </header>
  );
}
