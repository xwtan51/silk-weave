import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Key, RotateCw } from 'lucide-react';
import pkg from '../../../package.json';

const isElectron = typeof window !== 'undefined' && (window as any).electron?.isElectron;

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updateStatus, setUpdateStatus] = useState<{ type: string; text: string; percent?: number } | null>(null);
  const mountedRef = useRef(true);
  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  useEffect(() => {
    if (isElectron) {
      (window as any).electron.onUpdateStatus((s: any) => { if (mountedRef.current) setUpdateStatus(s); });
    }
  }, []);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => setApiKey(d.apiKey || ''))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: apiKey.trim() }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/40 flex items-center justify-center p-6" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-charcoal">
            <Key size={18} className="text-jade" />
            <h2 className="font-semibold text-sm">{t('settings.title')}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-charcoal/5">
            <X size={16} className="text-charcoal/40" />
          </button>
        </div>

        <p className="text-xs text-charcoal/50 leading-relaxed">
          {t('settings.description')}
        </p>

        {loading ? (
          <div className="h-10 bg-charcoal/5 rounded-xl animate-pulse" />
        ) : (
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full px-3 py-2 bg-charcoal/5 rounded-xl text-xs text-charcoal placeholder:text-charcoal/25 outline-none focus:bg-white focus:border focus:border-jade/30"
          />
        )}

        <button
          onClick={handleSave}
          className={`w-full py-2 rounded-xl text-xs font-medium transition-all ${
            saved ? 'bg-jade text-white' : 'bg-jade text-white hover:bg-jade/90 active:scale-[0.98]'
          }`}
        >
          {saved ? '✓ ' + t('settings.saved') : t('common.save')}
        </button>

        {isElectron && (
          <>
            <button
              onClick={() => { setUpdateStatus({ type: 'checking', text: t('settings.checking') }); (window as any).electron.checkForUpdates(); }}
              className="w-full py-2 rounded-xl text-xs font-medium bg-charcoal/5 text-charcoal/50 hover:bg-charcoal/10 transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCw size={12} className={updateStatus?.type === 'downloading' || updateStatus?.type === 'checking' ? 'animate-spin' : ''} />
              {t('settings.checkUpdate')}
            </button>

            {updateStatus && updateStatus.type !== 'ready' && (
              <div className="space-y-1.5">
                <p className={`text-center text-[10px] ${
                  updateStatus.type === 'error' ? 'text-red-400' :
                  updateStatus.type === 'uptodate' ? 'text-jade/60' :
                  'text-jade/60'
                }`}>
                  {updateStatus.text}
                </p>
                {updateStatus.percent != null && updateStatus.percent > 0 && (
                  <div className="h-1 bg-charcoal/10 rounded-full overflow-hidden">
                    <div className="h-full bg-jade rounded-full transition-all duration-300" style={{ width: `${updateStatus.percent}%` }} />
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <p className="text-center text-[9px] text-charcoal/20">v{pkg.version}</p>
      </div>
    </div>
  );
}
