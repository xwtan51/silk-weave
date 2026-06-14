import { Compass, Search, Palette, BookOpen, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Tab } from '../../App';

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { key: Tab; icon: typeof Compass; labelKey: string }[] = [
  { key: 'discover', icon: Compass, labelKey: 'tab.discover' },
  { key: 'explore', icon: Search, labelKey: 'tab.explore' },
  { key: 'create', icon: Palette, labelKey: 'tab.create' },
  { key: 'learn', icon: BookOpen, labelKey: 'tab.learn' },
  { key: 'profile', icon: User, labelKey: 'tab.profile' },
];

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const { t } = useTranslation();

  return (
    <nav className="shrink-0 flex items-center justify-around py-2 pb-4 px-1 border-t border-black/5 bg-paper">
      {tabs.map(({ key, icon: Icon, labelKey }) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-colors ${
            activeTab === key
              ? 'text-jade'
              : 'text-charcoal/40 hover:text-charcoal/70'
          }`}
        >
          <Icon size={18} strokeWidth={activeTab === key ? 2.5 : 1.5} />
          <span className="text-[9px] font-medium whitespace-nowrap">{t(labelKey)}</span>
        </button>
      ))}
    </nav>
  );
}
