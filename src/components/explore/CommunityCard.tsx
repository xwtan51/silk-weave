import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Clock, Heart, Bookmark } from 'lucide-react';
import CustomPattern from '../svgs/CustomPattern';
import { toggleLike, toggleSave } from '../../data/social';
import { formatTimeAgo } from '../../utils/time';
import type { Pattern } from '../../types';

interface CommunityCardProps {
  pattern: Pattern;
  onClick: () => void;
  onAuthorClick?: (authorId: string) => void;
  compact?: boolean;
}

export default function CommunityCard({ pattern, onClick, onAuthorClick, compact }: CommunityCardProps) {
  const { t } = useTranslation();
  const name = pattern.name;
  const timeAgo = pattern.publishedAt ? formatTimeAgo(pattern.publishedAt) : '';
  const authorName = pattern.authorId === 'self'
    ? (localStorage.getItem('silkweave-profile-name') || t('common.you'))
    : pattern.authorName;

  const baseLikes = pattern.likesCount || 0;
  const baseSaves = pattern.savesCount || 0;
  const [liked, setLiked] = useState(pattern.isLiked || false);
  const [saved, setSaved] = useState(pattern.isSaved || false);
  const displayLikes = baseLikes + (liked ? 1 : 0) - (pattern.isLiked ? 1 : 0);
  const displaySaves = baseSaves + (saved ? 1 : 0) - (pattern.isSaved ? 1 : 0);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = await toggleLike(pattern.id);
    setLiked(next);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = await toggleSave(pattern.id);
    setSaved(next);
  };

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm border border-charcoal/5 overflow-hidden text-left hover:shadow-md active:scale-[0.98] transition-all w-full"
    >
      {/* Pattern image — with like count overlay in compact mode */}
      <div className={`bg-paper flex items-center justify-center relative ${compact ? 'w-full aspect-square p-3' : 'w-full aspect-[4/3] p-6'}`}>
        {pattern.customPaths ? (
          <CustomPattern variant="color" paths={pattern.customPaths || []} viewBox={pattern.customViewBox} imageUrl={(pattern as any).customImage} />
        ) : (
          <div className="w-16 h-16 rounded-full bg-charcoal/10" />
        )}
        {/* Like count overlay — compact mode only */}
        {compact && (
          <div className="absolute bottom-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/30 text-white text-[10px] font-medium">
            <Heart size={10} className="fill-white text-white" />
            {displayLikes}
          </div>
        )}
      </div>

      {/* Action bar — hidden in compact */}
      {!compact && (
        <div className="px-4 pt-3 flex items-center gap-4">
          <button onClick={handleLike} className="flex items-center gap-1">
            <Heart size={18} className={liked ? 'fill-red-500 text-red-500' : 'text-charcoal/40'} strokeWidth={liked ? 2 : 1.5} />
            <span className="text-[11px] text-charcoal/30">{displayLikes}</span>
          </button>
          <button onClick={handleSave} className="flex items-center gap-1">
            <Bookmark size={18} className={saved ? 'fill-jade text-jade' : 'text-charcoal/40'} strokeWidth={saved ? 2 : 1.5} />
            <span className="text-[11px] text-charcoal/30">{displaySaves}</span>
          </button>
        </div>
      )}

      {/* Info bar */}
      <div className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} flex items-center justify-between`}>
        <div className="min-w-0 flex-1">
          <h3 className={`font-semibold text-charcoal truncate ${compact ? 'text-[11px]' : 'text-sm'}`}>{name}</h3>
          {authorName && (
            compact ? (
              <p className="text-[10px] text-charcoal/40 truncate mt-0.5">@{authorName}</p>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); onAuthorClick?.(pattern.authorId || authorName || ''); }}
                className="flex items-center gap-1 mt-0.5 text-[11px] text-jade/70 hover:text-jade transition-colors">
                <User size={11} /><span>@{authorName}</span>
              </button>
            )
          )}
          {compact && timeAgo && (
            <p className="text-[9px] text-charcoal/30 mt-1 flex items-center gap-0.5">
              <Clock size={8} />{timeAgo}
            </p>
          )}
        </div>
        {!compact && timeAgo && (
          <span className="flex items-center gap-1 text-[10px] text-charcoal/30 shrink-0"><Clock size={10} />{timeAgo}</span>
        )}
      </div>
    </button>
  );
}
