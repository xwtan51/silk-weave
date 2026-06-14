import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Bookmark, Eye, MessageSquare, Pencil, Check, X, Send, ArrowLeft, Trash2 } from 'lucide-react';
import { getLikes, getSaves, getHistory, getFollows, getProfile, updateProfile, getUserCounts, getUserComments, getUserFollowers, deleteComment } from '../../data/social';
import { getUserById } from '../../data/users';
import { patterns as builtInPatterns } from '../../data/patterns';
import { loadAllPatterns } from '../../data/storage';
import PatternCard from '../explore/PatternCard';
import CommunityCard from '../explore/CommunityCard';
import DetailModal from '../explore/DetailModal';
import PostDetail from '../explore/PostDetail';
import UserProfileSheet from '../explore/UserProfileSheet';
import type { Pattern } from '../../types';

type ProfileTab = 'posts' | 'saves' | 'follows' | 'likes';

export default function ProfilePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [showHistory, setShowHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [myComments, setMyComments] = useState<any[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [allPatterns, setAllPatterns] = useState<Pattern[]>(builtInPatterns);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [historyIds, setHistoryIds] = useState<string[]>([]);
  const [followIds, setFollowIds] = useState<string[]>([]);
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [viewingUser, setViewingUser] = useState<string | null>(null);
  const [showFollowers, setShowFollowers] = useState(false);
  const [followersList, setFollowersList] = useState<string[]>([]);
  const [ownCounts, setOwnCounts] = useState<{ following: number; followers: number }>({ following: 0, followers: 0 });

  const openUserProfile = (userId: string) => setViewingUser(userId);

  useEffect(() => {
    getUserCounts('self').then(setOwnCounts).catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      const [patterns, likes, saves, history, follows, profile] = await Promise.all([
        loadAllPatterns(), getLikes(), getSaves(), getHistory(), getFollows(), getProfile(),
      ]);
      setAllPatterns([...builtInPatterns, ...patterns]);
      setLikedIds(likes); setSavedIds(saves); setHistoryIds(history); setFollowIds(follows);
      setProfileName(profile.name); setProfileBio(profile.bio);
      localStorage.setItem('silkweave-profile-name', profile.name);
    })();
    getUserComments('self').then(setMyComments).catch(() => {});
  }, []);

  const myPosts = allPatterns.filter((p) => p.authorId === 'self');

  const getPatterns = (): Pattern[] => {
    if (activeTab === 'follows') return [];
    if (activeTab === 'posts') return myPosts;
    const ids = activeTab === 'likes' ? likedIds : savedIds;
    return ids.map((id) => allPatterns.find((p) => p.id === id)).filter(Boolean) as Pattern[];
  };

  const patterns = getPatterns();
  const followedUsers = followIds.map((id) => getUserById(id)).filter(Boolean);
  const historyPatterns = historyIds.map((id) => allPatterns.find((p) => p.id === id)).filter(Boolean) as Pattern[];

  const tabs = [
    { key: 'posts' as ProfileTab, icon: Send, label: t('profile.posts'), count: myPosts.length },
    { key: 'saves' as ProfileTab, icon: Bookmark, label: t('profile.saved'), count: savedIds.length },
    { key: 'likes' as ProfileTab, icon: Heart, label: t('profile.liked'), count: likedIds.length },
  ];

  return (
    <div className="min-h-full p-5 pb-8 space-y-4 relative">
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-jade flex items-center justify-center text-white text-3xl font-semibold">{profileName[0] || t('common.you')[0]}</div>
          <div className="flex-1">
            {editing ? (
              <div className="space-y-1.5">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-2 py-1 rounded-lg border border-jade/30 text-sm font-semibold text-charcoal outline-none" />
                <input value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full px-2 py-1 rounded-lg border border-charcoal/10 text-xs text-charcoal/60 outline-none" />
                <div className="flex gap-1.5">
                  <button onClick={async () => {
                    await updateProfile({ name: editName, bio: editBio });
                    localStorage.setItem('silkweave-profile-name', editName);
                    setProfileName(editName); setProfileBio(editBio); setEditing(false);
                  }} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-jade text-white text-[10px] font-medium"><Check size={12} />{t('common.save')}</button>
                  <button onClick={() => setEditing(false)} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-charcoal/5 text-charcoal/50 text-[10px]"><X size={12} />{t('common.cancel')}</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-charcoal">{profileName}</h2>
                  <button onClick={() => { setEditName(profileName); setEditBio(profileBio); setEditing(true); }} className="p-1 rounded-full hover:bg-charcoal/5"><Pencil size={14} className="text-charcoal/30" /></button>
                </div>
                <p className="text-xs text-charcoal/40 mt-0.5">{profileBio}</p>
              </>
            )}
          </div>
        </div>
        {/* Stats row */}
        <div className="flex gap-6 py-1">
          <div className="text-center"><p className="font-semibold text-charcoal">{myPosts.length}</p><p className="text-[10px] text-charcoal/40">{t('profile.patterns')}</p></div>
          <button onClick={async () => {
            const list = await getUserFollowers('self');
            setFollowersList(list);
            setShowFollowers(true);
            setActiveTab('follows');
          }} className="text-center">
            <p className="font-semibold text-charcoal">{ownCounts.followers}</p>
            <p className="text-[10px] text-charcoal/40">{t('profile.followers')}</p>
          </button>
          <button onClick={() => { setShowFollowers(false); setActiveTab('follows'); }} className="text-center">
            <p className="font-semibold text-charcoal">{followIds.length}</p>
            <p className="text-[10px] text-charcoal/40">{t('profile.followingCount')}</p>
          </button>
        </div>
        {/* History + Comments buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => { setShowHistory(!showHistory); setShowComments(false); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all ${
              showHistory ? 'bg-jade text-white' : 'bg-charcoal/5 text-charcoal/50 hover:bg-charcoal/10'
            }`}
          >
            <Eye size={14} />{t('profile.history')} · {historyIds.length}
          </button>
          <button
            onClick={() => { setShowComments(!showComments); setShowHistory(false); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all ${
              showComments ? 'bg-jade text-white' : 'bg-charcoal/5 text-charcoal/50 hover:bg-charcoal/10'
            }`}
          >
            <MessageSquare size={14} />{t('profile.comments')} · {myComments.length}
          </button>
        </div>
      </div>

      {showHistory ? (
        <div>
          <button onClick={() => setShowHistory(false)} className="flex items-center gap-2 text-sm text-charcoal/60 -ml-1 mb-3">
            <ArrowLeft size={16} />{t('profile.history')}
          </button>
          {historyPatterns.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {historyPatterns.map((p) => (
                <CommunityCard key={p.id} pattern={p} compact onClick={() => { setShowHistory(false); setSelectedPattern(p); }} />
              ))}
            </div>
          ) : (
            <p className="text-center text-charcoal/25 text-xs py-12">{t('profile.nothingHere')}</p>
          )}
        </div>
      ) : showComments ? (
        <div>
          <button onClick={() => setShowComments(false)} className="flex items-center gap-2 text-sm text-charcoal/60 -ml-1 mb-3">
            <ArrowLeft size={16} />{t('profile.comments')}
          </button>
          {myComments.length > 0 ? (
            <div className="space-y-2">
              {myComments.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => {
                    const pattern = allPatterns.find((p) => p.id === c.patternId);
                    if (pattern) { setShowComments(false); setSelectedPattern(pattern); }
                  }}
                  className="w-full bg-white rounded-xl p-3 border border-charcoal/5 hover:shadow-sm transition-all text-left"
                >
                  <p className="text-xs text-charcoal/70 mb-1">{c.text}</p>
                  <div className="flex items-center gap-2 text-[10px] text-charcoal/30">
                    <span className="text-jade/60">{c.patternName}</span>
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={async (e) => { e.stopPropagation(); const ok = await deleteComment(c.id); if (ok) setMyComments(prev => prev.filter(x => x.id !== c.id)); }}
                      className="text-charcoal/25 hover:text-red-500 transition-colors ml-auto"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-charcoal/25 text-xs py-12">{t('profile.nothingHere')}</p>
          )}
        </div>
      ) : (
        <>
          <div className="flex bg-charcoal/5 rounded-xl p-1">
            {tabs.map(({ key, icon: Icon, label, count }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === key ? 'bg-white text-jade shadow-sm' : 'text-charcoal/40 hover:text-charcoal/60'}`}>
                <Icon size={15} /><span>{label} · {count}</span>
              </button>
            ))}
          </div>

          {activeTab === 'follows' ? (
            <div>
              {/* Toggle: following / followers */}
              <div className="flex gap-2 mb-3">
                <button onClick={() => setShowFollowers(false)} className={`text-sm font-medium px-3 py-1 rounded-lg transition-all ${!showFollowers ? 'bg-jade text-white' : 'text-charcoal/50 hover:text-charcoal/70'}`}>
                  {t('profile.followingCount')}
                </button>
                <button onClick={() => setShowFollowers(true)} className={`text-sm font-medium px-3 py-1 rounded-lg transition-all ${showFollowers ? 'bg-jade text-white' : 'text-charcoal/50 hover:text-charcoal/70'}`}>
                  {t('profile.followers')}
                </button>
                <div className="flex-1" />
                <button onClick={() => setActiveTab('posts')} className="text-xs text-charcoal/30 hover:text-charcoal/60">
                  ✕
                </button>
              </div>
              {showFollowers ? (
                followersList.length > 0 ? (
                  <div className="space-y-2">
                    {followersList.map((id) => {
                      const u = getUserById(id);
                      return u ? (
                        <button key={id} onClick={() => openUserProfile(id)} className="w-full flex items-center gap-3 bg-white rounded-xl p-3 border border-charcoal/5 hover:shadow-sm transition-all">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ backgroundColor: u.color }}>
                            {u.name[0]}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <h3 className="font-semibold text-sm text-charcoal">{u.name}</h3>
                            <p className="text-[10px] text-charcoal/40 truncate">{u.bio}</p>
                          </div>
                        </button>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <p className="text-center text-charcoal/25 text-xs py-12">{t('profile.nothingHere')}</p>
                )
              ) : (
                followedUsers.length > 0 ? (
                <div className="space-y-2">
                  {followedUsers.map((u) => u && (
                    <button key={u.id} onClick={() => openUserProfile(u.id)} className="w-full flex items-center gap-3 bg-white rounded-xl p-3 border border-charcoal/5 hover:shadow-sm transition-all">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ backgroundColor: u.color }}>
                        {u.name[0]}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <h3 className="font-semibold text-sm text-charcoal">{u.name}</h3>
                        <p className="text-[10px] text-charcoal/40 truncate">{u.bio}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-charcoal/25 text-xs py-12">{t('profile.noFollowing')}</p>
              )
              )}
            </div>
          ) : patterns.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {patterns.map((p) =>
                p.svgId === 'custom' ? (
                  <CommunityCard key={p.id} pattern={p} compact onClick={() => setSelectedPattern(p)} />
                ) : (
                  <PatternCard key={p.id} pattern={p} onClick={() => setSelectedPattern(p)} />
                )
              )}
            </div>
          ) : (
            <p className="text-center text-charcoal/25 text-xs py-12">{t('profile.nothingHere')}</p>
          )}
        </>
      )}

      {viewingUser && <UserProfileSheet userId={viewingUser} onClose={() => setViewingUser(null)} allPatterns={allPatterns} onPatternClick={(p) => { setViewingUser(null); setSelectedPattern(p); }} />}

      {selectedPattern && (selectedPattern.svgId === 'custom' ? (
        <PostDetail pattern={selectedPattern} onClose={() => setSelectedPattern(null)} onAuthorClick={(id) => { setSelectedPattern(null); openUserProfile(id); }} />
      ) : (
        <DetailModal pattern={selectedPattern} onClose={() => setSelectedPattern(null)} onColorPattern={() => {}} />
      ))}
    </div>
  );
}
