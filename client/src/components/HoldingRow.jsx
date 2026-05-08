import { useState } from 'react';
import Sparkline from './Sparkline';

function pnl(holding, price) {
  if (!price || !holding.cost_basis) return null;
  const current = price * holding.shares;
  const basis = holding.cost_basis * holding.shares;
  return { value: current - basis, pct: ((current - basis) / basis) * 100 };
}

export default function HoldingRow({ holding, price, candles, fundamentals, onRemove }) {
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

  return (
    <tr className="table-row-hover border-t border-slate-200 dark:border-[#1e2d45] transition-colors">
      {/* Ticker + logo */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {logoUrl
            ? <img
                src={logoUrl}
                alt=""
                className="w-5 h-5 rounded object-contain bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            : null}
          <span
            className={`w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0 ${logoUrl ? 'hidden' : 'flex'}`}
          >
            {initials}
          </span>
          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{holding.ticker}</span>
        </div>
      </td>

      {/* Price */}
      <td className="py-3 px-4 text-right">
        {price?.price != null
          ? <span className="font-medium text-slate-800 dark:text-slate-200">${price.price.toFixed(2)}</span>
          : <span className="text-slate-400">—</span>}
      </td>

      {/* Today % */}
      <td className="py-3 px-4 text-right">
        {changePct != null
          ? <span className={changePct >= 0 ? 'text-bull font-medium' : 'text-bear font-medium'}>
              {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
            </span>
          : <span className="text-slate-400">—</span>}
      </td>

      {/* Sparkline */}
      <td className="py-3 px-4">
        <Sparkline closes={closes} positive={positive} ticker={holding.ticker} />
      </td>

      {/* Shares */}
      <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">{holding.shares}</td>

      {/* Avg cost */}
      <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
        ${Number(holding.cost_basis).toFixed(2)}
      </td>

      {/* P&L */}
      <td className="py-3 px-4 text-right">
        {gain != null
          ? <span className={gain.value >= 0 ? 'text-bull font-medium' : 'text-bear font-medium'}>
              {gain.value >= 0 ? '+' : ''}${gain.value.toFixed(2)}
              <span className="text-xs ml-1 opacity-70">({gain.pct.toFixed(1)}%)</span>
            </span>
          : <span className="text-slate-400">—</span>}
      </td>

      {/* Analyst upside */}
      <td className="py-3 px-4 text-right">
        {upside != null
          ? <span className={upside >= 0 ? 'text-bull text-xs font-medium' : 'text-bear text-xs font-medium'}>
              {upside >= 0 ? '+' : ''}{upside.toFixed(1)}%
              <span className="ml-0.5 opacity-60">{upside >= 0 ? '↑' : '↓'}</span>
            </span>
          : <span className="text-slate-400 text-xs">—</span>}
      </td>

      {/* Remove */}
      <td className="py-3 px-4 text-right">
        {confirming
          ? <span className="flex gap-2 justify-end">
              <button onClick={() => onRemove(holding.ticker)} className="text-xs text-bear hover:text-red-300 underline">Confirm</button>
              <button onClick={() => setConfirming(false)} className="text-xs text-slate-500 hover:text-slate-300">Cancel</button>
            </span>
          : <button
              onClick={() => setConfirming(true)}
              className="text-slate-400 hover:text-bear transition-colors text-sm"
              title="Remove holding"
            >✕</button>}
      </td>
    </tr>
  );
}
