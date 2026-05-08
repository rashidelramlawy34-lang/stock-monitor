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
import DeveloperPage from './pages/DeveloperPage.jsx';
import AlertBanner from './components/AlertBanner.jsx';
import LoginPage from './pages/LoginPage.jsx';
import WatchlistPage from './pages/WatchlistPage.jsx';
import CoachPage from './pages/CoachPage.jsx';
import TradeLogPage from './pages/TradeLogPage.jsx';
import InsidersPage from './pages/InsidersPage.jsx';
import InstitutionalPage from './pages/InstitutionalPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';

const ALL_PAGES = ['portfolio','watchlist','news','advisor','coach','alerts','discover','insiders','institutional','calendar','trades','settings','developer'];

export default function App() {
  const [page, setPage] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return ALL_PAGES.includes(hash) ? hash : 'portfolio';
  });
  const { user, loading, setUser } = useAuth();

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
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <div className="flex flex-col sm:flex-row min-h-screen bg-[#020810]">
      <Nav page={page} setPage={setPage} user={user} />
      <main className="flex-1 overflow-auto flex flex-col">
        <MarketBar />
        <AlertBanner />
        <div className="flex-1">
          {page === 'portfolio'  && <Dashboard />}
          {page === 'watchlist'  && <WatchlistPage />}
          {page === 'news'       && <NewsPage />}
          {page === 'advisor'    && <AdvisorPage />}
          {page === 'coach'      && <CoachPage />}
          {page === 'alerts'     && <AlertsPage />}
          {page === 'discover'   && <DiscoverPage />}
          {page === 'insiders'      && <InsidersPage />}
          {page === 'institutional' && <InstitutionalPage />}
          {page === 'calendar'      && <CalendarPage />}
          {page === 'trades'     && <TradeLogPage />}
          {page === 'settings'   && <SettingsPage />}
          {page === 'developer'  && user?.id === 'rashidelramlawy' && <DeveloperPage />}
        </div>
      </main>
    </div>
  );
}
