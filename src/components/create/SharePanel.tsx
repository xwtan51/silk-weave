import { X, Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SharePanelProps {
  onClose: () => void;
}

export default function SharePanel({ onClose }: SharePanelProps) {
  const { t } = useTranslation();

  const platforms = [
    {
      name: t('share.instagram'),
      color: 'bg-gradient-to-br from-pink-500 to-orange-500',
      icon: Camera,
    },
    {
      name: t('share.tiktok'),
      color: 'bg-black',
      icon: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
      ),
    },
    {
      name: t('share.youtube'),
      color: 'bg-red-600',
      icon: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 00.5 6.19 31.6 31.6 0 000 12a31.6 31.6 0 00.5 5.81 3.02 3.02 0 002.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 002.12-2.14A31.6 31.6 0 0024 12a31.6 31.6 0 00-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/>
        </svg>
      ),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-paper rounded-t-3xl sm:rounded-3xl w-full max-w-[390px] p-6 shadow-2xl animate-[slideUp_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-charcoal">{t('create.share')}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-charcoal/5">
            <X size={18} className="text-charcoal" />
          </button>
        </div>

        <div className="flex justify-center gap-6">
          {platforms.map((p) => (
            <button
              key={p.name}
              className="flex flex-col items-center gap-2 group"
            >
              <div
                className={`w-14 h-14 ${p.color} rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 group-active:scale-95 transition-transform`}
              >
                <p.icon />
              </div>
              <span className="text-[10px] text-charcoal/50">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
