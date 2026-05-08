import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = [
  '#00d4ff', '#00e676', '#ffaa00', '#ff3355', '#0066ff',
  '#ff6b35', '#ffa800', '#00b8e6', '#8b5cf6', '#06b6d4',
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
      <p className="hud-label mb-3">Sector Allocation</p>
      <div className="flex items-center gap-4">
        <div style={{ width: 120, height: 120, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%" cy="50%"
                innerRadius={34} outerRadius={54}
                dataKey="value"
                strokeWidth={1}
                stroke="rgba(0,212,255,0.1)"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [`$${v.toLocaleString()}`, '']}
                contentStyle={{
                  background: '#071220',
                  border: '1px solid rgba(0,212,255,0.3)',
                  borderRadius: 4,
                  fontSize: 11,
                  color: '#a8d8ea',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-1.5 min-w-0">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-[rgba(0,212,255,0.5)] truncate">{d.short}</span>
              <span className="ml-auto font-mono text-[#a8d8ea] pl-2">
                {((d.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
