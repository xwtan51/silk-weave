import { useTranslation } from 'react-i18next';
import PatternCard from './PatternCard';
import type { Pattern } from '../../types';

interface PatternCardGridProps {
  patterns: Pattern[];
  onPatternClick: (pattern: Pattern) => void;
}

export default function PatternCardGrid({
  patterns,
  onPatternClick,
}: PatternCardGridProps) {
  const { t } = useTranslation();

  if (patterns.length === 0) {
    return (
      <p className="text-center text-charcoal/30 text-sm mt-20">
        {t('common.noResults')}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {patterns.map((p) => (
        <PatternCard
          key={p.id}
          pattern={p}
          onClick={() => onPatternClick(p)}
        />
      ))}
    </div>
  );
}
