import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import Nav from './components/Nav.jsx';
import MarketBar from './components/MarketBar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NewsPage from './pages/NewsPage.jsx';
import AdvisorPage from './pages/AdvisorPage.jsx';
import AlertsPage from './pages/AlertsPage.jsx';
import DiscoverPage from './pages/DiscoverPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import AlertBanner from './components/AlertBanner.jsx';
import LoginPage from './pages/LoginPage.jsx';

export default function App() {
  const [page, setPage] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return ['portfolio','news','advisor','alerts','discover','settings'].includes(hash) ? hash : 'portfolio';
  });
  const { user, loading } = useAuth();

  useEffect(() => {
    window.location.hash = page;
  }, [page]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020810]">
        <div className="arc-reactor w-12 h-12">
          <div className="w-5 h-5 rounded-full bg-[rgba(0,212,255,0.2)] border border-[rgba(0,212,255,0.8)]" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex flex-col sm:flex-row min-h-screen bg-[#020810]">
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
