import { PaintBucket, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type CreateMode = 'fill' | 'doodle';

interface ModeToggleProps {
  mode: CreateMode;
  onChange: (mode: CreateMode) => void;
}

const MODES: { key: CreateMode; labelKey: string; icon: typeof PaintBucket }[] = [
  { key: 'fill', labelKey: 'create.modeFill', icon: PaintBucket },
  { key: 'doodle', labelKey: 'create.modeDoodle', icon: Pencil },
];

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const { t } = useTranslation();

  return (
    <div className="flex bg-charcoal/5 rounded-xl p-1">
      {MODES.map(({ key, labelKey, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
            mode === key
              ? 'bg-white text-jade shadow-sm'
              : 'text-charcoal/40 hover:text-charcoal/60'
          }`}
        >
          <Icon size={15} />
          {t(labelKey)}
        </button>
      ))}
    </div>
  );
}
