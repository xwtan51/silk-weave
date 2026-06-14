import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Heart, Bookmark, Clock, Send, Languages, Loader2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import CloudPattern, { cloudPathIds } from '../svgs/CloudPattern';
import RuyiPattern, { ruyiPathIds } from '../svgs/RuyiPattern';
import DragonPattern, { dragonPathIds } from '../svgs/DragonPattern';
import HuiwenPattern, { huiwenPathIds } from '../svgs/HuiwenPattern';
import CustomPattern from '../svgs/CustomPattern';
import { themes, type SwatchColor } from '../../data/colors';
import { useToast } from '../layout/Toast';
import { toggleLike, toggleSave, getComments, addComment, deletePattern, deleteComment } from '../../data/social';
import { getUserById, getUserByAuthorName } from '../../data/users';
import { formatTimeAgo } from '../../utils/time';
import type { Pattern } from '../../types';

const SVG_MAP: Record<string, React.ComponentType<any>> = { cloud: CloudPattern, ruyi: RuyiPattern, dragon: DragonPattern, huiwen: HuiwenPattern, custom: CustomPattern };
const RECOMMENDED_THEME: Record<string, string> = { cloud: 'celadon', dragon: 'imperial', ruyi: 'silk', huiwen: 'celadon', custom: 'imperial' };
const PATH_IDS: Record<string, string[]> = { cloud: cloudPathIds, ruyi: ruyiPathIds, dragon: dragonPathIds, huiwen: huiwenPathIds, custom: [] };

function themeColors(pathIds: string[], palette: SwatchColor[]): Record<string, string> {
  const m: Record<string, string> = {};
  pathIds.forEach((id, i) => { m[id] = palette[i % palette.length].hex; });
  return m;
}

interface PostDetailProps {
  pattern: Pattern;
  onClose: () => void;
  onAuthorClick: (authorId: string) => void;
}

