import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let failures = 0;
    const check = async () => {
      try {
        const res = await fetch('/api/patterns');
        if (res.ok) { failures = 0; setOffline(false); return; }
      } catch { /* server down */ }
      failures++;
      if (failures >= 2) setOffline(true);
    };
    check(); // initial check
    const timer = setInterval(check, 15000);
    return () => clearInterval(timer);
  }, []);

  if (!offline) return null;

  return (
    <div className="bg-amber-500 text-white text-[11px] font-medium px-4 py-1.5 text-center flex items-center justify-center gap-1.5 animate-pulse">
      <WifiOff size={12} />
      Server offline — data saved locally
    </div>
  );
}
