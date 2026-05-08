import { useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, Cell, ResponsiveContainer,
} from 'recharts';
import { usePortfolio } from '../hooks/usePortfolio.js';
import { usePrices } from '../hooks/usePrices.js';
import { useFundamentals } from '../hooks/useFundamentals.js';
import { useCandles } from '../hooks/useCandles.js';
import { useMarketData } from '../hooks/useMarketData.js';
import { usePortfolios } from '../hooks/usePortfolios.js';
import { useAlerts } from '../hooks/useAlerts.js';
import AddHoldingForm from '../components/AddHoldingForm.jsx';
import HoldingRow from '../components/HoldingRow.jsx';
import SectorChart from '../components/SectorChart.jsx';
import EarningsCalendar from '../components/EarningsCalendar.jsx';
import PortfolioChart from '../components/PortfolioChart.jsx';
import BenchmarkChart from '../components/BenchmarkChart.jsx';
import CorrelationMatrix from '../components/CorrelationMatrix.jsx';
import DividendPanel from '../components/DividendPanel.jsx';
import RebalancePanel from '../components/RebalancePanel.jsx';
import PortfolioSwitcher from '../components/PortfolioSwitcher.jsx';

function totalValue(holdings, prices) {
  return holdings.reduce((sum, h) => {
    const p = prices[h.ticker]?.price;
    return sum + (p != null ? p * h.shares : 0);
  }, 0);
}
function totalCost(holdings) {
  return holdings.reduce((sum, h) => sum + h.cost_basis * h.shares, 0);
}
function dailyPnL(holdings, prices) {
  let gain = 0;
  for (const h of holdings) {
    const p = prices[h.ticker];
    if (!p?.price || !p?.change_pct) continue;
    const mv = p.price * h.shares;
    gain += mv * (p.change_pct / 100);
  }
  return gain;
}

function portfolioBeta(holdings, prices, fundamentals) {
  let weightedBeta = 0, totalVal = 0;
  for (const h of holdings) {
    const p = prices[h.ticker]?.price;
    const beta = fundamentals[h.ticker]?.beta;
    if (!p || !beta) continue;
    const val = p * h.shares;
    weightedBeta += beta * val;
    totalVal += val;
  }
  return totalVal > 0 ? weightedBeta / totalVal : null;
}