export default function PostDetail({ pattern, onClose, onAuthorClick }: PostDetailProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const baseLikes = pattern.likesCount || 0;
  const baseSaves = pattern.savesCount || 0;
  const [liked, setLiked] = useState(pattern.isLiked || false);
  const [saved, setSaved] = useState(pattern.isSaved || false);
  const displayLikes = baseLikes + (liked ? 1 : 0) - (pattern.isLiked ? 1 : 0);
  const displaySaves = baseSaves + (saved ? 1 : 0) - (pattern.isSaved ? 1 : 0);
  const isSelf = pattern.authorId === 'self';

  const name = pattern.name;
  const description = pattern.story;
  const authorName = pattern.authorId === 'self'
    ? (localStorage.getItem('silkweave-profile-name') || t('common.you'))
    : (pattern.authorName || '');
  const authorId = pattern.authorId || authorName;
  const user = getUserById(authorId) || getUserByAuthorName(authorName);
  const timeAgo = pattern.publishedAt ? formatTimeAgo(pattern.publishedAt) : '';

  const { lang } = useLanguage();
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const commentInputRef = useRef<HTMLInputElement>(null);
  const [transDesc, setTransDesc] = useState('');
  const [showTransDesc, setShowTransDesc] = useState(false);
  const [transLoading, setTransLoading] = useState(false);
  const [commentTrans, setCommentTrans] = useState<Record<string, string>>({});
  const [commentTransShown, setCommentTransShown] = useState<Record<string, boolean>>({});

  const translateText = async (text: string): Promise<string> => {
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target: lang }),
      });
      const data = await res.json();
      if (!data.translation) throw new Error('no translation');
      return data.translation;
    } catch { toast(t('ai.translateFailed'), 'error'); return text; }
  };

  useEffect(() => {
    getComments(pattern.id).then(setComments);
  }, [pattern.id]);

  const handleSendComment = async () => {
    const text = commentText.trim();
    if (!text) return;
    const profileName = localStorage.getItem('silkweave-profile-name') || t('common.you');
    const comment = await addComment(pattern.id, profileName, 'self', text);
    if (comment) setComments((prev) => [...prev, comment]);
    setCommentText('');
  };

  const handleLike = async () => {
    const next = await toggleLike(pattern.id);
    setLiked(next);
  };

  const handleSave = async () => {
    const next = await toggleSave(pattern.id);
    setSaved(next);
  };

  return (
    <div className="absolute inset-0 z-50 bg-paper overflow-y-auto animate-[slideUp_0.2s_ease-out] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-paper/90 backdrop-blur-sm z-10 px-4 py-3 flex items-center gap-3 border-b border-charcoal/5 shrink-0">
        <button onClick={onClose} aria-label={t('common.goBack')} className="p-1 -ml-1">
          <ArrowLeft size={20} className="text-charcoal" />
        </button>
        <button onClick={() => onAuthorClick(authorId)} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ backgroundColor: isSelf ? '#2E5C4E' : (user?.color || '#2E5C4E') }}>
            {isSelf ? (authorName[0] || t('common.you')[0]) : (user?.name?.[0] || '?')}
          </div>
          <span className="font-semibold text-sm text-charcoal">{authorName || user?.name || '?'}</span>
        </button>
        <div className="flex-1" />
        {isSelf && (
          <button
            onClick={async () => { if (confirm(t('common.deleteConfirm'))) { await deletePattern(pattern.id); onClose(); } }}
            className="p-1.5 text-charcoal/30 hover:text-red-500 transition-colors"
            aria-label={t('common.delete')}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Pattern image */}
        <div className="w-full aspect-square bg-white flex items-center justify-center p-8 shrink-0">
          {(() => {
            const SvgComponent = SVG_MAP[pattern.svgId];
            if (!SvgComponent) return <div className="w-24 h-24 rounded-full bg-charcoal/5" />;
            if (pattern.svgId === 'custom') {
              return <CustomPattern variant="color" fillColors={{}} paths={pattern.customPaths || []} viewBox={pattern.customViewBox} imageUrl={(pattern as any).customImage} />;
            }
            const paletteTheme = themes.find(th => th.id === RECOMMENDED_THEME[pattern.svgId]) ?? themes[0];
            const pathIds = PATH_IDS[pattern.svgId];
            const colors = themeColors(pathIds, paletteTheme.colors);
            return <SvgComponent variant="color" fillColors={colors} />;
          })()}
        </div>

        {/* Actions */}
        <div className="px-4 pt-3 flex items-center gap-4">
          <button onClick={handleLike} className="flex items-center gap-1">
            <Heart size={22} className={liked ? 'fill-red-500 text-red-500' : 'text-charcoal/50'} strokeWidth={liked ? 2 : 1.5} />
            <span className="text-xs text-charcoal/40 font-medium">{displayLikes}</span>
          </button>
          <button onClick={handleSave} className="flex items-center gap-1">
            <Bookmark size={22} className={saved ? 'fill-jade text-jade' : 'text-charcoal/50'} strokeWidth={saved ? 2 : 1.5} />
            <span className="text-xs text-charcoal/40 font-medium">{displaySaves}</span>
          </button>
        </div>

        {/* Caption */}
        <div className="px-4 py-2 space-y-1.5">
          {authorName && (
            <p className="text-sm">
              <button onClick={() => onAuthorClick(authorId)} className="font-semibold text-charcoal hover:underline">
                {authorName}
              </button>
              <span className="ml-1.5 text-charcoal/80 text-sm">{name}</span>
            </p>
          )}
          {description && (
            <div>
              <p className="text-xs text-charcoal/50 leading-relaxed">
                {showTransDesc && transDesc ? transDesc : description}
              </p>
              <button
                onClick={async () => {
                  if (transDesc) { setShowTransDesc(!showTransDesc); return; }
                  setTransLoading(true);
                  const tr = await translateText(description);
                  setTransDesc(tr);
                  setShowTransDesc(true);
                  setTransLoading(false);
                }}
                disabled={transLoading}
                className="flex items-center gap-1 mt-1 text-[10px] text-jade/60 hover:text-jade transition-colors"
              >
                {transLoading ? <Loader2 size={10} className="animate-spin" /> : <Languages size={10} />}
                {transDesc ? (showTransDesc ? t('ai.showOriginal') : t('ai.translate')) : t('ai.translate')}
              </button>
            </div>
          )}
          {timeAgo && (
            <p className="text-[10px] text-charcoal/25 flex items-center gap-1">
              <Clock size={10} />{timeAgo}
            </p>
          )}
        </div>

        {/* Comments section */}
        <div className="border-t border-charcoal/5 px-4 py-3 pb-4">
          {comments.length > 0 && (
            <div className="space-y-3">
              {comments.map((c: any) => {
                const cu = getUserById(c.authorId);
                const cName = c.authorId === 'self' ? (localStorage.getItem('silkweave-profile-name') || t('common.you')) : c.authorName;
                const color = c.authorId === 'self' ? '#2E5C4E' : (cu?.color || '#8C8C8C');
                const initial = cName[0] || '?';
                return (
                  <div key={c.id} className="flex gap-2">
                    <button onClick={() => onAuthorClick(c.authorId || c.authorName)} className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0 mt-0.5" style={{ backgroundColor: color }}>{initial}</button>
                    <div className="min-w-0">
                      <button onClick={() => onAuthorClick(c.authorId || c.authorName)} className="text-xs font-semibold text-charcoal/60 mr-1.5 hover:underline">{cName}</button>
                      <span className="text-xs text-charcoal/70">
                        {commentTransShown[c.id] && commentTrans[c.id] ? commentTrans[c.id] : c.text}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-charcoal/30">{formatTimeAgo(c.createdAt)}</span>
                        {c.authorId === 'self' && (
                          <button
                            onClick={async () => { await deleteComment(c.id); setComments(prev => prev.filter(x => x.id !== c.id)); }}
                            className="text-[10px] text-charcoal/25 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={9} />
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (commentTrans[c.id]) {
                              setCommentTransShown(p => ({ ...p, [c.id]: !p[c.id] }));
                              return;
                            }
                            const tr = await translateText(c.text);
                            setCommentTrans(p => ({ ...p, [c.id]: tr }));
                            setCommentTransShown(p => ({ ...p, [c.id]: true }));
                          }}
                          className="text-[10px] text-jade/50 hover:text-jade transition-colors flex items-center gap-0.5"
                        >
                          <Languages size={9} />
                          {commentTrans[c.id] ? (commentTransShown[c.id] ? t('ai.showOriginal') : t('ai.translate')) : t('ai.translate')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {/* Comment input */}
        <div className="flex items-center gap-2">
        <input
          ref={commentInputRef}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
          placeholder={t('detail.commentPlaceholder')}
          className="flex-1 bg-charcoal/5 rounded-full px-4 py-2 text-xs text-charcoal placeholder:text-charcoal/25 outline-none"
        />
        <button onClick={handleSendComment} disabled={!commentText.trim()} aria-label={t('common.sendComment')} className="p-1.5 rounded-full text-jade hover:bg-jade/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
