import { useTranslation } from 'react-i18next';

export default function Slogan() {
  const { t } = useTranslation();

  return (
    <div className="text-center">
      <p className="text-2xl leading-relaxed text-charcoal font-serif italic tracking-wide">
        {t('hero.slogan')}
      </p>
    </div>
  );
}
