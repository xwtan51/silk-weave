import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StartButtonProps {
  onClick: () => void;
}

export default function StartButton({ onClick }: StartButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-8 py-3 rounded-full bg-jade text-white text-sm font-medium hover:bg-jade/90 active:scale-95 transition-all shadow-md"
    >
      {t('hero.startJourney')}
      <ArrowRight size={16} />
    </button>
  );
}
