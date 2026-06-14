import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, ArrowRight, Heart } from 'lucide-react';
import Slogan from './Slogan';
import FeaturedPattern from './FeaturedPattern';
import CustomPattern from '../svgs/CustomPattern';
import { loadAllPatterns } from '../../data/storage';
import type { Pattern } from '../../types';

interface DiscoverPageProps { onStart: () => void; }

export default function DiscoverPage({ onStart }: DiscoverPageProps) {
  const { t } = useTranslation();
  const [trending, setTrending] = useState<Pattern[]>([]);

  useEffect(() => {
    loadAllPatterns().then((all) => {
      const top = all
        .filter((p) => p.authorId !== 'self')
        .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
        .slice(0, 3);
      setTrending(top);
    });
  }, []);

  return (
    <div className="flex flex-col items-center px-6 py-8 gap-8">
      <Slogan />
      <FeaturedPattern />
      <button onClick={onStart}
        className="flex items-center gap-2 px-8 py-3 rounded-full bg-jade text-white text-sm font-medium hover:bg-jade/90 active:scale-95 transition-all shadow-md">
        {t('hero.startJourney')} <ArrowRight size={16} />
      </button>

      {/* Stats */}
      <div className="flex gap-8 py-2">
        {[
          { n: '100+', l: t('discover.statsPatterns') },
          { n: '50+', l: t('discover.statsCreators') },
          { n: '9', l: t('discover.statsLanguages') },
        ].map((s) => (
          <div key={s.l} className="text-center">
            <p className="text-lg font-bold text-charcoal">{s.n}</p>
            <p className="text-[10px] text-charcoal/40">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Trending */}
      {trending.length > 0 && (
        <div className="w-full">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-vermillion" />
            <h2 className="text-sm font-semibold text-charcoal">
              {t('discover.trendingNow')}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {trending.map((p) => (
              <button key={p.id} onClick={onStart} className="bg-white rounded-xl p-2 shadow-sm border border-charcoal/5 text-left hover:shadow-md transition-all relative">
                <div className="w-full aspect-square bg-paper rounded-lg flex items-center justify-center p-2 mb-1.5">
                  {p.customPaths ? (
                    <CustomPattern variant="color" fillColors={{}} paths={p.customPaths} viewBox={p.customViewBox} />
                  ) : <div className="w-10 h-10 rounded-full bg-charcoal/10" />}
                </div>
                <div className="absolute bottom-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/30 text-white text-[10px] font-medium">
                  <Heart size={10} className="fill-white text-white" />{p.likesCount || 0}
                </div>
                <p className="text-[11px] font-medium text-charcoal truncate">{p.name}</p>
                <p className="text-[10px] text-charcoal/40 truncate">@{p.authorName}</p>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
