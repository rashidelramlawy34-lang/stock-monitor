import { useState, useEffect } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { useAuth } from './hooks/useAuth';
import MarketBar from './components/MarketBar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NewsPage from './pages/NewsPage.jsx';
import AdvisorPage from './pages/AdvisorPage.jsx';
import AlertsPage from './pages/AlertsPage.jsx';
import DiscoverPage from './pages/DiscoverPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import DeveloperPage from './pages/DeveloperPage.jsx';
import AlertBanner from './components/AlertBanner.jsx';
import AuraPanel from './components/AuraPanel.jsx';
import LoginPage from './pages/LoginPage.jsx';
import WatchlistPage from './pages/WatchlistPage.jsx';
import CoachPage from './pages/CoachPage.jsx';
import TradeLogPage from './pages/TradeLogPage.jsx';
import InsidersPage from './pages/InsidersPage.jsx';
import InstitutionalPage from './pages/InstitutionalPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import HubPage from './pages/HubPage.jsx';

const ALL_PAGES = ['hub','portfolio','watchlist','news','advisor','coach','alerts','discover','insiders','institutional','calendar','trades','settings','developer'];

const PAGE_LABELS = {
  portfolio: 'Portfolio', watchlist: 'Watchlist', news: 'Intel Feed',
  advisor: 'AI Advisor', coach: 'AI Coach', alerts: 'Alerts',
  discover: 'Discover', insiders: 'Insiders', institutional: 'Institutional',
  calendar: 'Calendar', trades: 'Trade Log', settings: 'Settings', developer: 'Developer',
};

export default function App() {
  const [page, setPage] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return ALL_PAGES.includes(hash) ? hash : 'hub';
  });
  const { user, loading, setUser } = useAuth();

  useEffect(() => { window.location.hash = page; }, [page]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ animation: 'hexFade 1.6s ease-in-out infinite' }}>
          <svg viewBox="0 0 40 40" width="40" height="40">
            {[17, 12, 4].map((r, i) => (
              <polygon key={r} points={(() => {
                const c = 20, pts = [];
                for (let j = 0; j < 6; j++) {
                  const a = -Math.PI / 2 + j * Math.PI / 3;
                  pts.push(`${(c + Math.cos(a) * r).toFixed(2)},${(c + Math.sin(a) * r).toFixed(2)}`);
                }
                return pts.join(' ');
              })()} fill={i === 2 ? '#3b82f6' : 'none'} stroke="#3b82f6"
                strokeWidth={i === 0 ? 1.2 : 0.8} opacity={i === 1 ? 0.6 : 1} />
            ))}
          </svg>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage onLogin={setUser} />;

  if (page === 'hub') return (
    <MotionConfig reducedMotion="user">
      <HubPage setPage={setPage} user={user} />
    </MotionConfig>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <MarketBar page={page} setPage={setPage} pageLabel={PAGE_LABELS[page]} />
        <AlertBanner />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{ flex: 1 }}
            >
              {page === 'portfolio'     && <Dashboard />}
              {page === 'watchlist'     && <WatchlistPage />}
              {page === 'news'          && <NewsPage />}
              {page === 'advisor'       && <AdvisorPage />}
              {page === 'coach'         && <CoachPage />}
              {page === 'alerts'        && <AlertsPage />}
              {page === 'discover'      && <DiscoverPage />}
              {page === 'insiders'      && <InsidersPage />}
              {page === 'institutional' && <InstitutionalPage />}
              {page === 'calendar'      && <CalendarPage />}
              {page === 'trades'        && <TradeLogPage />}
              {page === 'settings'      && <SettingsPage />}
              {page === 'developer'     && user?.id === 'rashidelramlawy' && <DeveloperPage />}
            </motion.div>
          </AnimatePresence>
        </div>
        <AuraPanel />
      </div>
    </MotionConfig>
  );
}