function exportCSV(holdings, prices, fundamentals) {
  const headers = ['Ticker', 'Shares', 'Cost/Share', 'Current Price', 'Market Value', 'P&L', 'P&L %', 'Beta', 'Analyst Target', 'Upside %'];
  const rows = holdings.map(h => {
    const p = prices[h.ticker]?.price;
    const f = fundamentals[h.ticker];
    const mv = p ? p * h.shares : '';
    const pl = p ? (p - h.cost_basis) * h.shares : '';
    const plPct = p ? ((p - h.cost_basis) / h.cost_basis * 100).toFixed(2) : '';
    const upside = f?.target_mean && p ? ((f.target_mean - p) / p * 100).toFixed(2) : '';
    return [h.ticker, h.shares, h.cost_basis, p?.toFixed(2) ?? '', mv ? mv.toFixed(2) : '', pl ? pl.toFixed(2) : '', plPct, f?.beta ?? '', f?.target_mean ?? '', upside];
  });
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `portfolio_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

function StatCard({ label, value, sub, color, sparkData, sparkType }) {
  const strokeColor = color?.includes('bull') ? '#00e676' : color?.includes('bear') ? '#ff3355' : '#00d4ff';
  const gradId = `sg-${label.replace(/\s+/g, '')}`;
  return (
    <div className="card p-5 border-l-2 border-l-[rgba(0,212,255,0.3)]">
      <p className="hud-label mb-3">{label}</p>
      <p className={`text-3xl font-bold font-mono tracking-tight ${color || 'text-[#a8d8ea]'}`}>{value}</p>
      {sub && <p className="text-xs text-muted mt-1.5">{sub}</p>}
      {sparkData?.length > 1 && (
        <div className="mt-3 -mx-1">
          <ResponsiveContainer width="100%" height={44}>
            {sparkType === 'bar' ? (
              <BarChart data={sparkData} margin={{ top: 2, right: 2, bottom: 0, left: 2 }} barCategoryGap="18%">
                <Bar dataKey="v" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                  {sparkData.map((d, i) => (
                    <Cell key={i} fill={d.v >= 0 ? 'rgba(0,230,118,0.55)' : 'rgba(255,51,85,0.55)'} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <AreaChart data={sparkData} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={strokeColor} strokeWidth={1.5}
                  fill={`url(#${gradId})`} dot={false} isAnimationActive={false} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

const SORT_COLS = {
  ticker: (h, p) => h.ticker,
  price: (h, p) => p?.price ?? -Infinity,
  today: (h, p) => p?.change_pct ?? -Infinity,
  pl: (h, p, _f, costBasis) => p?.price ? (p.price - h.cost_basis) * h.shares : -Infinity,
  upside: (h, p, f) => (f?.target_mean && p?.price) ? (f.target_mean - p.price) / p.price : -Infinity,
};

export default function Dashboard() {
  const { holdings, loading, error, addHolding, removeHolding } = usePortfolio();
  const { prices, lastUpdated, refresh: refreshPrices } = usePrices(holdings.map(h => h.ticker));
  const { fundamentals } = useFundamentals(holdings.map(h => h.ticker));
  const { candles } = useCandles(holdings.map(h => h.ticker));
  const { dividends, shortInterest, upgrades } = useMarketData(holdings.map(h => h.ticker));
  const portfolios = usePortfolios();
  const { alerts } = useAlerts();

  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('ticker');
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedTicker, setExpandedTicker] = useState(null);

  const alertTickers = useMemo(() => new Set(alerts.filter(a => !a.triggered).map(a => a.ticker)), [alerts]);
  const triggeredTickers = useMemo(() => new Set(alerts.filter(a => a.triggered).map(a => a.ticker)), [alerts]);

  const value = totalValue(holdings, prices);
  const cost = totalCost(holdings);
  const gain = value - cost;
  const gainPct = cost > 0 ? (gain / cost) * 100 : 0;
  const todayGain = dailyPnL(holdings, prices);
  const beta = portfolioBeta(holdings, prices, fundamentals);
  const betaColor = beta == null ? '' : beta < 1 ? 'text-bull' : beta < 1.5 ? 'text-warn' : 'text-bear';

  const todayBars = useMemo(() => {
    return holdings
      .map(h => {
        const p = prices[h.ticker];
        if (!p?.price || p.change_pct == null) return null;
        return { v: +(p.change_pct * p.price * h.shares / 100).toFixed(2) };
      })
      .filter(Boolean);
  }, [holdings, prices]);

  const portfolioTrend = useMemo(() => {
    const holdingCandles = holdings
      .map(h => ({ h, c: candles?.[h.ticker] }))
      .filter(({ c }) => c?.closes?.length > 1);
    if (holdingCandles.length === 0) return [];
    const len = Math.min(...holdingCandles.map(({ c }) => c.closes.length));
    return Array.from({ length: len }, (_, i) => ({
      v: holdingCandles.reduce((sum, { h, c }) => sum + c.closes[i] * h.shares, 0),
    }));
  }, [holdings, candles]);

  const filteredSorted = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = q
      ? holdings.filter(h => h.ticker.toLowerCase().includes(q) || (h.name ?? '').toLowerCase().includes(q))
      : holdings;

    const fn = SORT_COLS[sortCol];
    return [...filtered].sort((a, b) => {
      const va = fn(a, prices[a.ticker], fundamentals[a.ticker]);
      const vb = fn(b, prices[b.ticker], fundamentals[b.ticker]);
      if (typeof va === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortAsc ? va - vb : vb - va;
    });
  }, [holdings, prices, fundamentals, search, sortCol, sortAsc]);

  const onSortCol = (col) => {
    if (sortCol === col) setSortAsc(a => !a);
    else { setSortCol(col); setSortAsc(true); }
  };

  const SortTh = ({ col, label, right }) => (
    <th
      className={`hud-label ${right ? 'text-right' : 'text-left'} py-2.5 px-4 font-normal cursor-pointer select-none hover:text-arc transition-colors`}
      onClick={() => onSortCol(col)}
    >
      {label}{sortCol === col ? (sortAsc ? ' ↑' : ' ↓') : ''}
    </th>
  );

  return (
    <div className="p-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <header className="mb-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <h1 className="hud-title text-xl">Portfolio</h1>
            <p className="text-muted text-xs mt-0.5">
              {lastUpdated ? <>Updated {lastUpdated.toLocaleTimeString()}</> : 'Fetching prices…'}
            </p>
          </div>
          <PortfolioSwitcher {...portfolios} />
        </div>
        {holdings.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={() => exportCSV(holdings, prices, fundamentals)} className="btn-outline flex items-center gap-1.5">
              ↓ CSV
            </button>
            <button onClick={refreshPrices} className="btn-outline flex items-center gap-1.5">
              ↻ Refresh
            </button>
          </div>
        )}
      </header>

      {/* Main layout: chart (left, dominant) + stat cards (right column) */}
      <div className="flex gap-5 mb-5">
        {/* Left: Chart */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {holdings.length > 0 && <PortfolioChart />}
          {holdings.length > 0 && <BenchmarkChart holdings={holdings} candles={candles} />}
        </div>

        {/* Right: Stat cards stacked */}
        <div className="flex flex-col gap-4 w-64 shrink-0">
          <StatCard
            label="Portfolio Value"
            value={cost > 0 ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '—'}
            sub={`${holdings.length} holding${holdings.length !== 1 ? 's' : ''}`}
            sparkData={portfolioTrend}
            sparkType="area"
          />
          <StatCard
            label="Today's P&L"
            value={cost > 0 && todayGain !== 0 ? `${todayGain >= 0 ? '+' : ''}$${Math.abs(todayGain).toFixed(0)}` : '—'}
            sub={cost > 0 && todayGain !== 0 ? 'vs yesterday close' : undefined}
            color={todayGain >= 0 ? 'text-bull' : 'text-bear'}
            sparkData={todayBars}
            sparkType="bar"
          />
          <StatCard
            label="Total P&L"
            value={cost > 0 ? `${gain >= 0 ? '+' : ''}$${Math.abs(gain).toFixed(0)}` : '—'}
            sub={cost > 0 ? `${gainPct >= 0 ? '+' : ''}${gainPct.toFixed(2)}%` : undefined}
            color={gain >= 0 ? 'text-bull' : 'text-bear'}
            sparkData={portfolioTrend}
            sparkType="area"
          />
          <StatCard
            label="Portfolio Beta"
            value={beta != null ? beta.toFixed(2) : '—'}
            sub={beta != null ? (beta < 1 ? 'Low volatility' : beta < 1.5 ? 'Moderate risk' : 'High volatility') : undefined}
            color={betaColor}
          />
          {holdings.length > 1 && (
            <div className="card p-5 border-l-2 border-l-[rgba(0,212,255,0.3)]">
              <p className="hud-label mb-3">Total Cost</p>
              <p className="text-3xl font-bold font-mono tracking-tight text-[#a8d8ea]">
                ${cost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-muted mt-1.5">invested capital</p>
            </div>
          )}
        </div>
      </div>

      {/* Holdings table — full width */}
      <section className="card mb-5">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,212,255,0.08)] gap-3 flex-wrap">
          <h2 className="hud-label">Holdings</h2>
          {holdings.length > 0 && (
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by ticker…"
              className="input text-xs py-1 w-36"
            />
          )}
        </div>

        {loading && <p className="px-5 py-6 text-muted text-sm">Loading…</p>}
        {error && <p className="px-5 py-6 text-bear text-sm">Error: {error}</p>}
        {!loading && holdings.length === 0 && (
          <p className="px-5 py-6 text-muted text-sm">No holdings yet. Add your first stock below.</p>
        )}

        {!loading && holdings.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(0,212,255,0.06)]">
                  <SortTh col="ticker" label="Ticker" />
                  <SortTh col="price" label="Price" right />
                  <SortTh col="today" label="Today" right />
                  <th className="hud-label py-3 px-4 font-normal text-left">7D</th>
                  <th className="hud-label text-right py-3 px-4 font-normal">Shares</th>
                  <th className="hud-label text-right py-3 px-4 font-normal">Cost</th>
                  <SortTh col="pl" label="P&L" right />
                  <SortTh col="upside" label="Upside" right />
                  <th className="hud-label text-right py-3 px-4 font-normal">Short%</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {filteredSorted.map(h => (
                  <HoldingRow
                    key={h.ticker}
                    holding={h}
                    price={prices[h.ticker]}
                    candles={candles[h.ticker]}
                    fundamentals={fundamentals[h.ticker]}
                    shortInterest={shortInterest[h.ticker]}
                    latestUpgrade={(upgrades[h.ticker] ?? [])[0]}
                    hasAlert={alertTickers.has(h.ticker)}
                    hasTriggeredAlert={triggeredTickers.has(h.ticker)}
                    expanded={expandedTicker === h.ticker}
                    onToggleExpand={() => setExpandedTicker(t => t === h.ticker ? null : h.ticker)}
                    onRemove={removeHolding}
                  />
                ))}
              </tbody>
            </table>
            {filteredSorted.length === 0 && search && (
              <p className="px-5 py-6 text-muted text-sm text-center">No holdings match "{search}"</p>
            )}
          </div>
        )}

        <div className="px-5 py-4 border-t border-[rgba(0,212,255,0.08)]">
          <AddHoldingForm onAdd={addHolding} />
        </div>
      </section>

      {/* Bottom panels */}
      {holdings.length > 1 && <CorrelationMatrix holdings={holdings} candles={candles} />}
      {holdings.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <SectorChart holdings={holdings} prices={prices} fundamentals={fundamentals} />
          <EarningsCalendar holdings={holdings} fundamentals={fundamentals} />
        </div>
      )}
      {holdings.length > 0 && (
        <>
          <DividendPanel dividends={dividends} holdings={holdings} prices={prices} />
          <RebalancePanel holdings={holdings} prices={prices} />
        </>
      )}
    </div>
  );
}
