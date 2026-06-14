import { useTranslation } from 'react-i18next';

type FilterCategory = 'dynasty' | 'meaning' | 'scene';

interface TagItem {
  key: string;
  label: string;
}

interface FilterBarProps {
  activeCategory: FilterCategory;
  onCategoryChange: (cat: FilterCategory) => void;
  tags: TagItem[];
  selectedTag: string | null;
  onTagChange: (tag: string | null) => void;
}

const categories: { key: FilterCategory; labelKey: string }[] = [
  { key: 'dynasty', labelKey: 'filter.dynasty' },
  { key: 'meaning', labelKey: 'filter.meaning' },
  { key: 'scene', labelKey: 'filter.scene' },
];

export default function FilterBar({
  activeCategory,
  onCategoryChange,
  tags,
  selectedTag,
  onTagChange,
}: FilterBarProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-5">
      {/* Category pills */}
      <div className="flex gap-2 mb-3">
        {categories.map(({ key, labelKey }) => (
          <button
            key={key}
            onClick={() => onCategoryChange(key)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeCategory === key
                ? 'bg-jade text-white'
                : 'bg-white text-charcoal/60 border border-charcoal/10 hover:border-jade/30'
            }`}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* Tag pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onTagChange(null)}
          className={`px-3 py-1 rounded-full text-xs transition-colors ${
            selectedTag === null
              ? 'bg-vermillion text-white'
              : 'bg-white text-charcoal/50 border border-charcoal/10'
          }`}
        >
          {t('filter.all')}
        </button>
        {tags.map((tag) => (
          <button
            key={tag.key}
            onClick={() =>
              onTagChange(selectedTag === tag.key ? null : tag.key)
            }
            className={`px-3 py-1 rounded-full text-xs transition-colors ${
              selectedTag === tag.key
                ? 'bg-vermillion text-white'
                : 'bg-white text-charcoal/50 border border-charcoal/10 hover:border-vermillion/30'
            }`}
          >
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
}
