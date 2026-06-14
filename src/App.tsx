import { useState } from 'react';
import PhoneFrame from './components/layout/PhoneFrame';
import HeaderBar from './components/layout/HeaderBar';
import TabBar from './components/layout/TabBar';
import OfflineBanner from './components/layout/OfflineBanner';
import SettingsModal from './components/layout/SettingsModal';
import DiscoverPage from './components/discover/DiscoverPage';
import ExplorePage from './components/explore/ExplorePage';
import CreatePage from './components/create/CreatePage';
import LearnPage from './components/learn/LearnPage';
import ProfilePage from './components/profile/ProfilePage';
import type { Pattern } from './types';

export type Tab = 'discover' | 'explore' | 'create' | 'learn' | 'profile';

const isElectron = typeof window !== 'undefined' && (window as any).electron?.isElectron;

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('discover');
  const [patternToColor] = useState<Pattern | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const handleNavigateToExplore = () => setActiveTab('explore');

  const content = (
    <>
      <HeaderBar onSettingsClick={() => setShowSettings(true)} />
      <main className="flex-1 overflow-y-auto bg-paper relative [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {activeTab === 'discover' && (
          <DiscoverPage onStart={handleNavigateToExplore} />
        )}
        {activeTab === 'explore' && <ExplorePage />}
        {activeTab === 'create' && (
          <CreatePage patternToColor={patternToColor} />
        )}
        {activeTab === 'learn' && <LearnPage />}
        {activeTab === 'profile' && <ProfilePage />}
      </main>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  );

  return (
    <>
      <OfflineBanner />
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {isElectron ? (
        <div className="h-screen flex flex-col bg-paper overflow-hidden">{content}</div>
      ) : (
        <PhoneFrame>{content}</PhoneFrame>
      )}
    </>
  );
}
