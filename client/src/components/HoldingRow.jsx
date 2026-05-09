import { useState } from 'react';
import Sparkline from './Sparkline';
import TechnicalsChart from './TechnicalsChart';

function pnl(holding, price) {
  if (!price || !holding.cost_basis) return null;
  const current = price * holding.shares;
  const basis = holding.cost_basis * holding.shares;
  return { value: current - basis, pct: ((current - basis) / basis) * 100 };
}

export default function HoldingRow({
  holding, price, candles, fundamentals, shortInterest, latestUpgrade,
  hasAlert, hasTriggeredAlert, expanded, onToggleExpand, onRemove,
}) {
  const [confirming, setConfirming] = useState(false);
  const gain = pnl(holding, price?.price);
  const changePct = price?.change_pct;
  const closes = candles?.closes ?? [];
  const timestamps = candles?.timestamps ?? [];
  const positive = (changePct ?? 0) >= 0;
  const targetMean = fundamentals?.target_mean;
  const upside = targetMean && price?.price
    ? ((targetMean - price.price) / price.price) * 100
    : null;
  const logoUrl = fundamentals?.logo_url;
  const initials = holding.ticker.slice(0, 2).toUpperCase();
  const shortPct = shortInterest?.shortPercent ?? shortInterest?.shortRatio ?? null;

  return (
    <>
      <tr
        className="table-row-hover cursor-pointer"
        style={{ background: expanded ? 'var(--surface-2)' : undefined }}
        onClick={onToggleExpand}
      >
        {/* Ticker + logo + alert dot */}
        <td className="py-[14px] px-5">
          <div className="flex items-center gap-2">
            {(hasAlert || hasTriggeredAlert) && (
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${hasTriggeredAlert ? 'bg-bear' : 'bg-warn'}`}
                title={hasTriggeredAlert ? 'Alert triggered!' : 'Active alert watching'}
              />
            )}
            {logoUrl
              ? <img
                  src={logoUrl}
                  alt=""
                  className="w-5 h-5 rounded object-contain bg-[var(--surface-2)] border border-[var(--border)]"
                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              : null}
            <span
              className={`w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center bg-[var(--surface-2)] text-[var(--text-2)] shrink-0 border border-[var(--border)] ${logoUrl ? 'hidden' : 'flex'}`}
            >
              {initials}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text)' }}>{holding.ticker}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ marginLeft: 4, color: expanded ? 'var(--accent)' : 'var(--text-muted)', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}><path d="M19 9l-7 7-7-7" /></svg>
          </div>
        </td>

        {/* Price */}
        <td className="py-[14px] px-5 text-right">
          {price?.price != null
            ? <span className="font-mono font-medium text-[var(--text-2)]">${price.price.toFixed(2)}</span>
            : <span className="text-muted">—</span>}
        </td>

        {/* Today % */}
        <td className="py-[14px] px-5 text-right">
          {changePct != null
            ? <span className={changePct >= 0 ? 'text-bull font-bold' : 'text-bear font-bold'}>
                {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
              </span>
            : <span className="text-muted">—</span>}
        </td>

        {/* Sparkline */}
        <td className="py-[14px] px-5">
          <Sparkline closes={closes} positive={positive} ticker={holding.ticker} />
        </td>

        {/* Shares */}
        <td className="py-[14px] px-5 text-right text-[var(--text-2)] font-mono">{holding.shares}</td>

        {/* Avg cost */}
        <td className="py-[14px] px-5 text-right text-[var(--text-2)] font-mono">
          ${Number(holding.cost_basis).toFixed(2)}
        </td>

        {/* P&L */}
        <td className="py-[14px] px-5 text-right">
          {gain != null
            ? <span className={gain.value >= 0 ? 'text-bull font-bold' : 'text-bear font-bold'}>
                {gain.value >= 0 ? '+' : ''}${gain.value.toFixed(2)}
                <span className="text-xs ml-1 opacity-70">({gain.pct.toFixed(1)}%)</span>
              </span>
            : <span className="text-muted">—</span>}
        </td>

        {/* Analyst upside */}
        <td className="py-[14px] px-5 text-right">
          {upside != null
            ? <span className={upside >= 0 ? 'text-bull text-xs font-bold' : 'text-bear text-xs font-bold'}>
                {upside >= 0 ? '+' : ''}{upside.toFixed(1)}%
                <span className="ml-0.5 opacity-70">{upside >= 0 ? '↑' : '↓'}</span>
              </span>
            : <span className="text-muted text-xs">—</span>}
          {latestUpgrade && (
            <span className={`ml-1 text-[9px] font-bold ${latestUpgrade.toGrade > latestUpgrade.fromGrade ? 'text-[var(--gain)]' : 'text-bear'}`} title={`${latestUpgrade.fromGrade} → ${latestUpgrade.toGrade}`}>
              {latestUpgrade.toGrade > latestUpgrade.fromGrade ? '▲' : '▼'}
            </span>
          )}
        </td>

        {/* Short interest */}
        <td className="py-[14px] px-5 text-right">
          {shortPct != null
            ? <span className={`text-xs font-bold ${shortPct > 20 ? 'text-bear' : shortPct > 10 ? 'text-warn' : 'text-muted'}`}>
                {(shortPct * 100 > 1 ? shortPct : shortPct * 100).toFixed(1)}%
              </span>
            : <span className="text-muted text-xs">—</span>}
        </td>

        {/* Remove */}
        <td className="py-[14px] px-5 text-right" onClick={e => e.stopPropagation()}>
          {confirming
            ? <span className="flex gap-2 justify-end">
                <button onClick={() => onRemove(holding.ticker)} className="text-xs text-bear hover:text-[var(--loss)] underline">Confirm</button>
                <button onClick={() => setConfirming(false)} className="text-xs text-muted hover:text-[var(--text-2)]">Cancel</button>
              </span>
            : <button
                onClick={() => setConfirming(true)}
                className="text-muted hover:text-bear transition-colors text-sm"
                title="Remove holding"
              >✕</button>}
        </td>
      </tr>

      {/* Expanded technicals */}
      {expanded && closes.length >= 30 && (
        <tr>
          <td colSpan={10} style={{ background: 'var(--surface-1)', padding: 0 }}>
            <div className="h-detail">
              <TechnicalsChart closes={closes} timestamps={timestamps} ticker={holding.ticker} />
            </div>
          </td>
        </tr>
      )}
      {expanded && closes.length < 30 && (
        <tr>
          <td colSpan={10} style={{ background: 'var(--surface-1)', padding: '10px 18px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Not enough candle data to show technicals (need at least 30 days).
            </p>
          </td>
        </tr>
      )}
    </>
  );
}
