import { useMemo, useState } from 'react';
import { AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePortfolio } from '../hooks/usePortfolio.js';
import { usePrices } from '../hooks/usePrices.js';
import { useMarket } from '../hooks/useMarket.js';
import {
  BadgeDollarSign, BarChart3, Bot, BrainCircuit, BriefcaseBusiness,
  CircleDollarSign, Compass, LayoutDashboard, Settings, TrendingDown, TrendingUp,
} from 'lucide-react';

const QUICK_LINKS = [
  { label: 'Dashboard', page: 'hub',       Icon: LayoutDashboard },
  { label: 'Markets',   page: 'discover',  Icon: BarChart3 },
  { label: 'Portfolio', page: 'portfolio', Icon: BriefcaseBusiness },
  { label: 'AI Tools',  page: 'advisor',   Icon: BrainCircuit },
  { label: 'Wallet',    page: 'settings',  Icon: CircleDollarSign },
  { label: 'Settings',  page: 'settings',  Icon: Settings },
];

const PERIODS = ['1D', '1W', '1M', '3M', 'YTD', '1Y'];
const PERIOD_META = {
  '1D': { count: 34, label: 'Intraday', drift: 0.012 },
  '1W': { count: 42, label: '7 day', drift: 0.028 },
  '1M': { count: 60, label: '30 day', drift: 0.052 },
  '3M': { count: 72, label: '90 day', drift: 0.11 },
  YTD: { count: 84, label: 'Year to date', drift: 0.16 },
  '1Y': { count: 96, label: '12 month', drift: 0.24 },
};

