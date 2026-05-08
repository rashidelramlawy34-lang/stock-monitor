import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
    <div className="bg-white dark:bg-[#1e2537] border border-slate-200 dark:border-[#1e2d45] rounded-lg px-3 py-2 shadow-card text-xs">
      <p className="text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
      <p className="font-semibold text-slate-800 dark:text-slate-200">
        ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}

export default function PortfolioChart() {
  const { data, loading } = usePortfolioHistory();

  if (loading) {
    return (
      <div className="card p-5 mb-6 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4" />
        <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded" />
      </div>
    );
  }

  if (data.length < 3) {
    return (
      <div className="card p-5 mb-6">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Portfolio Value (7 days)</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">Chart will appear once price history accumulates (prices are sampled every 30 seconds).</p>
      </div>
    );
  }

  const first = data[0].value;
  const last = data[data.length - 1].value;
  const change = last - first;
  const changePct = first > 0 ? (change / first) * 100 : 0;
  const positive = change >= 0;
  const strokeColor = positive ? '#22c55e' : '#ef4444';
  const gradientId = 'pcg';

  const minVal = Math.min(...data.map(d => d.value));
  const maxVal = Math.max(...data.map(d => d.value));
  const padding = (maxVal - minVal) * 0.1 || 10;

  return (
    <div className="card p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Portfolio Value (7 days)</h2>
        </div>
        <span className={`text-sm font-semibold ${positive ? 'text-bull' : 'text-bear'}`}>
          {positive ? '+' : ''}${Math.abs(change).toFixed(2)} ({positive ? '+' : ''}{changePct.toFixed(2)}%)
        </span>
      </div>
      <ResponsiveContainer width="100%" height={100}>
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.15} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" hide />
          <YAxis domain={[minVal - padding, maxVal + padding]} hide />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 3, fill: strokeColor, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
