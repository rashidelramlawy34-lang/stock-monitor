import { useState } from 'react';
import { useDarkMode } from '../hooks/useDarkMode';
import {
  PortfolioIcon, NewsIcon, AdvisorIcon,
  AlertsIcon, DiscoverIcon, SettingsIcon, SunIcon, MoonIcon,
} from './icons/NavIcons';

const LINKS = [
  { id: 'portfolio', label: 'Portfolio',  Icon: PortfolioIcon },
  { id: 'news',      label: 'News',       Icon: NewsIcon },
  { id: 'advisor',   label: 'AI Advisor', Icon: AdvisorIcon },
  { id: 'alerts',    label: 'Alerts',     Icon: AlertsIcon },
  { id: 'discover',  label: 'Discover',   Icon: DiscoverIcon, badge: 'HRHR' },
  { id: 'settings',  label: 'Settings',   Icon: SettingsIcon },
];

export default function Nav({ page, setPage }) {
  const [open, setOpen] = useState(false);
  const { dark, toggle } = useDarkMode();

  const linkCls = (active) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative
    ${active
      ? 'bg-accent/10 dark:bg-accent/15 text-accent border-l-2 border-accent pl-[10px]'
      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/5'
    }`;

  return (
    <>
      {/* Mobile top bar */}
      <div className="sm:hidden flex items-center justify-between border-b border-slate-200 dark:border-[#1e2d45] bg-white dark:bg-[#0a0e1a] px-4 py-3">
        <span className="font-bold text-accent tracking-tight">StockMonitor</span>
        <div className="flex items-center gap-2">
          <button onClick={toggle} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            {dark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
          </button>
          <button onClick={() => setOpen(o => !o)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-lg w-7 h-7 flex items-center justify-center">
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden bg-white dark:bg-[#0a0e1a] border-b border-slate-200 dark:border-[#1e2d45] px-2 pb-2">
          {LINKS.map(({ id, label, Icon, badge }) => (
            <button
              key={id}
              onClick={() => { setPage(id); setOpen(false); }}
              className={linkCls(page === id)}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {badge && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden sm:flex flex-col w-56 min-h-screen bg-white dark:bg-[#0a0e1a] border-r border-slate-200 dark:border-[#1e2d45] p-4 shrink-0">
        <div className="mb-8 px-1">
          <span className="font-bold text-lg text-accent tracking-tight">StockMonitor</span>
        </div>
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
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <button
          onClick={toggle}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors mt-2"
        >
          {dark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
          {dark ? 'Light mode' : 'Dark mode'}
        </button>
      </aside>
    </>
  );
}
