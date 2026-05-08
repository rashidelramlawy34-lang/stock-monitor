import { useMarket } from '../hooks/useMarket';
import { useEffect, useState } from 'react';

const INDICES = [
  { key: 'SPY', label: 'S&P 500' },
  { key: 'QQQ', label: 'Nasdaq' },
  { key: 'DIA', label: 'Dow' },
];

function isMarketOpen() {
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = et.getDay();
  const h = et.getHours();
  const m = et.getMinutes();
  const mins = h * 60 + m;
  return day >= 1 && day <= 5 && mins >= 570 && mins < 960; // 9:30–16:00
}

export default function MarketBar() {
  const { indices } = useMarket();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const open = isMarketOpen();
  const etTime = time.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="border-b border-slate-200 dark:border-[#1e2d45] bg-white dark:bg-[#0a0e1a] px-4 py-1.5 flex items-center gap-6 text-xs overflow-x-auto">
      {INDICES.map(({ key, label }) => {
        const d = indices[key];
        if (!d) return (
          <span key={key} className="text-slate-400 dark:text-slate-600 shrink-0">{label} —</span>
        );
        const pos = d.change_pct >= 0;
        return (
          <span key={key} className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-500 dark:text-slate-400 font-medium">{label}</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              ${d.price?.toFixed(2)}
            </span>
            <span className={pos ? 'text-bull font-medium' : 'text-bear font-medium'}>
              {pos ? '+' : ''}{d.change_pct?.toFixed(2)}%
            </span>
          </span>
        );
      })}

      <span className="ml-auto flex items-center gap-2 shrink-0">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-medium ${
          open
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
          {open ? 'Market Open' : 'Market Closed'}
        </span>
        <span className="text-slate-400 dark:text-slate-500 font-mono">{etTime} ET</span>
      </span>
    </div>
  );
}
