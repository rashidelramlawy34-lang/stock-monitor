import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';

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
    <div style={{ background: '#070d18', border: '1px solid rgba(0,212,255,0.25)', borderRadius: 8 }}
      className="px-3 py-2.5 text-xs shadow-xl">
      <p className="text-muted mb-1">{label}</p>
      <p className="font-mono font-bold text-[#00d4ff] text-base">
        ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}

export default function PortfolioChart() {
  const { data, loading } = usePortfolioHistory();

  if (loading) {
    return (
      <div className="card p-5 animate-pulse">
        <div className="h-4 bg-[rgba(0,212,255,0.06)] rounded-full w-1/4 mb-4" />
        <div className="h-[320px] bg-[rgba(0,212,255,0.03)] rounded-lg" />
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

  const first = data[0].value;
  const last = data[data.length - 1].value;
  const change = last - first;
  const changePct = first > 0 ? (change / first) * 100 : 0;
  const positive = change >= 0;
  const strokeColor = positive ? '#00e676' : '#ff3355';
  const gradientId = 'pcg';

  const minVal = Math.min(...data.map(d => d.value));
  const maxVal = Math.max(...data.map(d => d.value));
  const padding = (maxVal - minVal) * 0.12 || 100;

  const openValue = first;

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="hud-label mb-1">Portfolio Value</p>
          <p className="text-3xl font-bold font-mono text-[#a8d8ea] tracking-tight">
            ${last.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className={`text-right ${positive ? 'text-bull' : 'text-bear'}`}>
          <p className="text-xl font-bold font-mono">
            {positive ? '+' : ''}${Math.abs(change).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm font-semibold font-mono">
            {positive ? '+' : ''}{changePct.toFixed(2)}%
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
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
            stroke="rgba(0,212,255,0.04)"
          />
          <XAxis
            dataKey="dateOnly"
            tick={{ fill: 'rgba(0,212,255,0.35)', fontSize: 10, fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minVal - padding, maxVal + padding]}
            tick={{ fill: 'rgba(0,212,255,0.35)', fontSize: 10, fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
            width={44}
          />
          <ReferenceLine
            y={openValue}
            stroke="rgba(0,212,255,0.15)"
            strokeDasharray="4 4"
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'rgba(0,212,255,0.3)', strokeWidth: 1, strokeDasharray: '4 4' }}
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
            animationDuration={800}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
