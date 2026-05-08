import { useState, useEffect } from 'react';
import { useDarkMode } from './hooks/useDarkMode';
import Nav from './components/Nav.jsx';
import MarketBar from './components/MarketBar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NewsPage from './pages/NewsPage.jsx';
import AdvisorPage from './pages/AdvisorPage.jsx';
import AlertsPage from './pages/AlertsPage.jsx';
import DiscoverPage from './pages/DiscoverPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import AlertBanner from './components/AlertBanner.jsx';

export default function App() {
  const [page, setPage] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return ['portfolio','news','advisor','alerts','discover','settings'].includes(hash) ? hash : 'portfolio';
  });
  const { dark } = useDarkMode();

  useEffect(() => {
    window.location.hash = page;
  }, [page]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <div className="flex flex-col sm:flex-row min-h-screen bg-white dark:bg-[#0a0e1a] text-slate-900 dark:text-slate-100">
      <Nav page={page} setPage={setPage} />
      <main className="flex-1 overflow-auto flex flex-col">
        <MarketBar />
        <AlertBanner />
        <div className="flex-1">
          {page === 'portfolio' && <Dashboard />}
          {page === 'news'      && <NewsPage />}
          {page === 'advisor'   && <AdvisorPage />}
          {page === 'alerts'    && <AlertsPage />}
          {page === 'discover'  && <DiscoverPage />}
          {page === 'settings'  && <SettingsPage />}
        </div>
      </main>
    </div>
  );
}
