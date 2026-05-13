import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell, BookOpenCheck, CalendarDays, ChevronDown, CircleUserRound, Eye,
  FileText, Lightbulb, LineChart, LogOut, Rocket, Settings, ShieldCheck,
  Sparkles, TerminalSquare,
} from 'lucide-react';

const TABS = [
  { id: 'hub', label: 'Hub', Icon: Sparkles },
  { id: 'portfolio', label: 'Portfolio', Icon: CircleUserRound },
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'news', label: 'Intel Feed' },
  { id: 'advisor', label: 'AI Advisor', Icon: Sparkles },
  { id: 'coach', label: 'AI Coach', Icon: BookOpenCheck },
  { id: 'alerts', label: 'Alerts' },
  { id: 'discover', label: 'Discover', Icon: Rocket },
  { id: 'insiders', label: 'Insiders', Icon: Eye },
  { id: 'institutional', label: 'Institutional', Icon: ShieldCheck },
  { id: 'calendar', label: 'Calendar', Icon: CalendarDays },
  { id: 'trades', label: 'Trade Log', Icon: FileText },
  { id: 'settings', label: 'Settings', Icon: Settings },
];

const DEVELOPER_TAB = { id: 'developer', label: 'Developer', Icon: TerminalSquare };

function AuraMark() {
  return (
    <svg width="31" height="31" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="aura-nav-mark" x1="5" y1="5" x2="34" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EAFDFF" />
          <stop offset=".42" stopColor="#8EDFFF" />
          <stop offset=".72" stopColor="#8B7CFF" />
          <stop offset="1" stopColor="#E7D5FF" />
        </linearGradient>
      </defs>
      <path d="M20.5 5.6 33.8 34h-7.3l-2.7-6.2H13.7L11 34H4.2L17.4 5.6h3.1Zm.8 16.5-2.5-6.2-2.6 6.2h5.1Z" fill="url(#aura-nav-mark)" />
      <path d="M11.2 27.3c5.2-7.9 11-10.8 18.3-8.7" stroke="#EAFDFF" strokeOpacity=".55" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export default function MarketBar({ page, setPage, user, onLogout }) {
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const avatarRef = useRef(null);
  const moreRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (!avatarRef.current?.contains(e.target)) setAvatarOpen(false);
      if (!moreRef.current?.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const visibleTabs = user?.id === 'rashidelramlawy' ? [...TABS, DEVELOPER_TAB] : TABS;
  const avatarLetter = user?.id?.[0]?.toUpperCase() ?? 'A';

  return (
    <header className="aura-nav-shell">
      <nav className="aura-nav" aria-label="Aura main navigation">
        <button className="aura-nav__brand" onClick={() => setPage?.('hub')} aria-label="Go to Dashboard">
          <AuraMark />
          <span>Aura</span>
        </button>

        <div className="aura-nav__tabs">
          {visibleTabs.map(({ id, label, Icon = LineChart }) => {
            const active = page === id;
            return (
              <button
                key={id}
                onClick={() => setPage?.(id)}
                className={`aura-nav__tab${active ? ' aura-nav__tab--active' : ''}`}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            );
          })}

          <div ref={moreRef} className="aura-nav__more aura-nav__more--compact">
            <button
              onClick={() => setMoreOpen(v => !v)}
              className="aura-nav__tab"
              aria-expanded={moreOpen}
              aria-label="Open quick navigation"
            >
              <Lightbulb size={15} />
              <span>More</span>
              <ChevronDown size={14} />
            </button>
            <AnimatePresence>
              {moreOpen && (
                <motion.div
                  className="aura-nav__menu"
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.14 }}
                >
                  {visibleTabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setMoreOpen(false);
                        setPage?.(tab.id);
                      }}
                      className={page === tab.id ? 'is-active' : ''}
                    >
                      {tab.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="aura-nav__actions">
          <button className="aura-nav__icon-btn" aria-label="Notifications" onClick={() => setPage?.('alerts')}>
            <Bell size={18} />
            <span className="aura-nav__dot" />
          </button>

          <div ref={avatarRef} className="aura-nav__avatar-wrap">
            <button className="aura-nav__avatar" onClick={() => setAvatarOpen(v => !v)} aria-expanded={avatarOpen}>
              <span>{avatarLetter}</span>
              <ChevronDown size={14} />
            </button>
            <AnimatePresence>
              {avatarOpen && (
                <motion.div
                  className="aura-nav__profile"
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.14 }}
                >
                  <div className="aura-nav__profile-name">{user?.id ?? 'Investor'}</div>
                  <button onClick={() => { setAvatarOpen(false); setPage?.('settings'); }}>
                    <Settings size={14} />
                    Settings
                  </button>
                  <button onClick={() => { setAvatarOpen(false); onLogout?.(); }}>
                    <LogOut size={14} />
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>
    </header>
  );
}
