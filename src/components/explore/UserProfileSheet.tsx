import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, UserPlus, UserCheck, Loader2, Heart, Bookmark, Send, MessageSquare } from 'lucide-react';
import { getUserById, getUserByAuthorName } from '../../data/users';
import { isFollowing, toggleFollow, getUserCounts, getUserFollowers, getUserFollowing, getUserLikes, getUserSaves, getUserComments, getUserPatterns } from '../../data/social';
import { addToHistory } from '../../data/social';
import { loadAllPatterns } from '../../data/storage';
import CommunityCard from './CommunityCard';
import type { Pattern } from '../../types';

interface UserProfileSheetProps {
  userId: string;
  onClose: () => void;
  allPatterns?: Pattern[];
  onPatternClick?: (pattern: Pattern) => void;
}

type SheetTab = 'posts' | 'liked' | 'saved';

export default function UserProfileSheet({ userId, onClose, allPatterns: _parentPatterns, onPatternClick }: UserProfileSheetProps) {
  const { t } = useTranslation();
  const [activeUserId, setActiveUserId] = useState(userId);
  const [activeTab, setActiveTab] = useState<SheetTab>('posts');
  const [isFollowed, setIsFollowed] = useState(false);
  const [counts, setCounts] = useState({ following: 0, followers: 0 });
  const [listMode, setListMode] = useState<'followers' | 'following' | null>(null);
  const [listUsers, setListUsers] = useState<string[]>([]);
  const [userPatterns, setUserPatterns] = useState<Pattern[]>([]);
  const [allPatterns, setAllPatterns] = useState<Pattern[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setActiveUserId(userId); setActiveTab('posts'); setShowComments(false); }, [userId]);

  const u = getUserById(activeUserId) || getUserByAuthorName(activeUserId);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getUserPatterns(activeUserId),
      getUserLikes(activeUserId),
      getUserSaves(activeUserId),
      getUserComments(activeUserId),
      loadAllPatterns(),
    ]).then(([patterns, likes, saves, cmts, allP]) => {
      setUserPatterns(patterns);
      setLikedIds(likes);
      setSavedIds(saves);
      setComments(cmts);
      setAllPatterns(allP);
      setLoading(false);
    });
  }, [activeUserId]);

  useEffect(() => {
    (async () => {
      const [followed, c] = await Promise.all([isFollowing(activeUserId), getUserCounts(activeUserId)]);
      setIsFollowed(followed);
      setCounts(c);
    })().catch(() => {});
  }, [activeUserId]);

  const likedPatterns = likedIds.map((id) => allPatterns.find((p) => p.id === id)).filter(Boolean) as Pattern[];
  const savedPatterns = savedIds.map((id) => allPatterns.find((p) => p.id === id)).filter(Boolean) as Pattern[];

  const openList = async (mode: 'followers' | 'following') => {
    const ids = mode === 'followers' ? await getUserFollowers(activeUserId) : await getUserFollowing(activeUserId);
    setListUsers(ids);
    setListMode(mode);
  };

  const handleToggleFollow = async () => {
    const ok = await toggleFollow(activeUserId);
    setIsFollowed(ok);
    const c = await getUserCounts(activeUserId);
    setCounts(c);
  };

  if (!u) { onClose(); return null; }

  return (
    <div className="absolute inset-0 z-50 bg-paper overflow-y-auto animate-[slideUp_0.2s_ease-out] flex flex-col">
      <div className="sticky top-0 bg-paper/90 backdrop-blur-sm z-10 px-5 py-3 flex items-center gap-3 border-b border-charcoal/5 shrink-0">
        <button onClick={onClose} className="p-1 -ml-1"><ArrowLeft size={20} className="text-charcoal" /></button>
        <span className="font-semibold text-sm text-charcoal">{u.name}</span>
      </div>

      <div className="px-5 pt-6 pb-4 space-y-3">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-semibold" style={{ backgroundColor: u.color }}>{u.name[0]}</div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-charcoal">{u.name}</h2>
            <p className="text-xs text-charcoal/40 mt-0.5">{u.bio}</p>
          </div>
        </div>
        <div className="flex gap-6 py-2">
          <div className="text-center"><p className="font-semibold text-charcoal">{userPatterns.length}</p><p className="text-[10px] text-charcoal/40">{t('profile.patterns')}</p></div>
          <button onClick={() => openList('followers')} className="text-center"><p className="font-semibold text-charcoal">{counts.followers}</p><p className="text-[10px] text-charcoal/40">{t('profile.followers')}</p></button>
          <button onClick={() => openList('following')} className="text-center"><p className="font-semibold text-charcoal">{counts.following}</p><p className="text-[10px] text-charcoal/40">{t('profile.followingCount')}</p></button>
        </div>
        <button onClick={handleToggleFollow} className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${isFollowed ? 'bg-charcoal/5 text-charcoal/60' : 'bg-jade text-white'}`}>
          {isFollowed ? <UserCheck size={16} /> : <UserPlus size={16} />}
          {isFollowed ? t('profile.following') : t('profile.follow')}
        </button>
      </div>

      <div className="h-1 bg-charcoal/5" />

      {listMode ? (
        <div className="px-5 py-4">
          <button onClick={() => setListMode(null)} className="flex items-center gap-2 text-sm text-charcoal/60 mb-3 -ml-1">
            <ArrowLeft size={16} />{listMode === 'followers' ? t('profile.followers') : t('profile.followingCount')}
          </button>
          <div className="space-y-2">
            {listUsers.map((uid) => {
              const fu = getUserById(uid);
              return fu ? (
                <button key={uid} onClick={() => { setListMode(null); setActiveUserId(uid); }}
                  className="w-full flex items-center gap-3 bg-white rounded-xl p-3 border border-charcoal/5 hover:shadow-sm transition-all">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ backgroundColor: fu.color }}>{fu.name[0]}</div>
                  <div className="flex-1 min-w-0 text-left"><h3 className="font-semibold text-sm text-charcoal">{fu.name}</h3><p className="text-[10px] text-charcoal/40 truncate">{fu.bio}</p></div>
                </button>
              ) : null;
            })}
          </div>
        </div>
      ) : showComments ? (
        <div className="px-5 py-4">
          <button onClick={() => setShowComments(false)} className="flex items-center gap-2 text-sm text-charcoal/60 mb-3 -ml-1">
            <ArrowLeft size={16} />{t('profile.comments')}
          </button>
          {comments.length > 0 ? (
            <div className="space-y-2">
              {comments.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => {
                    const pattern = allPatterns.find((p) => p.id === c.patternId);
                    if (pattern) { setShowComments(false); addToHistory(pattern.id); }
                  }}
                  className="w-full bg-white rounded-xl p-3 border border-charcoal/5 hover:shadow-sm transition-all text-left"
                >
                  <p className="text-xs text-charcoal/70 mb-1">{c.text}</p>
                  <div className="flex items-center gap-2 text-[10px] text-charcoal/30">
                    <span className="text-jade/60">{c.patternName}</span>
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-charcoal/25 text-xs py-12">{t('profile.nothingHere')}</p>
          )}
        </div>
      ) : (
        <div className="px-5 py-4">
          {/* Tabs */}
          <div className="flex bg-charcoal/5 rounded-xl p-1 mb-4">
            {([
              { key: 'posts' as SheetTab, icon: Send, label: t('profile.posts'), count: userPatterns.length },
              { key: 'liked' as SheetTab, icon: Heart, label: t('profile.liked'), count: likedIds.length },
              { key: 'saved' as SheetTab, icon: Bookmark, label: t('profile.saved'), count: savedIds.length },
            ]).map(({ key, icon: Icon, label, count }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === key ? 'bg-white text-jade shadow-sm' : 'text-charcoal/40 hover:text-charcoal/60'}`}>
                <Icon size={14} /><span>{label} · {count}</span>
              </button>
            ))}
          </div>
          {/* Comments button */}
          <button
            onClick={() => setShowComments(true)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-charcoal/5 text-charcoal/50 hover:bg-charcoal/10 text-xs font-medium mb-3 transition-all"
          >
            <MessageSquare size={14} />{t('profile.comments')} · {comments.length}
          </button>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-charcoal/25"><Loader2 size={20} className="animate-spin" /></div>
          ) : (
            (activeTab === 'liked' ? likedPatterns : activeTab === 'saved' ? savedPatterns : userPatterns).length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {(activeTab === 'liked' ? likedPatterns : activeTab === 'saved' ? savedPatterns : userPatterns).map((p) => (
                  <CommunityCard key={p.id} pattern={p} compact onClick={() => { addToHistory(p.id); if (onPatternClick) onPatternClick(p); }} />
                ))}
              </div>
            ) : (
              <p className="text-center text-charcoal/25 text-xs py-12">{t('profile.nothingHere')}</p>
            )
          )}
        </div>
      )}
    </div>
  );
}
