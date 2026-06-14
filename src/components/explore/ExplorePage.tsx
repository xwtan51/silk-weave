import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Loader2, ArrowDown, Search, ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../layout/Toast';
import PostDetail from './PostDetail';
import CommunityCard from './CommunityCard';
import UserProfileSheet from './UserProfileSheet';
import PublishPage, { type PublishData } from '../create/PublishPage';
import { loadUserPatterns, addUserPattern } from '../../data/storage';
import { addToHistory } from '../../data/social';
import type { Pattern, CustomPath } from '../../types';

type SortMode = 'recommended' | 'newest' | 'liked';
const PULL_THRESHOLD = 56;
export default function ExplorePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [userPatterns, setUserPatterns] = useState<Pattern[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [patternsLoading, setPatternsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortMode>('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [viewingUser, setViewingUser] = useState<string | null>(null);
  const [pullDist, setPullDist] = useState(0);
  const [publishData, setPublishData] = useState<PublishData | null>(null);
  const pullStartY = useRef(0);
  const feedRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const seedRef = useRef<number>(0);

  const getSortParam = () => sortBy === 'recommended' ? 'random' : 'newest';

  useEffect(() => {
    seedRef.current = 0; // new shuffle on mount
    loadUserPatterns(20, 0, getSortParam()).then((r) => {
      setUserPatterns(r.items); setHasMore(r.hasMore); setPatternsLoading(false);
      if (r.seed) seedRef.current = r.seed;
    });
  }, []);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const r = await loadUserPatterns(20, userPatterns.length, getSortParam(), seedRef.current);
    setUserPatterns((prev) => [...prev, ...r.items]);
    setHasMore(r.hasMore);
    setLoadingMore(false);
  };

  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) loadMore();
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [userPatterns.length, loadingMore, hasMore]);

  const openProfile = useCallback((userId: string) => {
    setSelectedPattern(null);
    setViewingUser(userId);
  }, []);

  const filtered = userPatterns.filter((p) => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const sorted = sortBy === 'recommended' ? filtered
    : sortBy === 'newest' ? [...filtered].sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
    : [...filtered].sort((a, b) => ((b.likesCount || 0) - (a.likesCount || 0)));

  const sortLabel = sortBy === 'recommended' ? t('explore.sortRecommended')
    : sortBy === 'newest' ? t('explore.sortNewest') : t('explore.sortLiked');

  const nextSort = (): SortMode => sortBy === 'recommended' ? 'newest' : sortBy === 'newest' ? 'liked' : 'recommended';

  // Reload when sort mode changes
  useEffect(() => {
    if (patternsLoading) return; // skip initial load (handled by the other useEffect)
    seedRef.current = 0;
    setUserPatterns([]);
    setHasMore(true);
    loadUserPatterns(20, 0, getSortParam()).then((r) => {
      setUserPatterns(r.items); setHasMore(r.hasMore);
      if (r.seed) seedRef.current = r.seed;
    });
  }, [sortBy]);

  const doRefresh = () => {
    setRefreshing(true); setPullDist(0);
    seedRef.current = 0; // new shuffle on refresh
    setTimeout(async () => {
      try {
        const r = await loadUserPatterns(20, 0, getSortParam());
        setUserPatterns(r.items); setHasMore(r.hasMore);
        if (r.seed) seedRef.current = r.seed;
        toast(t('explore.feedRefreshed'), 'success');
      } catch (e) {
        console.error('doRefresh error', e);
      }
      setRefreshing(false);
    }, 600);
  };

  const handlePatternClick = (p: Pattern) => { addToHistory(p.id); setSelectedPattern(p); };
  const handleUpload = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.name.endsWith('.svg')) { toast(t('explore.selectSvgFile'), 'error'); e.target.value = ''; return; }
    const text = await file.text(); const paths = parseSvgPaths(text);
    if (!paths.length) { toast('No paths found', 'error'); e.target.value = ''; return; }
    const viewBox = extractViewBox(text);
    setPublishData({ paths, viewBox, defaultTitle: file.name.replace('.svg', '') });
    e.target.value = '';
  };

  const handlePost = async (pattern: Pattern) => {
    await addUserPattern(pattern);
    const r = await loadUserPatterns(20, 0);
    setUserPatterns(r.items); setHasMore(r.hasMore);
    setPublishData(null);
    toast(t('explore.patternPublished'), 'success');
  };

  /* pull-to-refresh */
  const onTS = (e: React.TouchEvent) => { if (!refreshing) pullStartY.current = e.touches[0].clientY; };
  const onTM = (e: React.TouchEvent) => { if (refreshing) return; const el = feedRef.current; if (!el || el.scrollTop > 0) { setPullDist(0); return; } setPullDist(Math.max(0, (e.touches[0].clientY - pullStartY.current) * 0.4)); };
  const onTE = () => { if (!refreshing) { pullDist >= PULL_THRESHOLD ? doRefresh() : setPullDist(0); } };
  const onMD = (e: React.MouseEvent) => { if (!refreshing) pullStartY.current = e.clientY; };
  const onMM = (e: React.MouseEvent) => { if (refreshing) return; const el = feedRef.current; if (!el || el.scrollTop > 0) { setPullDist(0); return; } if (!pullStartY.current) return; setPullDist(Math.max(0, (e.clientY - pullStartY.current) * 0.4)); };
  const onMU = () => { if (!refreshing) { pullStartY.current = 0; pullDist >= PULL_THRESHOLD ? doRefresh() : setPullDist(0); } };

  return (
    <div className="min-h-full relative p-5 pb-8 space-y-4">
      {/* Search + sort + upload */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-1.5 bg-white rounded-lg border border-charcoal/10 px-3 py-1.5">
          <Search size={13} className="text-charcoal/30 shrink-0" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('explore.searchPlaceholder')} className="flex-1 bg-transparent text-xs text-charcoal placeholder:text-charcoal/25 outline-none" />
        </div>
        <button onClick={() => setSortBy(nextSort)} className="shrink-0 px-2.5 py-1.5 rounded-lg bg-white border border-charcoal/10 text-[10px] font-medium text-charcoal/50 hover:text-jade hover:border-jade/30 transition-colors flex items-center gap-1">
          <ArrowUpDown size={12} />{sortLabel}
        </button>
        <button onClick={handleUpload} className="shrink-0 w-9 h-9 rounded-lg border-2 border-dashed border-charcoal/20 text-charcoal/40 hover:border-jade/40 hover:text-jade transition-colors flex items-center justify-center" title={t('explore.uploadButton')}>
          <Upload size={15} />
        </button>
      </div>

      {/* Feed with pull-to-refresh */}
      <div ref={feedRef} className="overflow-y-auto max-h-[calc(100vh-240px)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" style={{ overscrollBehaviorY: 'contain' }}
        onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE} onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}>
        <div className="flex flex-col items-center justify-center overflow-hidden transition-all duration-150" style={{ height: pullDist, opacity: Math.min(1, pullDist / (PULL_THRESHOLD * 0.6)) }}>
          {refreshing ? (
            <Loader2 size={16} className="animate-spin text-jade" />
          ) : (
            <>
              <ArrowDown
                size={16}
                className="text-charcoal/30 transition-all duration-300 ease-out"
                style={{ transform: `rotate(${Math.min(180, (pullDist / PULL_THRESHOLD) * 180)}deg)`, opacity: pullDist >= PULL_THRESHOLD ? 0.5 : 1 }}
              />
              {pullDist >= PULL_THRESHOLD && (
                <span className="text-[11px] font-medium text-jade mt-1 animate-pulse">{t('explore.releaseToRefresh')}</span>
              )}
            </>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {patternsLoading ? <SkeletonCards /> : sorted.length > 0 ? sorted.map((p) => <CommunityCard key={p.id} pattern={p} onClick={() => handlePatternClick(p)} onAuthorClick={openProfile} compact />) : <Empty msg={t('explore.noCommunity')} />}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept=".svg" className="hidden" onChange={handleFileChange} />

      {/* Publish page */}
      {publishData && (
        <PublishPage data={publishData} onPost={handlePost} onClose={() => setPublishData(null)} />
      )}

      {/* User profile overlay */}
      {viewingUser && <UserProfileSheet userId={viewingUser} onClose={() => setViewingUser(null)} allPatterns={userPatterns} onPatternClick={(p) => { setViewingUser(null); setSelectedPattern(p); }} />}

      {selectedPattern && (selectedPattern.svgId === 'custom' ? <PostDetail pattern={selectedPattern} onClose={() => setSelectedPattern(null)} onAuthorClick={openProfile} /> : <PostDetail pattern={selectedPattern} onClose={() => setSelectedPattern(null)} onAuthorClick={openProfile} />)}
    </div>
  );
}

