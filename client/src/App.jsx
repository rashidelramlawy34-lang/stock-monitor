import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { ToastProvider } from './contexts/ToastContext.jsx';
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
import LoginPage from './pages/LoginPage.jsx';
import WatchlistPage from './pages/WatchlistPage.jsx';
import CoachPage from './pages/CoachPage.jsx';
import TradeLogPage from './pages/TradeLogPage.jsx';
import InsidersPage from './pages/InsidersPage.jsx';
import InstitutionalPage from './pages/InstitutionalPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

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
  const { user, loading, setUser, logout } = useAuth();

  // Logout transition overlay (fades to black, calls logout, fades back revealing Login)
  const [logoutOverlay, setLogoutOverlay] = useState({ visible: false, opacity: 0 });
  const logoutOverlayTimersRef = useRef([]);

  const handleLogout = useCallback(() => {
    // Cancel any pending timers
    logoutOverlayTimersRef.current.forEach(clearTimeout);
    logoutOverlayTimersRef.current = [];

    // Mount overlay at opacity 0, then fade in
    setLogoutOverlay({ visible: true, opacity: 0 });
    // Two rAFs to allow mount before transition starts
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setLogoutOverlay({ visible: true, opacity: 1 });
    }));

    // After fade-in completes, call server logout
    const t1 = setTimeout(async () => {
      await logout();
      // Logout sets user→null, LoginPage mounts; fade overlay out
      const t2 = setTimeout(() => {
        setLogoutOverlay({ visible: true, opacity: 0 });
        const t3 = setTimeout(() => setLogoutOverlay({ visible: false, opacity: 0 }), 520);
        logoutOverlayTimersRef.current.push(t3);
      }, 80);
      logoutOverlayTimersRef.current.push(t2);
    }, 440);
    logoutOverlayTimersRef.current.push(t1);
  }, [logout]);

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

  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <div className="aura-app-shell">
          <MarketBar page={page} setPage={setPage} pageLabel={PAGE_LABELS[page]} user={user} onLogout={handleLogout} />
          <AlertBanner />
          <div className={page === 'hub' ? '' : 'aura-feature-shell'}>
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: 'spring', stiffness: 100, damping: 18, mass: 0.8 }}
                style={{ flex: 1 }}
              >
                {page === 'hub'           && <DashboardPage setPage={setPage} user={user} />}
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
        </div>
        {logoutOverlay.visible && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#020714',
            opacity: logoutOverlay.opacity,
            transition: 'opacity 0.42s ease',
            pointerEvents: logoutOverlay.opacity > 0.5 ? 'all' : 'none',
          }} />
        )}
      </ToastProvider>
    </MotionConfig>
  );
}
