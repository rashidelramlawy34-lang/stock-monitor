import { useMarket } from '../hooks/useMarket';
import { useEffect, useState } from 'react';

const INDICES = [
  { key: 'SPY', label: 'S&P 500' },
  { key: 'QQQ', label: 'NASDAQ' },
  { key: 'DIA', label: 'DOW' },
];

function isMarketOpen() {
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = et.getDay();
  const h = et.getHours();
  const m = et.getMinutes();
  const mins = h * 60 + m;
  return day >= 1 && day <= 5 && mins >= 570 && mins < 960;
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
    hour12: false,
  });

  return (
    <div className="border-b border-[rgba(0,212,255,0.10)] bg-[#010710] px-4 py-1 flex items-center gap-5 text-xs overflow-x-auto">
      {INDICES.map(({ key, label }) => {
        const d = indices[key];
        if (!d) return (
          <span key={key} className="text-muted shrink-0 text-[10px] tracking-widest">{label} —</span>
        );
        const pos = d.change_pct >= 0;
        return (
          <span key={key} className="flex items-center gap-1.5 shrink-0">
            <span className="hud-label text-[9px]">{label}</span>
            <span className="font-mono font-semibold text-[#a8d8ea]">
              ${d.price?.toFixed(2)}
            </span>
            <span className={pos ? 'text-bull font-semibold' : 'text-bear font-semibold'}>
              {pos ? '+' : ''}{d.change_pct?.toFixed(2)}%
            </span>
          </span>
        );
      })}

      <span className="ml-auto flex items-center gap-3 shrink-0">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[10px] tracking-wide uppercase border ${
          open
            ? 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/25'
            : 'bg-[rgba(0,212,255,0.04)] text-muted border-[rgba(0,212,255,0.12)]'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-[#00e676] animate-pulse' : 'bg-[rgba(0,212,255,0.25)]'}`} />
          {open ? 'OPEN' : 'CLOSED'}
        </span>
        <span className="font-mono text-[rgba(0,212,255,0.4)] text-[11px]">{etTime} ET</span>
      </span>
    </div>
  );
}