function Empty({ msg }: { msg: string }) { return <div className="flex flex-col items-center gap-3 py-16"><Search size={32} className="text-charcoal/15" /><p className="text-xs text-charcoal/25">{msg}</p></div>; }

function SkeletonCards() {
  return <div className="space-y-3">{[1, 2, 3].map((i) => (<div key={i} className="bg-white rounded-2xl p-4 animate-pulse"><div className="w-full aspect-[4/3] bg-charcoal/5 rounded-xl mb-3" /><div className="flex items-center justify-between"><div><div className="h-4 w-24 bg-charcoal/5 rounded mb-1.5" /><div className="h-3 w-16 bg-charcoal/5 rounded" /></div><div className="h-3 w-10 bg-charcoal/5 rounded" /></div></div>))}</div>;
}

function parseSvgPaths(svgText: string): CustomPath[] {
  try { const parser = new DOMParser(); const doc = parser.parseFromString(svgText, 'image/svg+xml'); const r: CustomPath[] = []; doc.querySelectorAll('path').forEach((p, i) => { const d = p.getAttribute('d'); if (d) r.push({ id: `custom-${i}`, d }); }); return r; } catch { return []; }
}

function extractViewBox(svgText: string): string {
  try { return new DOMParser().parseFromString(svgText, 'image/svg+xml').querySelector('svg')?.getAttribute('viewBox') || '0 0 1024 1024'; } catch { return '0 0 1024 1024'; }
}
