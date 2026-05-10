import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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

function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (target == null || !isFinite(target)) { setValue(target); return; }
    const start = performance.now();
    const from = 0;
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (target - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
};

function StatCard({ label, value, sub, pnl, sparkData, sparkType, countUp, formatter }) {
  const hasPnl = pnl !== undefined && pnl !== null;
  const positive = pnl >= 0;
  const valueColor = hasPnl ? (positive ? 'var(--gain)' : 'var(--loss)') : 'var(--text)';
  const strokeColor = hasPnl ? (positive ? 'var(--gain)' : 'var(--loss)') : 'var(--accent)';
  const gradId = `sg-${label.replace(/\s+/g, '')}`;
  const animated = useCountUp(countUp ?? 0);
  const displayValue = (countUp != null && isFinite(countUp))
    ? (formatter ? formatter(animated) : `${Math.round(animated)}`)
    : value;

  // Gradient text for neutral (no P&L context) hero numbers
  const heroNumStyle = hasPnl
    ? { fontSize: 'var(--text-2xl)', fontWeight: 600, color: valueColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1, fontFamily: 'var(--font-mono)' }
    : { fontSize: 'var(--text-2xl)', fontWeight: 600, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1, fontFamily: 'var(--font-mono)',
        background: 'var(--accent-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' };

  return (
    <motion.div variants={cardVariants} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 8 }}>{label}</p>
      <p style={heroNumStyle}>
        {displayValue}
      </p>
      {sub && (
        <p style={{ fontSize: 'var(--text-xs)', color: hasPnl ? valueColor : 'var(--text-2)', marginTop: 4 }}>{sub}</p>
      )}
      {sparkData?.length > 1 && (
        <div style={{ marginTop: 10, marginLeft: -4, marginRight: -4, flex: 1, minHeight: 32 }}>
          <ResponsiveContainer width="100%" height={32}>
            {sparkType === 'bar' ? (
              <BarChart data={sparkData} margin={{ top: 0, right: 4, bottom: 0, left: 4 }} barCategoryGap="18%">
                <Bar dataKey="v" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                  {sparkData.map((d, i) => (
                    <Cell key={i} fill={d.v >= 0 ? 'rgba(74,222,128,0.55)' : 'rgba(248,113,113,0.55)'} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <AreaChart data={sparkData} margin={{ top: 0, right: 4, bottom: 0, left: 4 }}>
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
    </motion.div>
  );
}

const SORT_COLS = {
  ticker: (h) => h.ticker,
  price: (h, p) => p?.price ?? -Infinity,
  today: (h, p) => p?.change_pct ?? -Infinity,
  pl: (h, p) => p?.price ? (p.price - h.cost_basis) * h.shares : -Infinity,
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
  const [showAddForm, setShowAddForm] = useState(false);

  const alertTickers = useMemo(() => new Set(alerts.filter(a => !a.triggered).map(a => a.ticker)), [alerts]);
  const triggeredTickers = useMemo(() => new Set(alerts.filter(a => a.triggered).map(a => a.ticker)), [alerts]);

  const value = totalValue(holdings, prices);
  const cost = totalCost(holdings);
  const gain = value - cost;
  const gainPct = cost > 0 ? (gain / cost) * 100 : 0;
  const todayGain = dailyPnL(holdings, prices);
  const beta = portfolioBeta(holdings, prices, fundamentals);

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

  const thStyle = (right) => ({
    fontSize: 11, color: 'var(--text-muted)', padding: '10px 20px',
    fontWeight: 400, textAlign: right ? 'right' : 'left',
    cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
  });

  const SortTh = ({ col, label, right }) => (
    <th style={thStyle(right)} onClick={() => onSortCol(col)}>
      {label}{sortCol === col ? (sortAsc ? ' ↑' : ' ↓') : ''}
    </th>
  );

  return (
    <div style={{ padding: '24px', maxWidth: 1280, margin: '0 auto' }}>

      {/* ── Tier 1: Header zone ────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Fetching prices…'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PortfolioSwitcher {...portfolios} />
            {holdings.length > 0 && (
              <>
                <button onClick={() => exportCSV(holdings, prices, fundamentals)} className="btn-outline">↓ CSV</button>
                <button onClick={refreshPrices} className="btn-outline">↻</button>
              </>
            )}
          </div>
        </div>

        {/* Stat row — 4 cards, stagger-enter */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 16 }}
        >
          <StatCard
            label="Total value"
            value={cost > 0 ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '—'}
            countUp={cost > 0 ? value : undefined}
            formatter={(v) => `$${Math.round(v).toLocaleString('en-US')}`}
            sub={holdings.length > 0 ? `${holdings.length} holding${holdings.length !== 1 ? 's' : ''}` : undefined}
            sparkData={portfolioTrend}
            sparkType="area"
          />
          <StatCard
            label="Today"
            value={cost > 0 && todayGain !== 0 ? `${todayGain >= 0 ? '+' : ''}$${Math.abs(todayGain).toFixed(0)}` : '—'}
            countUp={cost > 0 && todayGain !== 0 ? Math.abs(todayGain) : undefined}
            formatter={(v) => `${todayGain >= 0 ? '+' : '-'}$${Math.round(v).toLocaleString('en-US')}`}
            sub={cost > 0 && todayGain !== 0 ? 'vs yesterday close' : undefined}
            pnl={cost > 0 ? todayGain : undefined}
            sparkData={todayBars}
            sparkType="bar"
          />
          <StatCard
            label="Total return"
            value={cost > 0 ? `${gain >= 0 ? '+' : ''}$${Math.abs(gain).toFixed(0)}` : '—'}
            countUp={cost > 0 ? Math.abs(gain) : undefined}
            formatter={(v) => `${gain >= 0 ? '+' : '-'}$${Math.round(v).toLocaleString('en-US')}`}
            sub={cost > 0 ? `${gainPct >= 0 ? '+' : ''}${gainPct.toFixed(2)}%` : undefined}
            pnl={cost > 0 ? gain : undefined}
            sparkData={portfolioTrend}
            sparkType="area"
          />
          <StatCard
            label="Beta"
            value={beta != null ? beta.toFixed(2) : '—'}
            sub={beta != null ? (beta < 1 ? 'Low volatility' : beta < 1.5 ? 'Moderate risk' : 'High volatility') : undefined}
          />
        </motion.div>
      </div>

      {/* ── Tier 2: Primary content ────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        {holdings.length > 0 && <PortfolioChart />}

        {/* Holdings card */}
        <section className="card">
          {/* Card header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>Holdings</h2>
              {holdings.length > 0 && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '1px 8px' }}>
                  {holdings.length}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {holdings.length > 0 && (
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filter…"
                  className="input text-xs py-1 w-32"
                />
              )}
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-outline"
                style={{ fontSize: 13 }}
              >
                + Add holding
              </button>
            </div>
          </div>

          {/* Collapsible add form */}
          <AddHoldingForm
            onAdd={addHolding}
            open={showAddForm}
            onClose={() => setShowAddForm(false)}
          />

          {/* Table */}
          {loading && <p style={{ padding: '20px 24px', fontSize: 13, color: 'var(--text-muted)' }}>Loading…</p>}
          {error && <p style={{ padding: '20px 24px', fontSize: 13, color: 'var(--loss)' }}>Error: {error}</p>}
          {!loading && holdings.length === 0 && (
            <p style={{ padding: '20px 24px', fontSize: 13, color: 'var(--text-muted)' }}>
              No holdings yet. Use the button above to add your first stock.
            </p>
          )}

          {!loading && holdings.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <SortTh col="ticker" label="Ticker" />
                    <SortTh col="price" label="Price" right />
                    <SortTh col="today" label="Today" right />
                    <th style={{ ...thStyle(false), cursor: 'default' }}>7D</th>
                    <th style={thStyle(true)}>Shares</th>
                    <th style={thStyle(true)}>Cost</th>
                    <SortTh col="pl" label="P&L" right />
                    <SortTh col="upside" label="Upside" right />
                    <th style={thStyle(true)}>Short %</th>
                    <th style={{ padding: '10px 20px' }} />
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
                <p style={{ padding: '20px 24px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                  No holdings match "{search}"
                </p>
              )}
            </div>
          )}
        </section>
      </div>

      {/* ── Tier 3: Supporting widgets (scroll-reveal) ────────── */}
      {holdings.length > 0 && (() => {
        const widgets = [
          { key: 'sector',    node: <SectorChart holdings={holdings} prices={prices} fundamentals={fundamentals} /> },
          { key: 'benchmark', node: <BenchmarkChart holdings={holdings} candles={candles} /> },
          { key: 'rebalance', node: <RebalancePanel holdings={holdings} prices={prices} /> },
          { key: 'dividends', node: <DividendPanel dividends={dividends} holdings={holdings} prices={prices} /> },
          ...(holdings.length > 1 ? [{ key: 'corr', node: <CorrelationMatrix holdings={holdings} candles={candles} />, span2: true }] : []),
          { key: 'earnings',  node: <EarningsCalendar holdings={holdings} fundamentals={fundamentals} /> },
        ];
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
            {widgets.map((w, i) => (
              <motion.div
                key={w.key}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.32, ease: 'easeOut', delay: i * 0.06 }}
                style={w.span2 ? { gridColumn: 'span 2' } : undefined}
              >
                {w.node}
              </motion.div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
