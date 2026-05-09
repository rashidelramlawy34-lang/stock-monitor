import { useEffect, useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';

const RANGES = ['1W', '1M', '3M', '6M', 'YTD', '1Y', 'ALL'];

function getRangeCutoff(range) {
  const now = Date.now() / 1000;
  if (range === 'ALL') return 0;
  if (range === 'YTD') return new Date(new Date().getFullYear(), 0, 1).getTime() / 1000;
  const days = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
  return now - (days[range] ?? 0) * 86400;
}

function usePortfolioHistory() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/portfolio/history')
      .then(r => r.json())
      .then(points => {
        setData(points.map(p => ({
          ts: p.ts,
          value: p.value,
          label: new Date(p.ts * 1000).toLocaleString('en-US', {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
          }),
          dateOnly: new Date(p.ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { value, label } = payload[0].payload;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 8 }}
      className="px-3 py-2.5 text-xs shadow-xl">
      <p className="text-muted mb-1">{label}</p>
      <p className="font-mono font-bold text-[var(--accent)] text-base">
        ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}


export default function PortfolioChart() {
  const { data, loading } = usePortfolioHistory();
  const [range, setRange] = useState('1M');

  const filtered = useMemo(() => {
    const cutoff = getRangeCutoff(range);
    const result = data.filter(d => d.ts >= cutoff);
    return result.length >= 2 ? result : data;
  }, [data, range]);

  if (loading) {
    return (
      <div className="card p-5 animate-pulse">
        <div className="h-4 bg-[var(--surface-2)] rounded-full w-1/4 mb-4" />
        <div className="h-[320px] bg-[var(--surface-2)] rounded-lg" />
      </div>
    );
  }

  if (data.length < 3) {
    return (
      <div className="card p-5">
        <p className="hud-label mb-2">Portfolio Value</p>
        <p className="text-xs text-muted">Chart will appear once price history accumulates.</p>
      </div>
    );
  }

  const first = filtered[0].value;
  const last = filtered[filtered.length - 1].value;
  const change = last - first;
  const changePct = first > 0 ? (change / first) * 100 : 0;
  const positive = change >= 0;
  const strokeColor = positive ? '#16a34a' : '#dc2626';
  const gradientId = 'pcg';

  const minVal = Math.min(...filtered.map(d => d.value));
  const maxVal = Math.max(...filtered.map(d => d.value));
  const padding = (maxVal - minVal) * 0.12 || 100;

  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <p className="stat-label">PORTFOLIO VALUE</p>
          <p style={{ fontSize: 28, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text)', lineHeight: 1.1, marginTop: 6 }}>
            ${last.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div style={{ textAlign: 'right', color: positive ? 'var(--bull)' : 'var(--bear)' }}>
          <p style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            {positive ? '+' : ''}${Math.abs(change).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {positive ? '+' : ''}{changePct.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Range selector */}
      <div className="pill-group" style={{ marginBottom: 14 }}>
        {RANGES.map(r => (
          <button key={r} className={`pill${range === r ? ' active' : ''}`} onClick={() => setRange(r)}>{r}</button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={filtered} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
              <stop offset="60%" stopColor={strokeColor} stopOpacity={0.06} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="0"
            horizontal={true} vertical={false}
            stroke="var(--surface-2)"
          />
          <XAxis
            dataKey="dateOnly"
            tick={{ fill: 'var(--text-3)', fontSize: 10, fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minVal - padding, maxVal + padding]}
            tick={{ fill: 'var(--text-3)', fontSize: 10, fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
            width={44}
          />
          <ReferenceLine
            y={first}
            stroke="var(--border)"
            strokeDasharray="4 4"
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'var(--border-2)', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 5, fill: strokeColor, stroke: '#010409', strokeWidth: 2 }}
            isAnimationActive={true}
            animationDuration={600}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
