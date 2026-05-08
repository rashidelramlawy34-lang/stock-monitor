import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#a3e635',
];

const LABEL = {
  Technology: 'Tech',
  'Health Care': 'Health',
  Financials: 'Finance',
  'Consumer Discretionary': 'Cons. Disc.',
  'Consumer Staples': 'Cons. Staples',
  Industrials: 'Industrials',
  Energy: 'Energy',
  Materials: 'Materials',
  Utilities: 'Utilities',
  'Real Estate': 'Real Est.',
  'Communication Services': 'Comms',
};

export default function SectorChart({ holdings, prices, fundamentals }) {
  if (!holdings?.length) return null;

  const sectorValues = {};
  for (const h of holdings) {
    const price = prices?.[h.ticker]?.price ?? h.avg_cost;
    const sector = fundamentals?.[h.ticker]?.sector;
    if (!sector) continue;
    const value = price * h.shares;
    sectorValues[sector] = (sectorValues[sector] ?? 0) + value;
  }

  const data = Object.entries(sectorValues)
    .map(([name, value]) => ({ name, short: LABEL[name] ?? name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="card p-4">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
        Sector Allocation
      </p>
      <div className="flex items-center gap-4">
        <div style={{ width: 120, height: 120, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%" cy="50%"
                innerRadius={34} outerRadius={54}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [`$${v.toLocaleString()}`, '']}
                contentStyle={{
                  background: 'var(--tooltip-bg, #1e2537)',
                  border: '1px solid #1e2d45',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#e2e8f0',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-slate-600 dark:text-slate-400 truncate">{d.short}</span>
              <span className="ml-auto text-slate-500 dark:text-slate-500 font-mono pl-2">
                {((d.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
