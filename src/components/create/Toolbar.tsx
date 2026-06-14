import { Undo2, RotateCcw, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ToolbarProps {
  canUndo: boolean;
  onUndo: () => void;
  onReset: () => void;
  onShare: () => void;
}

export default function Toolbar({
  canUndo,
  onUndo,
  onReset,
  onShare,
}: ToolbarProps) {
  const { t } = useTranslation();

  const buttons = [
    {
      label: t('create.undo'),
      icon: Undo2,
      onClick: onUndo,
      disabled: !canUndo,
    },
    {
      label: t('create.reset'),
      icon: RotateCcw,
      onClick: onReset,
      disabled: false,
    },
    {
      label: t('create.share'),
      icon: Share2,
      onClick: onShare,
      disabled: false,
    },
  ] as const;

  return (
    <div className="flex justify-center gap-3">
      {buttons.map(({ label, icon: Icon, onClick, disabled }) => (
        <button
          key={label}
          onClick={onClick}
          disabled={disabled}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
            disabled
              ? 'bg-charcoal/5 text-charcoal/20 cursor-not-allowed'
              : 'bg-white border border-charcoal/10 text-charcoal/60 hover:text-jade hover:border-jade/30 active:scale-95'
          }`}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}
