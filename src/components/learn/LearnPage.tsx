import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Palette } from 'lucide-react';
import FilterBar from '../explore/FilterBar';
import PatternCard from '../explore/PatternCard';
import DetailModal from '../explore/DetailModal';
import PaletteContent from '../palette/PalettePage';
import { patterns as builtInPatterns } from '../../data/patterns';
import type { Pattern } from '../../types';

type LearnTab = 'patterns' | 'palette';
type FilterCategory = 'dynasty' | 'meaning' | 'scene';

export default function LearnPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<LearnTab>('patterns');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('dynasty');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);

  const tags = getTags(activeCategory, t);
  const filteredPatterns = selectedTag
    ? builtInPatterns.filter((p) => getField(p, activeCategory) === selectedTag)
    : builtInPatterns;

  return (
    <div className="min-h-full p-5 pb-8 space-y-4">
      {/* Toggle */}
      <div className="flex bg-charcoal/5 rounded-xl p-1">
        {([
          { key: 'patterns' as LearnTab, icon: BookOpen, label: t('learn.patternsTab') },
          { key: 'palette' as LearnTab, icon: Palette, label: t('learn.palettesTab') },
        ]).map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === key ? 'bg-white text-jade shadow-sm' : 'text-charcoal/40 hover:text-charcoal/60'}`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {activeTab === 'patterns' ? (
        <>
          <FilterBar
            activeCategory={activeCategory}
            onCategoryChange={(cat) => { setActiveCategory(cat); setSelectedTag(null); }}
            tags={tags}
            selectedTag={selectedTag}
            onTagChange={setSelectedTag}
          />
          <div className="grid grid-cols-2 gap-3">
            {filteredPatterns.map((p) => (
              <PatternCard key={p.id} pattern={p} onClick={() => setSelectedPattern(p)} />
            ))}
          </div>
        </>
      ) : (
        <PaletteContent />
      )}

      {selectedPattern && (
        <DetailModal pattern={selectedPattern} onClose={() => setSelectedPattern(null)} />
      )}
    </div>
  );
}

/* helpers */
type TagItem = { key: string; label: string };

function getTags(category: FilterCategory, t: ReturnType<typeof useTranslation>['t']): TagItem[] {
  const seen = new Set<string>();
  const result: TagItem[] = [];
  for (const p of builtInPatterns) {
    const key = getField(p, category);
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ key, label: t(`pattern.${p.svgId}.${category}`) });
    }
  }
  return result;
}

function getField(p: Pattern, category: FilterCategory): string {
  return category === 'dynasty' ? p.dynasty : category === 'meaning' ? p.meaning : p.scene;
}
