import { useState } from 'react';
import { useWatchlist } from '../hooks/useWatchlist.js';

const RISK_COLORS = {
  'Low':       { text: '#00e676', bg: 'rgba(0,230,118,0.1)',  border: 'rgba(0,230,118,0.3)'  },
  'Medium':    { text: '#ffaa00', bg: 'rgba(255,170,0,0.1)', border: 'rgba(255,170,0,0.3)'  },
  'High':      { text: '#ff8c00', bg: 'rgba(255,140,0,0.1)', border: 'rgba(255,140,0,0.3)'  },
  'Very High': { text: '#ff3355', bg: 'rgba(255,51,85,0.1)',  border: 'rgba(255,51,85,0.3)'  },
};

export default function HRHRCard({ candidate }) {
  const {
    ticker, company_name, sector,
    current_price: price, target_mean, upside_pct,
    beta,
    strong_buy = 0, buy_count = 0, hold_count = 0, sell_count = 0, strong_sell = 0,
    logo_url,
    risk_label = 'Medium',
    bull_case,
    entry_zone,
    key_catalyst,
    conviction,
  } = candidate;

  const { watchlist, addTicker, removeTicker } = useWatchlist();
  const isWatched = watchlist.some(w => w.ticker === ticker);
  const [watchBusy, setWatchBusy] = useState(false);

  const toggleWatch = async (e) => {
    e.stopPropagation();
    setWatchBusy(true);
    try {
      if (isWatched) await removeTicker(ticker);
      else await addTicker(ticker);
    } finally {
      setWatchBusy(false);
    }
  };

  const riskColor = RISK_COLORS[risk_label] ?? RISK_COLORS['Medium'];
  const hasUpside = target_mean != null && upside_pct != null && upside_pct !== 0;
  const upPos = (upside_pct ?? 0) >= 0;
  const totalAnalysts = strong_buy + buy_count + hold_count + sell_count + strong_sell;
  const convictionPct = conviction != null ? Math.round(conviction * 100) : null;
  const initials = ticker.slice(0, 2).toUpperCase();

  return (
    <div className="card p-5 flex flex-col gap-3.5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {logo_url
            ? <img
                src={logo_url}
                alt=""
                className="w-7 h-7 rounded object-contain bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.15)] shrink-0"
                onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
              />
            : null}
          <span
            className={`w-7 h-7 rounded text-[10px] font-bold flex items-center justify-center bg-[rgba(0,212,255,0.08)] text-[rgba(0,212,255,0.6)] border border-[rgba(0,212,255,0.15)] shrink-0 ${logo_url ? 'hidden' : 'flex'}`}
          >
            {initials}
          </span>
          <div className="min-w-0">
            <p className="font-mono font-bold text-[#00d4ff] leading-none tracking-widest">{ticker}</p>
            {(company_name || sector) && (
              <p className="text-xs text-muted truncate mt-0.5">
                {company_name}{company_name && sector ? ' · ' : ''}{sector}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full border tracking-wide"
            style={{ color: riskColor.text, background: riskColor.bg, borderColor: riskColor.border }}
          >
            {risk_label.toUpperCase()}
          </span>
          {hasUpside && (
            <span className={`text-sm font-bold font-mono ${upPos ? 'text-bull' : 'text-bear'}`}>
              {upPos ? '+' : ''}{upside_pct.toFixed(1)}% {upPos ? '↑' : '↓'}
            </span>
          )}
        </div>
      </div>

      <hr className="hud-divider" />

      {/* Bull case */}
      {bull_case && (
        <div>
          <p className="hud-label mb-1">Bull Case</p>
          <p className="text-sm text-[#a8d8ea] leading-relaxed">{bull_case}</p>
        </div>
      )}

      {/* Entry + catalyst */}
      <div className="flex flex-wrap gap-2">
        {entry_zone && (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#ffaa00]/10 text-[#ffaa00] border border-[#ffaa00]/30">
            <span className="opacity-60">Entry</span> {entry_zone}
          </span>
        )}
        {key_catalyst && (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[rgba(0,212,255,0.08)] text-[#00d4ff] border border-[rgba(0,212,255,0.2)]">
            ⚡ {key_catalyst}
          </span>
        )}
      </div>

      <hr className="hud-divider" />

      {/* Conviction bar */}
      {convictionPct != null && (
        <div>
          <div className="flex justify-between text-xs text-muted mb-1.5">
            <span className="hud-label text-[9px]">Conviction</span>
            <span className="font-mono text-[#a8d8ea]">{convictionPct}%</span>
          </div>
          <div className="h-1.5 bg-[rgba(0,212,255,0.08)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${convictionPct}%`, background: 'linear-gradient(90deg, #00d4ff, #0066ff)', boxShadow: '0 0 8px rgba(0,212,255,0.4)' }}
            />
          </div>
        </div>
      )}

      {/* Stats row + watchlist button */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        {totalAnalysts > 0 && (
          <span>
            <span className="text-bull font-medium">{strong_buy + buy_count} buy</span>
            {' · '}
            <span>{hold_count} hold</span>
            {(sell_count + strong_sell) > 0 && (
              <><span>{' · '}</span><span className="text-bear">{sell_count + strong_sell} sell</span></>
            )}
          </span>
        )}
        {beta != null && <span>β <span className="font-mono text-[#a8d8ea]">{beta.toFixed(2)}</span></span>}
        {target_mean != null && price != null && (
          <span>Target <span className="font-mono text-[#a8d8ea]">${target_mean.toFixed(0)}</span></span>
        )}
        <button
          onClick={toggleWatch}
          disabled={watchBusy}
          className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full border transition-all ${
            isWatched
              ? 'bg-[rgba(0,212,255,0.1)] text-arc border-[rgba(0,212,255,0.4)]'
              : 'border-[rgba(0,212,255,0.2)] text-muted hover:text-arc hover:border-[rgba(0,212,255,0.4)]'
          }`}
        >
          {isWatched ? '★ Watching' : '☆ Watch'}
        </button>
      </div>
    </div>
  );
}