function fmt$(n) {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
function fmtPct(n) {
  if (n == null) return '—';
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
}

function seededChart(seed, count, endValue, period) {
  let s = Math.floor(Math.abs(seed)) || 12345;
  const rng = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
  const pts = [];
  const meta = PERIOD_META[period] ?? PERIOD_META['1M'];
  let v = endValue * (1 - meta.drift);
  for (let i = 0; i < count; i++) {
    const progress = i / Math.max(count - 1, 1);
    const trend = (endValue - v) / Math.max(count - i, 1);
    v += trend + (rng() - 0.48) * endValue * 0.008;
    v = Math.max(v, endValue * 0.55);
    pts.push({
      i,
      value: Math.round(v),
      label: period === '1D' ? `${9 + Math.floor(i / 5)}:${String((i % 5) * 12).padStart(2, '0')}` : `${Math.round(progress * 100)}%`,
    });
  }
  pts.push({ i: count, value: Math.round(endValue), label: 'Now' });
  return pts;
}

function PortfolioMiniList({ holdings, prices, portfolioValue, totalGainPct, isPos, setPage }) {
  return (
    <GlassCard style={{ flex: 1 }}>
      <div className="aura-hub-portfolio">
        <div className="aura-hub-portfolio__head">
          <CardTitle>My Portfolio</CardTitle>
          <span>Portfolio</span>
        </div>

        <div className="aura-hub-portfolio__rows">
          {holdings.length === 0 && (
            <div className="aura-hub-portfolio__empty">
              <strong>No holdings yet</strong>
              <span>Add your first position to start tracking this portfolio.</span>
            </div>
          )}
          {holdings.slice(0, 6).map(h => {
            const p = prices[h.ticker];
            const pct = p?.change_pct ?? 0;
            return (
              <div key={h.ticker} className="aura-hub-portfolio__row">
                <div className="aura-hub-portfolio__icon">
                  <BadgeDollarSign size={15} color="#bdefff" />
                </div>
                <div>
                  <strong>{h.ticker}</strong>
                  <span>{p ? fmt$(p.price) : '—'}</span>
                </div>
                <em className={pct >= 0 ? 'is-gain' : 'is-loss'}>{fmtPct(pct)}</em>
              </div>
            );
          })}
        </div>

        <div className="aura-hub-portfolio__total">
          <div>
            <span>Total Value</span>
            <strong>{fmt$(portfolioValue)}</strong>
          </div>
          <div>
            <span>All-time</span>
            <strong className={isPos ? 'is-gain' : 'is-loss'}>{fmtPct(totalGainPct)}</strong>
          </div>
        </div>
        <button onClick={() => setPage?.('portfolio')} className="aura-hub__portfolio-btn">
          View holdings
        </button>
      </div>
    </GlassCard>
  );
}

function GlassCard({ children, style, beamed = false }) {
  return (
    <div className={`aura-hub-card${beamed ? ' aura-hub-card--beamed' : ''}`} style={style}>
      {children}
    </div>
  );
}

function CardTitle({ children }) {
  return (
    <div className="aura-hub-card__title">
      {children}
    </div>
  );
}

export default function DashboardPage({ setPage, user }) {
  const { holdings } = usePortfolio();
  const hasHoldings = holdings.length > 0;
  const tickers = useMemo(() => holdings.map(h => h.ticker), [holdings]);
  const { prices } = usePrices(tickers);
  const { indices } = useMarket();
  const [period, setPeriod] = useState('1M');

  const portfolioValue = useMemo(
    () => holdings.reduce((s, h) => s + (prices[h.ticker]?.price ?? 0) * h.shares, 0),
    [holdings, prices],
  );
  const portfolioCost = useMemo(
    () => holdings.reduce((s, h) => s + h.cost_basis * h.shares, 0),
    [holdings],
  );
  const dailyPnl = useMemo(() => {
    let g = 0;
    for (const h of holdings) {
      const p = prices[h.ticker];
      if (!p?.price || !p?.change_pct) continue;
      g += p.price * h.shares * (p.change_pct / 100);
    }
    return g;
  }, [holdings, prices]);

  const totalGain = portfolioValue - portfolioCost;
  const totalGainPct = portfolioCost > 0 ? (totalGain / portfolioCost) * 100 : 0;

  const chartData = useMemo(() => {
    if (!hasHoldings || portfolioValue <= 0) return [];
    const meta = PERIOD_META[period] ?? PERIOD_META['1M'];
    return seededChart(portfolioValue + period.length * 777, meta.count, portfolioValue, period);
  }, [hasHoldings, portfolioValue, period]);
  const periodMeta = PERIOD_META[period] ?? PERIOD_META['1M'];
  const periodStart = chartData[0]?.value ?? portfolioValue;
  const periodChange = portfolioValue - periodStart;
  const periodChangePct = periodStart > 0 ? (periodChange / periodStart) * 100 : 0;
  const periodPos = periodChange >= 0;

  const sortedByChange = useMemo(() =>
    [...holdings]
      .filter(h => prices[h.ticker]?.change_pct != null)
      .sort((a, b) => (prices[b.ticker]?.change_pct ?? 0) - (prices[a.ticker]?.change_pct ?? 0)),
    [holdings, prices],
  );
  const topGainers = sortedByChange.slice(0, 3);
  const topLosers = sortedByChange.slice(-2).reverse();

  const spy = indices['SPY'];

  const isPos = portfolioValue >= portfolioCost;
  const dailyPos = dailyPnl >= 0;

  return (
    <div className="aura-hub">
      <div className="aura-hub__vignette" />

      {/* ── LEFT COLUMN ── */}
      <div className="aura-hub__left">

        {/* Quick Links */}
        <GlassCard>
          <div style={{ padding: '14px 14px 10px' }}>
            <CardTitle>Quick Links</CardTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {QUICK_LINKS.map(({ label, page, Icon }) => {
                const active = page === 'hub';
                return (
                  <button
                    key={label}
                    onClick={() => setPage?.(page)}
                    className={`aura-hub-link${active ? ' aura-hub-link--active' : ''}`}
                  >
                    <Icon size={15} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </GlassCard>

        {/* Market Overview */}
        <GlassCard>
          <div style={{ padding: '14px 14px 12px' }}>
            <CardTitle>Market Overview</CardTitle>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text)', lineHeight: 1.1, marginBottom: 8 }}>
              {spy ? fmt$(spy.price) : '—'}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'S&P 500', val: spy ? fmtPct(spy.change_pct) : '—', pos: spy?.change_pct >= 0 },
                { label: 'Portfolio', val: hasHoldings ? fmtPct(totalGainPct) : '—', pos: totalGainPct >= 0 },
                { label: 'Today', val: hasHoldings ? fmt$(dailyPnl) : '—', pos: dailyPos },
              ].map(({ label, val, pos }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>{label}</span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: pos ? 'var(--gain)' : 'var(--loss)', fontWeight: 600 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Top Gainers / Losers */}
        <GlassCard style={{ flex: 1 }}>
          <div style={{ padding: '14px 14px 12px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            <CardTitle>Top Gainers / Losers</CardTitle>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
              {topGainers.length === 0 && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {hasHoldings ? 'Loading…' : 'No holdings yet'}
                </span>
              )}
              {topGainers.map(h => {
                const p = prices[h.ticker];
                const pct = p?.change_pct ?? 0;
                return (
                  <div key={h.ticker} style={{ display: 'flex', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid rgba(160,180,255,0.06)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(124,92,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#a080ff', marginRight: 8, flexShrink: 0 }}>
                      {h.ticker.slice(0, 2)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>{h.ticker}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{p ? fmt$(p.price) : '—'}</div>
                    </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: pct >= 0 ? 'var(--gain)' : 'var(--loss)' }}>
                  {pct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {fmtPct(pct)}
                </span>
              </div>
                );
              })}
              {topLosers.length > 0 && (
                <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(160,180,255,0.08)' }}>
                  <div style={{ fontSize: 10, color: 'rgba(248,113,113,0.7)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>LOSERS</div>
                  {topLosers.map(h => {
                    const p = prices[h.ticker];
                    const pct = p?.change_pct ?? 0;
                    return (
                      <div key={h.ticker} style={{ display: 'flex', alignItems: 'center', padding: '4px 0' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(248,113,113,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'rgba(248,113,113,0.7)', marginRight: 8, flexShrink: 0 }}>
                          {h.ticker.slice(0, 2)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{h.ticker}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{p ? fmt$(p.price) : '—'}</div>
                        </div>
                        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--loss)' }}>{fmtPct(pct)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        <PortfolioMiniList
          holdings={holdings}
          prices={prices}
          portfolioValue={portfolioValue}
          totalGainPct={totalGainPct}
          isPos={isPos}
          setPage={setPage}
        />
      </div>

      {/* ── CENTER COLUMN ── */}
      <div className="aura-hub__center">

        {/* Main Portfolio chart */}
        <GlassCard style={{ width: '100%' }}>
          <div className="aura-hub-chart-head">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
              <div>
                <CardTitle>Main Portfolio</CardTitle>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span className="aura-hub-chart-value">
                    {portfolioValue > 0 ? `$${Math.round(portfolioValue).toLocaleString('en-US')}` : '—'}
                  </span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: dailyPos ? 'var(--gain)' : 'var(--loss)', fontWeight: 600 }}>
                    {dailyPnl !== 0 ? (dailyPos ? '+' : '') + fmt$(dailyPnl) : ''}
                  </span>
                </div>
                <p className="aura-hub-chart-subtitle">
                  {periodMeta.label} portfolio value, daily P&L, and benchmark context.
                </p>
              </div>
              {/* Period switcher */}
              <div className="aura-hub-periods" aria-label="Portfolio chart range">
                {PERIODS.map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={period === p ? 'is-active' : ''}
                    aria-pressed={period === p}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="aura-hub-chart-context">
              <div>
                <span>Range return</span>
                <strong className={periodPos ? 'is-gain' : 'is-loss'}>
                  {hasHoldings ? `${fmt$(periodChange)} (${fmtPct(periodChangePct)})` : '—'}
                </strong>
              </div>
              <div>
                <span>Cost basis</span>
                <strong>{fmt$(portfolioCost)}</strong>
              </div>
              <div>
                <span>Winners</span>
                <strong>{sortedByChange.filter(h => (prices[h.ticker]?.change_pct ?? 0) > 0).length} / {holdings.length}</strong>
              </div>
            </div>
          </div>
          <div className="aura-hub-chart-body">
            {hasHoldings ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 18, right: 22, bottom: 12, left: 4 }}>
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isPos ? '#9070ff' : '#f87171'} stopOpacity={0.65} />
                      <stop offset="60%" stopColor={isPos ? '#7c5cff' : '#f87171'} stopOpacity={0.20} />
                      <stop offset="100%" stopColor={isPos ? '#7c5cff' : '#f87171'} stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(219,244,255,0.07)" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    tick={{ fill: 'rgba(200,211,238,0.58)', fontSize: 10 }}
                  />
                  <YAxis
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `$${Math.round(v / 1000)}k`}
                    tick={{ fill: 'rgba(200,211,238,0.58)', fontSize: 10 }}
                    width={46}
                  />
                  <Area
                    type="monotone" dataKey="value"
                    stroke={isPos ? '#a080ff' : '#f87171'} strokeWidth={3}
                    fill="url(#chartGrad)" dot={false}
                    activeDot={{ r: 4, fill: '#a080ff', strokeWidth: 0 }}
                  />
                  <Tooltip
                    formatter={(v) => [fmt$(v), 'Portfolio value']}
                    contentStyle={{ background: 'rgba(15,22,50,0.9)', border: '1px solid rgba(124,92,255,0.25)', borderRadius: 8, fontSize: 11 }}
                    labelFormatter={(label) => `${period} • ${label}`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="aura-hub-chart-empty">
                <strong>No portfolio history yet</strong>
                <span>Add holdings to populate this chart.</span>
              </div>
            )}
          </div>
        </GlassCard>

        <div className="aura-hub__insight-row">
          <GlassCard beamed>
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Bot size={18} color="#bdefff" />
                <CardTitle>AI Insights</CardTitle>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, margin: 0, marginBottom: 12 }}>
                Aura AI assistant for portfolio intelligence. Visible market opportunities are detected by reading financial trends and visible correlations across your holdings.
              </p>
              <button
                onClick={() => setPage?.('advisor')}
                style={{ fontSize: 11, color: '#7c5cff', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-sans)', fontWeight: 500 }}
              >
                Learn more →
              </button>
            </div>
          </GlassCard>

          <GlassCard>
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Compass size={18} color="#bdefff" />
                <CardTitle>Portfolio Signal</CardTitle>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, margin: 0, marginBottom: 12 }}>
                {holdings.length > 0
                  ? `${holdings.length} holdings tracked. ${sortedByChange.filter(h => (prices[h.ticker]?.change_pct ?? 0) > 1).length} positions are up more than 1% today.`
                  : 'Add holdings to your portfolio to see AI-powered signals and buy/sell opportunities.'}
              </p>
              <button
                onClick={() => setPage?.('coach')}
                style={{ fontSize: 11, color: '#38b2ff', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-sans)', fontWeight: 500 }}
              >
                Learn more →
              </button>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ── RIGHT COLUMN ── */}
      <div className="aura-hub__right">
      </div>
    </div>
  );
}
