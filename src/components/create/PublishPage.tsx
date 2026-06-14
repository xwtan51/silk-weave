import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Send } from 'lucide-react';
import CustomPattern from '../svgs/CustomPattern';
import type { Pattern, CustomPath } from '../../types';

export interface PublishData {
  paths: CustomPath[];
  viewBox?: string;
  imageUrl?: string;
  defaultTitle?: string;
}

interface PublishPageProps {
  data: PublishData;
  onPost: (pattern: Pattern) => void;
  onClose: () => void;
}

export default function PublishPage({ data, onPost, onClose }: PublishPageProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(data.defaultTitle || '');
  const [desc, setDesc] = useState('');

  const fallback = t('create.myPattern');

  const handlePost = () => {
    const name = title.trim() || fallback;
    const d = desc.trim() || t('create.sharedByYou');
    const p: Pattern = {
      id: `pub-${Date.now()}`,
      name,
      dynasty: t('create.dynasty'),
      meaning: t('create.meaning'),
      scene: t('create.scene'),
      story: d,
      source: t('create.source'),
      svgId: 'custom',
      customPaths: data.paths,
      customViewBox: data.viewBox || '0 0 1024 1024',
      customImage: data.imageUrl,
      authorName: t('common.you'), authorId: 'self',
      lang: 'zh',
      publishedAt: new Date().toISOString(),
    };
    onPost(p);
  };

  return (
    <div className="absolute inset-0 z-50 bg-paper flex flex-col animate-[slideUp_0.2s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-charcoal/5 shrink-0">
        <button onClick={onClose} className="p-1 -ml-1"><ArrowLeft size={20} className="text-charcoal" /></button>
        <h2 className="font-semibold text-sm text-charcoal">{t('create.publish')}</h2>
        <div className="flex-1" />
        <button onClick={handlePost} className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-jade text-white text-xs font-medium">
          <Send size={13} />{t('common.post')}
        </button>
      </div>

      {/* Preview + Form */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {/* Preview */}
        <div className="bg-white rounded-2xl border border-charcoal/5 overflow-hidden">
          <div className="w-full aspect-square flex items-center justify-center p-6 bg-paper">
            {data.imageUrl ? (
              <img src={data.imageUrl} alt="preview" className="max-w-full max-h-full object-contain rounded-lg" />
            ) : (
              <CustomPattern variant="color" fillColors={{}} paths={data.paths} viewBox={data.viewBox} />
            )}
          </div>
        </div>

        {/* Title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={fallback}
          className="w-full px-4 py-3 bg-white rounded-xl border border-charcoal/10 text-sm text-charcoal placeholder:text-charcoal/25 outline-none focus:border-jade"
        />

        {/* Description */}
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder={t('create.captionPlaceholder')}
          rows={4}
          className="w-full px-4 py-3 bg-white rounded-xl border border-charcoal/10 text-sm text-charcoal placeholder:text-charcoal/25 outline-none focus:border-jade resize-none"
        />
      </div>
    </div>
  );
}
