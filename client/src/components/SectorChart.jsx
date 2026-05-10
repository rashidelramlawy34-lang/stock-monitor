import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';

const COLORS = [
  '#7c5cff', '#4ade80', '#fbbf24', '#f87171', '#38b2ff',
  '#fb923c', '#a78bfa', '#34d399', '#e879f9', '#22d3ee',
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

function ActiveShape({ cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill }) {
  return (
    <Sector
      cx={cx} cy={cy}
      innerRadius={innerRadius - 3}
      outerRadius={outerRadius + 6}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, pct } = payload[0].payload;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 8 }}
      className="px-3 py-2.5 text-xs shadow-xl">
      <p className="text-muted mb-1">{name}</p>
      <p className="font-mono font-bold text-[var(--text-2)]">${value.toLocaleString()}</p>
      <p className="font-mono text-[var(--accent)] mt-0.5">{pct}%</p>
    </div>
  );
}

export default function SectorChart({ holdings, prices, fundamentals }) {
  const [activeIdx, setActiveIdx] = useState(null);

  if (!holdings?.length) return null;

  const sectorValues = {};
  for (const h of holdings) {
    const price = prices?.[h.ticker]?.price ?? h.avg_cost;
    const sector = fundamentals?.[h.ticker]?.sector;
    if (!sector) continue;
    const value = price * h.shares;
    sectorValues[sector] = (sectorValues[sector] ?? 0) + value;
  }

  const total = Object.values(sectorValues).reduce((s, v) => s + v, 0);
  const data = Object.entries(sectorValues)
    .map(([name, value]) => ({
      name,
      short: LABEL[name] ?? name,
      value: Math.round(value),
      pct: total > 0 ? ((value / total) * 100).toFixed(1) : '0.0',
    }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) return null;

  return (
    <div className="card p-5">
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 16 }}>Sector allocation</p>
      <div className="flex items-center gap-5">
        <div style={{ width: 160, height: 160, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%" cy="50%"
                innerRadius={44} outerRadius={68}
                dataKey="value"
                strokeWidth={2}
                stroke="#070d18"
                activeIndex={activeIdx}
                activeShape={<ActiveShape />}
                onMouseEnter={(_, idx) => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
                isAnimationActive={true}
                animationDuration={600}
                animationEasing="ease-out"
              >
                {data.map((_, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                    opacity={activeIdx === null || activeIdx === i ? 1 : 0.4}
                    style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-2 min-w-0 flex-1">
          {data.map((d, i) => (
            <div
              key={d.name}
              className="flex items-center gap-2 text-xs cursor-default"
              style={{ opacity: activeIdx === null || activeIdx === i ? 1 : 0.4, transition: 'opacity 0.15s' }}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-[var(--text-2)] truncate">{d.short}</span>
              <span className="ml-auto font-mono text-[var(--text-2)] pl-2 shrink-0">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
