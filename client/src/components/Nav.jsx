import { useState } from 'react';
import {
  PortfolioIcon, NewsIcon, AdvisorIcon,
  AlertsIcon, DiscoverIcon, SettingsIcon,
} from './icons/NavIcons';

const LINKS = [
  { id: 'portfolio', label: 'Portfolio',  Icon: PortfolioIcon },
  { id: 'news',      label: 'Intel Feed', Icon: NewsIcon },
  { id: 'advisor',   label: 'AI Advisor', Icon: AdvisorIcon },
  { id: 'alerts',    label: 'Alerts',     Icon: AlertsIcon },
  { id: 'discover',  label: 'Discover',   Icon: DiscoverIcon, badge: 'HRHR' },
  { id: 'settings',  label: 'Settings',   Icon: SettingsIcon },
];

export default function Nav({ page, setPage }) {
  const [open, setOpen] = useState(false);

  const linkCls = (active) =>
    `flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 relative tracking-wide
    ${active
      ? 'border-l-2 border-[#00d4ff] pl-[10px] text-[#00d4ff] bg-[rgba(0,212,255,0.06)]'
      : 'border-l-2 border-transparent text-[rgba(0,212,255,0.45)] hover:text-[#00d4ff] hover:bg-[rgba(0,212,255,0.04)]'
    }`;

  return (
    <>
      {/* Mobile top bar */}
      <div className="sm:hidden flex items-center justify-between border-b border-[rgba(0,212,255,0.15)] bg-[#020810] px-4 py-3">
        <span className="hud-title text-base">S.M.I.</span>
        <button
          onClick={() => setOpen(o => !o)}
          className="text-[rgba(0,212,255,0.5)] hover:text-[#00d4ff] text-lg w-7 h-7 flex items-center justify-center transition-colors"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden bg-[#020810] border-b border-[rgba(0,212,255,0.15)] px-2 pb-2">
          {LINKS.map(({ id, label, Icon, badge }) => (
            <button
              key={id}
              onClick={() => { setPage(id); setOpen(false); }}
              className={linkCls(page === id)}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {badge && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-[#ffaa00]/10 text-[#ffaa00] border border-[#ffaa00]/30">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden sm:flex flex-col w-56 min-h-screen bg-[#020810] border-r border-[rgba(0,212,255,0.12)] p-4 shrink-0">
        {/* Logo / brand */}
        <div className="mb-8 px-3 pt-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="arc-reactor w-8 h-8 shrink-0">
              <div className="w-3.5 h-3.5 rounded-full bg-[rgba(0,212,255,0.3)] border border-[rgba(0,212,255,0.8)]" />
            </div>
            <span className="hud-title text-sm leading-tight">S.M.I.</span>
          </div>
          <p className="text-[9px] text-[rgba(0,212,255,0.3)] tracking-[0.2em] uppercase pl-11">
            Stark Market Intelligence
          </p>
        </div>

        <hr className="hud-divider mb-4" />

        <nav className="flex flex-col gap-0.5 flex-1">
          {LINKS.map(({ id, label, Icon, badge }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={linkCls(page === id)}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {badge && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-[#ffaa00]/10 text-[#ffaa00] border border-[#ffaa00]/30">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <hr className="hud-divider mt-4" />
        <p className="text-[9px] text-[rgba(0,212,255,0.2)] tracking-widest uppercase text-center mt-3">
          JARVIS v2.0
        </p>
      </aside>
    </>
  );
}
