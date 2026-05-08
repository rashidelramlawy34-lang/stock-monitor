import { useState } from 'react';
import Sparkline from './Sparkline';

function pnl(holding, price) {
  if (!price || !holding.cost_basis) return null;
  const current = price * holding.shares;
  const basis = holding.cost_basis * holding.shares;
  return { value: current - basis, pct: ((current - basis) / basis) * 100 };
}

export default function HoldingRow({ holding, price, candles, fundamentals, shortInterest, latestUpgrade, onRemove }) {
  const [confirming, setConfirming] = useState(false);
  const gain = pnl(holding, price?.price);
  const changePct = price?.change_pct;
  const closes = candles?.closes ?? [];
  const positive = (changePct ?? 0) >= 0;
  const targetMean = fundamentals?.target_mean;
  const upside = targetMean && price?.price
    ? ((targetMean - price.price) / price.price) * 100
    : null;
  const logoUrl = fundamentals?.logo_url;
  const initials = holding.ticker.slice(0, 2).toUpperCase();
  const shortPct = shortInterest?.shortPercent ?? shortInterest?.shortRatio ?? null;

  return (
    <tr className="table-row-hover">
      {/* Ticker + logo */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {logoUrl
            ? <img
                src={logoUrl}
                alt=""
                className="w-5 h-5 rounded object-contain bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.15)]"
                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            : null}
          <span
            className={`w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center bg-[rgba(0,212,255,0.08)] text-[rgba(0,212,255,0.6)] shrink-0 border border-[rgba(0,212,255,0.15)] ${logoUrl ? 'hidden' : 'flex'}`}
          >
            {initials}
          </span>
          <span className="font-mono font-semibold text-[#a8d8ea] tracking-wide">{holding.ticker}</span>
        </div>
      </td>

      {/* Price */}
      <td className="py-3 px-4 text-right">
        {price?.price != null
          ? <span className="font-mono font-medium text-[#a8d8ea]">${price.price.toFixed(2)}</span>
          : <span className="text-muted">—</span>}
      </td>

      {/* Today % */}
      <td className="py-3 px-4 text-right">
        {changePct != null
          ? <span className={changePct >= 0 ? 'text-bull font-bold' : 'text-bear font-bold'}>
              {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
            </span>
          : <span className="text-muted">—</span>}
      </td>

      {/* Sparkline */}
      <td className="py-3 px-4">
        <Sparkline closes={closes} positive={positive} ticker={holding.ticker} />
      </td>

      {/* Shares */}
      <td className="py-3 px-4 text-right text-[rgba(0,212,255,0.5)] font-mono">{holding.shares}</td>

      {/* Avg cost */}
      <td className="py-3 px-4 text-right text-[rgba(0,212,255,0.5)] font-mono">
        ${Number(holding.cost_basis).toFixed(2)}
      </td>

      {/* P&L */}
      <td className="py-3 px-4 text-right">
        {gain != null
          ? <span className={gain.value >= 0 ? 'text-bull font-bold' : 'text-bear font-bold'}>
              {gain.value >= 0 ? '+' : ''}${gain.value.toFixed(2)}
              <span className="text-xs ml-1 opacity-70">({gain.pct.toFixed(1)}%)</span>
            </span>
          : <span className="text-muted">—</span>}
      </td>

      {/* Analyst upside */}
      <td className="py-3 px-4 text-right">
        {upside != null
          ? <span className={upside >= 0 ? 'text-bull text-xs font-bold' : 'text-bear text-xs font-bold'}>
              {upside >= 0 ? '+' : ''}{upside.toFixed(1)}%
              <span className="ml-0.5 opacity-70">{upside >= 0 ? '↑' : '↓'}</span>
            </span>
          : <span className="text-muted text-xs">—</span>}
        {latestUpgrade && (
          <span className={`ml-1 text-[9px] font-bold ${latestUpgrade.toGrade > latestUpgrade.fromGrade ? 'text-[#00e676]' : 'text-bear'}`} title={`${latestUpgrade.fromGrade} → ${latestUpgrade.toGrade}`}>
            {latestUpgrade.toGrade > latestUpgrade.fromGrade ? '▲' : '▼'}
          </span>
        )}
      </td>

      {/* Short interest */}
      <td className="py-3 px-4 text-right">
        {shortPct != null
          ? <span className={`text-xs font-bold ${shortPct > 20 ? 'text-bear' : shortPct > 10 ? 'text-warn' : 'text-muted'}`}>
              {(shortPct * 100 > 1 ? shortPct : shortPct * 100).toFixed(1)}%
            </span>
          : <span className="text-muted text-xs">—</span>}
      </td>

      {/* Remove */}
      <td className="py-3 px-4 text-right">
        {confirming
          ? <span className="flex gap-2 justify-end">
              <button onClick={() => onRemove(holding.ticker)} className="text-xs text-bear hover:text-[#ff3355] underline">Confirm</button>
              <button onClick={() => setConfirming(false)} className="text-xs text-muted hover:text-[#a8d8ea]">Cancel</button>
            </span>
          : <button
              onClick={() => setConfirming(true)}
              className="text-muted hover:text-bear transition-colors text-sm"
              title="Remove holding"
            >✕</button>}
      </td>
    </tr>
  );
}
