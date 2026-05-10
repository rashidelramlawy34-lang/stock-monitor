import { useMarket } from '../hooks/useMarket';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { id: 'hub',           label: 'Hub' },
  { id: 'portfolio',     label: 'Portfolio' },
  { id: 'watchlist',     label: 'Watchlist' },
  { id: 'news',          label: 'News' },
  { id: 'advisor',       label: 'AI Advisor' },
  { id: 'coach',         label: 'AI Coach' },
  { id: 'alerts',        label: 'Alerts' },
  { id: 'discover',      label: 'Discover' },
  { id: 'insiders',      label: 'Insiders' },
  { id: 'institutional', label: 'Institutional' },
  { id: 'calendar',      label: 'Calendar' },
  { id: 'trades',        label: 'Trade Log' },
  { id: 'settings',      label: 'Settings' },
];

const INDICES = [
  { key: 'SPY', label: 'S&P' },
  { key: 'QQQ', label: 'NQ' },
  { key: 'DIA', label: 'DOW' },
];

function isMarketOpen() {
  const now = new Date();
  const et  = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day  = et.getDay();
  const mins = et.getHours() * 60 + et.getMinutes();
  return day >= 1 && day <= 5 && mins >= 570 && mins < 960;
}

function pad(n) { return String(n).padStart(2, '0'); }

export default function MarketBar({ page, setPage, user, onLogout }) {
  const { indices } = useMarket();
  const [time, setTime] = useState(new Date());
  const [tick, setTick] = useState(true);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => { setTime(new Date()); setTick(t => !t); }, 1000);
    return () => clearInterval(id);
  }, []);

  // Close avatar dropdown on outside click
  useEffect(() => {
    if (!avatarOpen) return;
    const handler = (e) => {
      if (!avatarRef.current?.contains(e.target)) setAvatarOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [avatarOpen]);

  const open = isMarketOpen();
  const et   = new Date(time.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const hh   = pad(et.getHours());
  const mm   = pad(et.getMinutes());
  const ss   = pad(et.getSeconds());
  const avatarLetter = user?.id?.[0]?.toUpperCase() ?? '?';

  return (
    <div style={{
      height: 52, flexShrink: 0,
      display: 'flex', alignItems: 'center',
      background: 'rgba(15, 22, 50, 0.7)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 100,
      gap: 0,
    }}>

      {/* Left: gradient wordmark → Hub */}
      <button
        onClick={() => setPage?.('hub')}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '0 20px', height: '100%', flexShrink: 0,
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Mini orb icon */}
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          background: 'var(--accent-grad)',
          boxShadow: '0 0 8px var(--glow)',
          flexShrink: 0,
        }} />
        <span style={{
          fontSize: 14, fontWeight: 600,
          background: 'var(--accent-grad)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontFamily: 'var(--font-sans)',
          letterSpacing: '-0.01em',
        }}>
          Stock Monitor
        </span>
      </button>

      {/* Center: tab pills with sliding indicator */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        overflowX: 'auto', overflowY: 'hidden',
        scrollbarWidth: 'none',
        padding: '0 8px',
        gap: 2,
      }}>
        {TABS.map(({ id, label }) => {
          const isActive = page === id;
          return (
            <button
              key={id}
              onClick={() => setPage?.(id)}
              style={{
                position: 'relative',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '6px 12px',
                fontSize: 13, fontWeight: isActive ? 500 : 400,
                color: isActive ? 'var(--text)' : 'var(--text-2)',
                fontFamily: 'var(--font-sans)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'color 0.15s',
              }}
            >
              {label}
              {/* Sliding gradient underline */}
              {isActive && (
                <motion.div
                  layoutId="nav-tab-indicator"
                  style={{
                    position: 'absolute', bottom: 0, left: 8, right: 8,
                    height: 2,
                    background: 'var(--accent-grad)',
                    borderRadius: 1,
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Right: market tickers + user avatar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '0 16px', flexShrink: 0,
        borderLeft: '1px solid var(--border)',
      }}>
        {/* Market tickers */}
        {INDICES.map(({ key, label }) => {
          const d   = indices[key];
          const pos = d ? d.change_pct >= 0 : null;
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                {label}
              </span>
              {d ? (
                <span style={{
                  fontSize: 11, fontFamily: 'var(--font-mono)',
                  color: pos ? 'var(--gain)' : 'var(--loss)',
                }}>
                  {pos ? '+' : ''}{d.change_pct?.toFixed(2)}%
                </span>
              ) : (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>—</span>
              )}
            </div>
          );
        })}

        {/* Market status dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            background: open ? 'var(--gain)' : 'var(--text-muted)',
            boxShadow: open ? '0 0 6px var(--gain)' : 'none',
          }} />
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
            {open ? 'Open' : 'Closed'}
          </span>
        </div>

        {/* Clock */}
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--text-2)', letterSpacing: '0.02em',
        }}>
          {hh}
          <span style={{ opacity: tick ? 1 : 0.25 }}>:</span>
          {mm}
          <span style={{ color: 'var(--text-muted)', marginLeft: 3, fontSize: 9 }}>ET</span>
        </span>

        {/* User avatar + dropdown */}
        <div ref={avatarRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setAvatarOpen(v => !v)}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--accent-grad)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff',
              boxShadow: avatarOpen ? '0 0 12px var(--glow)' : 'none',
              transition: 'box-shadow 0.2s',
            }}
          >
            {avatarLetter}
          </button>

          <AnimatePresence>
            {avatarOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute', top: 36, right: 0,
                  minWidth: 140,
                  background: 'rgba(15, 22, 50, 0.92)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid var(--border-2)',
                  borderRadius: 10,
                  padding: '4px 0',
                  zIndex: 200,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                <div style={{
                  padding: '8px 14px 6px',
                  fontSize: 11, color: 'var(--text-muted)',
                  borderBottom: '1px solid var(--border)',
                  marginBottom: 4,
                }}>
                  {user?.id ?? 'Unknown user'}
                </div>
                <button
                  onClick={() => { setAvatarOpen(false); onLogout?.(); }}
                  style={{
                    display: 'block', width: '100%',
                    padding: '7px 14px', textAlign: 'left',
                    background: 'none', border: 'none',
                    fontSize: 13, color: 'var(--text-2)',
                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    transition: 'color 0.12s, background 0.12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--loss)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-2)'; }}
                >
                  Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
