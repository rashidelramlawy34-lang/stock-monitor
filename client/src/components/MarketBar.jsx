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
    <div className="border-b border-[rgba(0,212,255,0.12)] bg-[#020810] px-4 py-1.5 flex items-center gap-6 text-xs overflow-x-auto">
      {INDICES.map(({ key, label }) => {
        const d = indices[key];
        if (!d) return (
          <span key={key} className="text-muted shrink-0 font-hud text-[10px] tracking-widest">{label} —</span>
        );
        const pos = d.change_pct >= 0;
        return (
          <span key={key} className="flex items-center gap-1.5 shrink-0">
            <span className="hud-label text-[9px]">{label}</span>
            <span className="font-mono font-semibold text-[#a8d8ea]">
              ${d.price?.toFixed(2)}
            </span>
            <span className={pos ? 'text-bull font-bold' : 'text-bear font-bold'}>
              {pos ? '+' : ''}{d.change_pct?.toFixed(2)}%
            </span>
          </span>
        );
      })}

      <span className="ml-auto flex items-center gap-3 shrink-0">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm font-bold text-[10px] tracking-widest uppercase border ${
          open
            ? 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/30'
            : 'bg-[rgba(0,212,255,0.05)] text-muted border-[rgba(0,212,255,0.15)]'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-[#00e676] animate-pulse' : 'bg-[rgba(0,212,255,0.3)]'}`} />
          {open ? 'MARKET OPEN' : 'MARKET CLOSED'}
        </span>
        <span className="font-mono text-[rgba(0,212,255,0.5)] text-[11px]">{etTime} ET</span>
      </span>
    </div>
  );
}
