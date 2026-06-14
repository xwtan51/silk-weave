import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export type Lang = 'en' | 'zh' | 'zh-TW' | 'ja' | 'ko' | 'fr' | 'es' | 'ru' | 'ar';

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getSavedLang(): Lang {
  try {
    const saved = localStorage.getItem('silkweave-lang');
    if (saved && ['en','zh','zh-TW','ja','ko','fr','es','ru','ar'].includes(saved)) return saved as Lang;
  } catch {}
  return 'zh';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState<Lang>(getSavedLang);

  // Sync i18n to saved language on first load
  useEffect(() => {
    if (i18n.language !== lang) i18n.changeLanguage(lang);
  }, []);

  const changeLang = (l: Lang) => {
    setLang(l);
    i18n.changeLanguage(l);
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    try { localStorage.setItem('silkweave-lang', l); } catch {}
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
