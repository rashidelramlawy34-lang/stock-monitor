import { useState } from 'react';
import {
  PortfolioIcon, NewsIcon, AdvisorIcon,
  AlertsIcon, DiscoverIcon, SettingsIcon, DeveloperIcon,
  WatchlistIcon, CoachIcon, TradesIcon,
  InsidersIcon, InstitutionalIcon, CalendarIcon,
  SunIcon, MoonIcon,
} from './icons/NavIcons';
import { useDarkMode } from '../hooks/useDarkMode';

const LINKS = [
  { id: 'portfolio',     label: 'Portfolio',     Icon: PortfolioIcon },
  { id: 'watchlist',     label: 'Watchlist',     Icon: WatchlistIcon },
  { id: 'news',          label: 'Intel Feed',    Icon: NewsIcon },
  { id: 'advisor',       label: 'AI Advisor',    Icon: AdvisorIcon },
  { id: 'coach',         label: 'AI Coach',      Icon: CoachIcon },
  { id: 'alerts',        label: 'Alerts',        Icon: AlertsIcon },
  { id: 'discover',      label: 'Discover',      Icon: DiscoverIcon, badge: 'HRHR' },
  { id: 'insiders',      label: 'Insiders',      Icon: InsidersIcon },
  { id: 'institutional', label: 'Institutional', Icon: InstitutionalIcon },
  { id: 'calendar',      label: 'Calendar',      Icon: CalendarIcon },
  { id: 'trades',        label: 'Trade Log',     Icon: TradesIcon },
  { id: 'settings',      label: 'Settings',      Icon: SettingsIcon },
  { id: 'developer',     label: 'Developer',     Icon: DeveloperIcon },
];

const ADMIN_ID = 'rashidelramlawy';

export default function Nav({ page, setPage, user }) {
  const [open, setOpen] = useState(false);
  const { dark, toggle } = useDarkMode();
  const links = LINKS.filter(l => l.id !== 'developer' || user?.id === ADMIN_ID);

  const linkCls = (active) =>
    `flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all duration-150 rounded-md
    ${active
      ? 'text-[#00d4ff] bg-[rgba(0,212,255,0.08)] border-l-2 border-[#00d4ff] pl-[10px]'
      : 'border-l-2 border-transparent text-[rgba(0,212,255,0.42)] hover:text-[rgba(0,212,255,0.85)] hover:bg-[rgba(0,212,255,0.05)]'
    }`;

  return (
    <>
      {/* Mobile top bar */}
      <div className="sm:hidden flex items-center justify-between border-b border-[rgba(0,212,255,0.12)] bg-[#020810] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full border border-[#00d4ff] flex items-center justify-center" style={{ boxShadow: '0 0 10px rgba(0,212,255,0.35)' }}>
            <div className="w-3 h-3 rounded-full border border-[rgba(0,212,255,0.7)] flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-[#00d4ff]" />
            </div>
          </div>
          <span className="hud-title text-sm">S.M.I.</span>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="text-[rgba(0,212,255,0.5)] hover:text-[#00d4ff] text-lg w-7 h-7 flex items-center justify-center transition-colors"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden bg-[#020810] border-b border-[rgba(0,212,255,0.12)] px-2 pb-2">
          {links.map(({ id, label, Icon, badge }) => (
            <button
              key={id}
              onClick={() => { setPage(id); setOpen(false); }}
              className={linkCls(page === id)}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {badge && (
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ffaa00]/10 text-[#ffaa00] border border-[#ffaa00]/25">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden sm:flex flex-col w-56 min-h-screen bg-[#010710] border-r border-[rgba(0,212,255,0.10)] p-4 shrink-0">
        {/* Logo / brand */}
        <div className="mb-6 px-2 pt-1">
          <div className="flex items-center gap-3 mb-1.5">
            {/* Arc Reactor mark — static, clean */}
            <div className="w-8 h-8 rounded-full border-2 border-[#00d4ff] flex items-center justify-center shrink-0"
              style={{ boxShadow: '0 0 12px rgba(0,212,255,0.35), inset 0 0 8px rgba(0,212,255,0.08)' }}>
              <div className="w-3.5 h-3.5 rounded-full border border-[rgba(0,212,255,0.7)] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[rgba(0,212,255,0.6)]" />
              </div>
            </div>
            <span className="hud-title text-sm leading-tight">S.M.I.</span>
          </div>
          <p className="text-[9px] text-[rgba(0,212,255,0.25)] tracking-[0.18em] uppercase pl-11">
            Stark Market Intel
          </p>
        </div>

        <hr className="hud-divider mb-3" />

        <nav className="flex flex-col gap-0.5 flex-1">
          {links.map(({ id, label, Icon, badge }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={linkCls(page === id)}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{label}</span>
              {badge && (
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ffaa00]/10 text-[#ffaa00] border border-[#ffaa00]/25">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <hr className="hud-divider mt-3" />
        <div className="flex items-center justify-between mt-3 px-2">
          <p className="text-[9px] text-[rgba(0,212,255,0.18)] tracking-widest uppercase font-mono">
            JARVIS v2.1
          </p>
          <button
            onClick={toggle}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="text-[rgba(0,212,255,0.35)] hover:text-[#00d4ff] transition-colors p-1 rounded"
          >
            {dark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
}
